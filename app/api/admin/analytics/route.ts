import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { WHERE_DOCUMENTOS_POR_APROBAR } from '@/lib/documentos'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CONCEPTOS_COMISIONABLES } from '@/lib/comisiones'
// Mismo formato de pesos que las tarjetas y los gráficos de Analytics.
import { pesos } from '@/components/admin/analytics/tema'
import type { ConceptoPago, EstadoTramite } from '@prisma/client'

/** "oct" → "Oct": etiqueta corta del mes, en castellano. */
const mesCorto = (d: Date) => {
  const m = format(d, 'MMM', { locale: es }).replace('.', '')
  return m.charAt(0).toUpperCase() + m.slice(1)
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const periodo = searchParams.get('periodo') || 'mes' // dia, semana, mes, año
    const jurisdiccion = searchParams.get('jurisdiccion') // cordoba, caba, todas

    // Calcular fechas según el período
    let fechaInicio: Date
    let fechaFin = new Date()

    switch (periodo) {
      case 'dia':
        fechaInicio = new Date()
        fechaInicio.setHours(0, 0, 0, 0)
        break
      case 'semana':
        fechaInicio = new Date()
        fechaInicio.setDate(fechaInicio.getDate() - 7)
        break
      case 'año':
        fechaInicio = new Date()
        fechaInicio.setFullYear(fechaInicio.getFullYear() - 1)
        break
      case 'mes':
      default:
        fechaInicio = startOfMonth(new Date())
        fechaFin = endOfMonth(new Date())
    }

    // Filtro de jurisdicción
    const jurisdiccionFilter = jurisdiccion && jurisdiccion !== 'todas' 
      ? { jurisdiccion: jurisdiccion.toUpperCase() as 'CORDOBA' | 'CABA' }
      : {}

    // Todas las consultas van en una sola tanda. Antes eran ~17 tandas
    // secuenciales y cada una pagaba la ida y vuelta a la base (~6-7 s en
    // total); ahora el tiempo es el de la consulta más lenta más, a lo sumo,
    // una dependencia encadenada.
    const ahora = new Date()
    const filtroEnCurso = { in: ['INICIADO', 'EN_PROCESO', 'ESPERANDO_CLIENTE', 'ESPERANDO_APROBACION'] as EstadoTramite[] }
    const filtroTramitePorJurisdiccion = jurisdiccionFilter.jurisdiccion ? { jurisdiccion: jurisdiccionFilter.jurisdiccion } : undefined
    const conceptosIngreso = { in: CONCEPTOS_COMISIONABLES as ConceptoPago[] }

    // Ingresos computables = lo mismo que se liquida a las partes y lo que dice
    // el reporte mensual: los movimientos de comisiones (honorarios y domicilio).
    // Antes se sumaban todos los pagos aprobados, incluidas tasas y depósitos de
    // capital que el cliente paga a terceros, y el número no coincidía.
    // MovimientoComision no tiene relación con Tramite: con jurisdicción se
    // filtra por los ids (la única consulta de la que dependen los movimientos).
    const idsJurisdiccionP = jurisdiccionFilter.jurisdiccion
      ? prisma.tramite.findMany({ where: jurisdiccionFilter, select: { id: true } }).then(ts => ts.map(t => t.id))
      : Promise.resolve(null)
    // Los movimientos se fechan a la medianoche UTC del día calendario: se
    // compara contra el día calendario del inicio del rango.
    const sumaMovimientos = (desde: Date, hasta: Date) =>
      idsJurisdiccionP.then(ids =>
        prisma.movimientoComision.aggregate({
          where: {
            excluido: false,
            fecha: { gte: new Date(Date.UTC(desde.getFullYear(), desde.getMonth(), desde.getDate())), lte: hasta },
            ...(ids ? { tramiteId: { in: ids } } : {}),
          },
          _sum: { monto: true },
          _count: true
        })
      )

    // Últimos 6 meses (para los gráficos por mes)
    const ultimosSeisMeses = [5, 4, 3, 2, 1, 0].map(i => {
      const mes = subMonths(ahora, i)
      return { mes, inicio: startOfMonth(mes), fin: endOfMonth(mes) }
    })

    const cincoDiasAtras = new Date()
    cincoDiasAtras.setDate(cincoDiasAtras.getDate() - 5)

    const mesAnteriorInicio = startOfMonth(subMonths(ahora, 1))
    const mesAnteriorFin = endOfMonth(subMonths(ahora, 1))

    // 10. TIEMPO PROMEDIO POR ETAPA: los trámites completados y, encadenado,
    // la primera vez que cada uno pasó a EN_PROCESO (= formulario validado).
    const tiemposP = prisma.tramite.findMany({
      where: {
        estadoGeneral: 'COMPLETADO',
        sociedadInscripta: true,
        fechaSociedadInscripta: { not: null },
        ...jurisdiccionFilter
      },
      select: {
        id: true,
        fechaFormularioCompleto: true,
        fechaDenominacionReservada: true,
        fechaCapitalDepositado: true,
        fechaDocumentosFirmados: true,
        fechaSociedadInscripta: true
      },
      take: 50, // Últimos 50 trámites completados
      orderBy: { fechaSociedadInscripta: 'desc' }
    }).then(async tramites => ({
      tramites,
      historiales: tramites.length > 0
        ? await prisma.historialEstado.findMany({
            where: {
              tramiteId: { in: tramites.map(t => t.id) },
              estadoNuevo: 'EN_PROCESO'
            },
            select: { tramiteId: true, createdAt: true },
            orderBy: { createdAt: 'asc' }
          })
        : []
    }))

    // Embudo: leads que nunca abrieron cuenta (sin usuario vinculado ni uno
    // con su email). Encadenado: primero los leads, después los emails.
    const leadsSinCuentaP = prisma.lead.findMany({ where: { userId: null }, select: { email: true } })
      .then(async leadsSinUsuario => {
        const emailsLeads = leadsSinUsuario.map(l => l.email?.toLowerCase()).filter((e): e is string => !!e)
        const emailsConCuenta = emailsLeads.length > 0
          ? new Set(
              (await prisma.user.findMany({
                where: { email: { in: emailsLeads, mode: 'insensitive' } },
                select: { email: true }
              })).map(u => u.email.toLowerCase())
            )
          : new Set<string>()
        return leadsSinUsuario.filter(l => !l.email || !emailsConCuenta.has(l.email.toLowerCase())).length
      })

    const [
      // 1. Trámites
      tramitesTotales,
      tramitesEnCurso,
      tramitesCompletados,
      tramitesCancelados,
      tramitesPeriodo,
      tramitesPorMes,
      tramitesPorJurisdiccion,
      // 2. Ingresos
      pagosPeriodo,
      pagosPendientes,
      ingresosPorPlan,
      ingresosPorMes,
      // 3. Clientes
      usuariosRegistrados,
      usuariosActivos,
      usuariosNuevos,
      usuariosConTramite,
      usuariosConSociedad,
      // 4. Documentos
      documentosTotales,
      documentosAprobados,
      documentosRechazados,
      documentosPendientes,
      documentosRechazadosPorTipo,
      // 5. Alertas
      tramitesEstancados,
      // 6. Últimos trámites
      ultimosTramites,
      // 9. Comparativas vs mes anterior
      tramitesMesAnterior,
      ingresosMesAnterior,
      clientesMesAnterior,
      // 10. Tiempos
      tiempos,
      // Embudo
      leadsConsulta,
      leadsBorrador,
      perdidosPorMotivo,
      leadsSinCuenta,
    ] = await Promise.all([
      prisma.tramite.count({ where: jurisdiccionFilter }),
      prisma.tramite.count({ where: { estadoGeneral: filtroEnCurso, ...jurisdiccionFilter } }),
      prisma.tramite.count({ where: { estadoGeneral: 'COMPLETADO', ...jurisdiccionFilter } }),
      prisma.tramite.count({ where: { estadoGeneral: 'CANCELADO', ...jurisdiccionFilter } }),
      prisma.tramite.count({ where: { createdAt: { gte: fechaInicio, lte: fechaFin }, ...jurisdiccionFilter } }),
      Promise.all(ultimosSeisMeses.map(({ mes, inicio, fin }) =>
        prisma.tramite.count({ where: { createdAt: { gte: inicio, lte: fin }, ...jurisdiccionFilter } })
          .then(cantidad => ({ mes: mesCorto(mes), cantidad }))
      )),
      prisma.tramite.groupBy({ by: ['jurisdiccion'], _count: true }),

      sumaMovimientos(fechaInicio, fechaFin),
      prisma.pago.aggregate({
        where: { estado: 'PENDIENTE', concepto: conceptosIngreso, tramite: filtroTramitePorJurisdiccion },
        _sum: { monto: true },
        _count: true
      }),
      // Ingresos por plan (estimado basado en concepto del pago)
      prisma.pago.groupBy({
        by: ['concepto'],
        where: {
          estado: 'APROBADO',
          concepto: conceptosIngreso,
          fechaPago: { gte: fechaInicio, lte: fechaFin },
          tramite: filtroTramitePorJurisdiccion
        },
        _sum: { monto: true },
        _count: true
      }),
      Promise.all(ultimosSeisMeses.map(({ mes, inicio, fin }) =>
        sumaMovimientos(inicio, fin).then(r => ({ mes: mesCorto(mes), ingresos: r._sum.monto || 0 }))
      )),

      prisma.user.count(),
      prisma.user.count({ where: { tramites: { some: { estadoGeneral: filtroEnCurso } } } }),
      prisma.user.count({ where: { createdAt: { gte: fechaInicio, lte: fechaFin } } }),
      prisma.user.count({ where: { tramites: { some: {} } } }),
      prisma.user.count({ where: { tramites: { some: { estadoGeneral: 'COMPLETADO' } } } }),

      prisma.documento.count(),
      prisma.documento.count({ where: { estado: 'APROBADO' } }),
      prisma.documento.count({ where: { estado: 'RECHAZADO' } }),
      // El borrador y los papeles para firmar se crean PENDIENTE pero los
      // revisa el cliente: no son trabajo pendiente nuestro.
      prisma.documento.count({ where: WHERE_DOCUMENTOS_POR_APROBAR }),
      // Documentos más rechazados por tipo
      prisma.documento.groupBy({
        by: ['tipo'],
        where: { estado: 'RECHAZADO' },
        _count: true,
        orderBy: { _count: { tipo: 'desc' } },
        take: 5
      }),

      // Trámites estancados (más de 5 días sin actualizar)
      prisma.tramite.count({
        where: {
          estadoGeneral: { in: ['EN_PROCESO', 'ESPERANDO_CLIENTE', 'ESPERANDO_APROBACION'] },
          updatedAt: { lt: cincoDiasAtras },
          ...jurisdiccionFilter
        }
      }),

      // Solo los campos que muestra la tabla
      prisma.tramite.findMany({
        where: jurisdiccionFilter,
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          denominacionSocial1: true,
          estadoGeneral: true,
          jurisdiccion: true,
          createdAt: true,
          user: { select: { name: true, email: true } }
        }
      }),

      prisma.tramite.count({ where: { createdAt: { gte: mesAnteriorInicio, lte: mesAnteriorFin }, ...jurisdiccionFilter } }),
      sumaMovimientos(mesAnteriorInicio, mesAnteriorFin),
      prisma.user.count({ where: { createdAt: { gte: mesAnteriorInicio, lte: mesAnteriorFin } } }),

      tiemposP,

      prisma.lead.count(),
      prisma.tramite.count({ where: { formularioCompleto: false } }),
      prisma.lead.groupBy({
        by: ['motivoPerdida'],
        where: { estado: 'DESCARTADO', motivoPerdida: { not: null } },
        _count: { _all: true },
      }),
      leadsSinCuentaP,
    ])

    // 5. ALERTAS
    const alertas = []

    if (tramitesEstancados > 0) {
      alertas.push({
        tipo: 'warning',
        mensaje: `${tramitesEstancados} trámites llevan +5 días sin avanzar`,
        valor: tramitesEstancados
      })
    }

    // Pagos pendientes
    if ((pagosPendientes._count || 0) > 0) {
      alertas.push({
        tipo: 'info',
        mensaje: `${pagosPendientes._count} pagos pendientes por ${pesos(pagosPendientes._sum.monto || 0)}`,
        valor: pagosPendientes._count
      })
    }

    // Documentos pendientes de revisión
    if (documentosPendientes > 5) {
      alertas.push({
        tipo: 'warning',
        mensaje: `${documentosPendientes} documentos esperando revisión`,
        valor: documentosPendientes
      })
    }

    // Meta del mes (20 trámites)
    const metaMes = 20
    const progresoMeta = (tramitesPeriodo / metaMes) * 100
    if (progresoMeta >= 100) {
      alertas.push({
        tipo: 'success',
        mensaje: `🎉 Meta del mes alcanzada: ${tramitesPeriodo}/${metaMes} trámites`,
        valor: tramitesPeriodo
      })
    } else if (progresoMeta >= 85) {
      alertas.push({
        tipo: 'info',
        mensaje: `Meta del mes: ${tramitesPeriodo}/${metaMes} trámites (${Math.round(progresoMeta)}%)`,
        valor: tramitesPeriodo
      })
    }

    // 7. TASAS DE CONVERSIÓN
    const tasaRegistroATramite = usuariosRegistrados > 0 
      ? (usuariosConTramite / usuariosRegistrados) * 100 
      : 0

    const tasaTramiteACompletado = tramitesTotales > 0 
      ? (tramitesCompletados / tramitesTotales) * 100 
      : 0

    const calcularCambio = (actual: number, anterior: number) => {
      if (anterior === 0) return actual > 0 ? 100 : 0
      return ((actual - anterior) / anterior) * 100
    }

    const comparativas = {
      tramites: {
        actual: tramitesPeriodo,
        anterior: tramitesMesAnterior,
        cambio: calcularCambio(tramitesPeriodo, tramitesMesAnterior),
        esPositivo: tramitesPeriodo >= tramitesMesAnterior
      },
      ingresos: {
        actual: pagosPeriodo._sum.monto || 0,
        anterior: ingresosMesAnterior._sum.monto || 0,
        cambio: calcularCambio(pagosPeriodo._sum.monto || 0, ingresosMesAnterior._sum.monto || 0),
        esPositivo: (pagosPeriodo._sum.monto || 0) >= (ingresosMesAnterior._sum.monto || 0)
      },
      clientes: {
        actual: usuariosNuevos,
        anterior: clientesMesAnterior,
        cambio: calcularCambio(usuariosNuevos, clientesMesAnterior),
        esPositivo: usuariosNuevos >= clientesMesAnterior
      }
    }

    // 10. TIEMPO PROMEDIO POR ETAPA (desde validación hasta inscripción)
    // Cada etapa se mide con las fechas que el admin marca en el trámite. Antes
    // los días por etapa estaban fijos en el código (1,5 / 1 / 1,5 / 1) y se
    // mostraban como si fueran datos.
    const tramitesCompletadosConFechas = tiempos.tramites
    const historialesValidacion = tiempos.historiales
    const DIA_MS = 1000 * 60 * 60 * 24
    // Días entre dos hitos. Si falta una fecha o quedaron cargadas al revés
    // (pasa con trámites viejos cargados a mano), ese trámite no cuenta.
    const dias = (desde: Date | null | undefined, hasta: Date | null | undefined) => {
      if (!desde || !hasta) return null
      const diff = (hasta.getTime() - desde.getTime()) / DIA_MS
      return diff >= 0 ? diff : null
    }
    // Con menos de esta cantidad de casos el promedio no dice nada: la etapa
    // sale como «sin datos suficientes» en vez de un número.
    const MUESTRA_MINIMA = 3
    const promedio = (valores: (number | null)[]) => {
      const validos = valores.filter((v): v is number => v !== null)
      return validos.length >= MUESTRA_MINIMA
        ? validos.reduce((a, b) => a + b, 0) / validos.length
        : null
    }

    const fechasValidacion = new Map<string, Date>()
    historialesValidacion.forEach(h => {
      if (!fechasValidacion.has(h.tramiteId)) fechasValidacion.set(h.tramiteId, h.createdAt)
    })

    const ts = tramitesCompletadosConFechas
    const tiemposPromedio = {
      // Desde Reserva de Nombre hasta Inscripción
      total: promedio(ts.map(t => dias(t.fechaDenominacionReservada, t.fechaSociedadInscripta))),
      // Desde validación del formulario hasta Inscripción
      desdeValidacion: promedio(ts.map(t => dias(fechasValidacion.get(t.id), t.fechaSociedadInscripta))),
      porEtapa: {
        reservaDenominacion: promedio(ts.map(t => dias(t.fechaFormularioCompleto, t.fechaDenominacionReservada))),
        depositoCapital: promedio(ts.map(t => dias(t.fechaDenominacionReservada, t.fechaCapitalDepositado))),
        firmaEstatuto: promedio(ts.map(t => dias(t.fechaCapitalDepositado, t.fechaDocumentosFirmados))),
        inscripcion: promedio(ts.map(t => dias(t.fechaDocumentosFirmados, t.fechaSociedadInscripta)))
      },
      muestra: ts.length
    }

    return NextResponse.json({
      tramites: {
        totales: tramitesTotales,
        enCurso: tramitesEnCurso,
        completados: tramitesCompletados,
        cancelados: tramitesCancelados,
        periodo: tramitesPeriodo,
        porMes: tramitesPorMes,
        porJurisdiccion: tramitesPorJurisdiccion,
        tasaCompletitud: tramitesTotales > 0 ? ((tramitesCompletados / tramitesTotales) * 100).toFixed(1) : 0
      },
      ingresos: {
        periodo: pagosPeriodo._sum.monto || 0,
        pendientes: pagosPendientes._sum.monto || 0,
        cantidadPagos: pagosPeriodo._count || 0,
        porPlan: ingresosPorPlan,
        // Ticket promedio por cobro del período (igual que en el reporte
        // mensual). Antes dividía por todos los trámites completados de la
        // historia, y el número bajaba solo con el tiempo.
        promedioPorTramite: pagosPeriodo._count > 0
          ? Math.round((pagosPeriodo._sum.monto || 0) / pagosPeriodo._count)
          : 0,
        porMes: ingresosPorMes
      },
      leads: {
        // El embudo arrancaba en «registrados», o sea después de que la persona
        // ya decidió abrir una cuenta. Todo el interés anterior quedaba fuera de
        // la medición, que es justo donde estaba el agujero.
        consultas: leadsConsulta,
        borradores: leadsBorrador,
        interesados: usuariosRegistrados + leadsSinCuenta,
        perdidosPorMotivo: perdidosPorMotivo.map((m: { motivoPerdida: string | null; _count: { _all: number } }) => ({
          motivo: m.motivoPerdida,
          cantidad: m._count._all,
        })),
      },
      clientes: {
        registrados: usuariosRegistrados,
        activos: usuariosActivos,
        nuevos: usuariosNuevos,
        conTramite: usuariosConTramite,
        conSociedad: usuariosConSociedad,
        tasaRegistroATramite: tasaRegistroATramite.toFixed(1),
        tasaTramiteACompletado: tasaTramiteACompletado.toFixed(1)
      },
      documentos: {
        totales: documentosTotales,
        aprobados: documentosAprobados,
        rechazados: documentosRechazados,
        pendientes: documentosPendientes,
        tasaAprobacion: documentosTotales > 0 ? ((documentosAprobados / documentosTotales) * 100).toFixed(1) : 0,
        rechazadosPorTipo: documentosRechazadosPorTipo
      },
      alertas,
      ultimosTramites,
      comparativas,
      tiemposPromedio,
      periodo: {
        inicio: fechaInicio,
        fin: fechaFin,
        tipo: periodo
      }
    })

  } catch {
    return NextResponse.json(
      { error: 'Error al obtener métricas' },
      { status: 500 }
    )
  }
}

