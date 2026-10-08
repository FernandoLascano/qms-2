import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { WHERE_DOCUMENTOS_POR_APROBAR } from '@/lib/documentos'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CONCEPTOS_COMISIONABLES } from '@/lib/comisiones'
import type { ConceptoPago } from '@prisma/client'

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

    // 1. MÉTRICAS DE TRÁMITES
    const [
      tramitesTotales,
      tramitesEnCurso,
      tramitesCompletados,
      tramitesCancelados,
      tramitesPeriodo
    ] = await Promise.all([
      prisma.tramite.count({ where: jurisdiccionFilter }),
      prisma.tramite.count({ 
        where: { 
          estadoGeneral: { in: ['INICIADO', 'EN_PROCESO', 'ESPERANDO_CLIENTE', 'ESPERANDO_APROBACION'] },
          ...jurisdiccionFilter 
        } 
      }),
      prisma.tramite.count({ 
        where: { estadoGeneral: 'COMPLETADO', ...jurisdiccionFilter } 
      }),
      prisma.tramite.count({ 
        where: { estadoGeneral: 'CANCELADO', ...jurisdiccionFilter } 
      }),
      prisma.tramite.count({ 
        where: { 
          createdAt: { gte: fechaInicio, lte: fechaFin },
          ...jurisdiccionFilter 
        } 
      })
    ])

    // Trámites por mes (últimos 6 meses) - queries paralelas con count
    const seismesesAtras = startOfMonth(subMonths(new Date(), 5))
    const mesesPromises = []
    for (let i = 5; i >= 0; i--) {
      const mes = subMonths(new Date(), i)
      const inicio = startOfMonth(mes)
      const fin = endOfMonth(mes)
      mesesPromises.push(
        prisma.tramite.count({
          where: {
            createdAt: { gte: inicio, lte: fin },
            ...jurisdiccionFilter
          }
        }).then(count => ({ mes: mesCorto(mes), cantidad: count }))
      )
    }
    const tramitesPorMes = await Promise.all(mesesPromises)

    // 2. MÉTRICAS DE INGRESOS
    // Ingresos computables = lo mismo que se liquida a las partes y lo que dice
    // el reporte mensual: los movimientos de comisiones (honorarios y domicilio).
    // Antes se sumaban todos los pagos aprobados, incluidas tasas y depósitos de
    // capital que el cliente paga a terceros, y el número no coincidía.
    const idsJurisdiccion = jurisdiccionFilter.jurisdiccion
      ? (await prisma.tramite.findMany({ where: jurisdiccionFilter, select: { id: true } })).map((t) => t.id)
      : null
    // Los movimientos se fechan a la medianoche UTC del día calendario: se
    // compara contra el día calendario del inicio del rango.
    const filtroMovimientos = (desde: Date, hasta: Date) => ({
      excluido: false,
      fecha: { gte: new Date(Date.UTC(desde.getFullYear(), desde.getMonth(), desde.getDate())), lte: hasta },
      ...(idsJurisdiccion ? { tramiteId: { in: idsJurisdiccion } } : {}),
    })
    const conceptosIngreso = { in: CONCEPTOS_COMISIONABLES as ConceptoPago[] }

    const pagosPeriodo = await prisma.movimientoComision.aggregate({
      where: filtroMovimientos(fechaInicio, fechaFin),
      _sum: { monto: true },
      _count: true
    })

    const pagosPendientes = await prisma.pago.aggregate({
      where: {
        estado: 'PENDIENTE',
        concepto: conceptosIngreso,
        tramite: jurisdiccionFilter.jurisdiccion ? { jurisdiccion: jurisdiccionFilter.jurisdiccion } : undefined
      },
      _sum: { monto: true },
      _count: true
    })

    // Ingresos por plan (estimado basado en concepto del pago)
    const ingresosPorPlan = await prisma.pago.groupBy({
      by: ['concepto'],
      where: {
        estado: 'APROBADO',
        concepto: conceptosIngreso,
        fechaPago: { gte: fechaInicio, lte: fechaFin },
        tramite: jurisdiccionFilter.jurisdiccion ? { jurisdiccion: jurisdiccionFilter.jurisdiccion } : undefined
      },
      _sum: { monto: true },
      _count: true
    })

    // 3. MÉTRICAS DE CLIENTES
    const [
      usuariosRegistrados,
      usuariosActivos,
      usuariosNuevos
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          tramites: {
            some: {
              estadoGeneral: { in: ['INICIADO', 'EN_PROCESO', 'ESPERANDO_CLIENTE', 'ESPERANDO_APROBACION'] }
            }
          }
        }
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: fechaInicio, lte: fechaFin }
        }
      })
    ])

    // Por jurisdicción
    const tramitesPorJurisdiccion = await prisma.tramite.groupBy({
      by: ['jurisdiccion'],
      _count: true
    })

    // 4. MÉTRICAS DE DOCUMENTOS
    const [
      documentosTotales,
      documentosAprobados,
      documentosRechazados,
      documentosPendientes
    ] = await Promise.all([
      prisma.documento.count(),
      prisma.documento.count({ where: { estado: 'APROBADO' } }),
      prisma.documento.count({ where: { estado: 'RECHAZADO' } }),
      // El borrador y los papeles para firmar se crean PENDIENTE pero los
      // revisa el cliente: no son trabajo pendiente nuestro.
      prisma.documento.count({ where: WHERE_DOCUMENTOS_POR_APROBAR })
    ])

    // Documentos más rechazados por tipo
    const documentosRechazadosPorTipo = await prisma.documento.groupBy({
      by: ['tipo'],
      where: { estado: 'RECHAZADO' },
      _count: true,
      orderBy: { _count: { tipo: 'desc' } },
      take: 5
    })

    // 5. ALERTAS
    const alertas = []

    // Trámites estancados (más de 5 días sin actualizar)
    const cincoDiasAtras = new Date()
    cincoDiasAtras.setDate(cincoDiasAtras.getDate() - 5)
    
    const tramitesEstancados = await prisma.tramite.count({
      where: {
        estadoGeneral: { in: ['EN_PROCESO', 'ESPERANDO_CLIENTE', 'ESPERANDO_APROBACION'] },
        updatedAt: { lt: cincoDiasAtras },
        ...jurisdiccionFilter
      }
    })

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
        mensaje: `${pagosPendientes._count} pagos pendientes por $${(pagosPendientes._sum.monto || 0).toLocaleString()}`,
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

    // 6. ÚLTIMOS TRÁMITES
    const ultimosTramites = await prisma.tramite.findMany({
      where: jurisdiccionFilter,
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // 7. TASAS DE CONVERSIÓN
    const usuariosConTramite = await prisma.user.count({
      where: {
        tramites: { some: {} }
      }
    })

    const tasaRegistroATramite = usuariosRegistrados > 0 
      ? (usuariosConTramite / usuariosRegistrados) * 100 
      : 0

    const tasaTramiteACompletado = tramitesTotales > 0 
      ? (tramitesCompletados / tramitesTotales) * 100 
      : 0

    // 8. INGRESOS POR MES (últimos 6 meses) - queries paralelas con aggregate
    const ingresosPromises = []
    for (let i = 5; i >= 0; i--) {
      const mes = subMonths(new Date(), i)
      const inicio = startOfMonth(mes)
      const fin = endOfMonth(mes)
      ingresosPromises.push(
        prisma.movimientoComision.aggregate({
          where: filtroMovimientos(inicio, fin),
          _sum: { monto: true }
        }).then(result => ({ mes: mesCorto(mes), ingresos: result._sum.monto || 0 }))
      )
    }
    const ingresosPorMes = await Promise.all(ingresosPromises)

    // 9. COMPARATIVAS VS MES ANTERIOR
    const mesAnteriorInicio = startOfMonth(subMonths(new Date(), 1))
    const mesAnteriorFin = endOfMonth(subMonths(new Date(), 1))

    const [
      tramitesMesAnterior,
      ingresosMesAnterior,
      clientesMesAnterior
    ] = await Promise.all([
      prisma.tramite.count({
        where: {
          createdAt: { gte: mesAnteriorInicio, lte: mesAnteriorFin },
          ...jurisdiccionFilter
        }
      }),
      prisma.movimientoComision.aggregate({
        where: filtroMovimientos(mesAnteriorInicio, mesAnteriorFin),
        _sum: { monto: true }
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: mesAnteriorInicio, lte: mesAnteriorFin }
        }
      })
    ])

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
    const tramitesCompletadosConFechas = await prisma.tramite.findMany({
      where: {
        estadoGeneral: 'COMPLETADO',
        sociedadInscripta: true,
        fechaSociedadInscripta: { not: null },
        ...jurisdiccionFilter
      },
      select: {
        id: true,
        fechaSociedadInscripta: true,
        fechaDenominacionReservada: true,
        denominacionReservada: true,
        capitalDepositado: true,
        documentosFirmados: true,
        sociedadInscripta: true
      },
      take: 50, // Últimos 50 trámites completados
      orderBy: { fechaSociedadInscripta: 'desc' }
    })

    const tiemposPromedio = {
      total: 0, // Desde Reserva de Nombre hasta Inscripción
      desdeValidacion: 0, // Desde validación del formulario hasta Inscripción
      porEtapa: {
        reservaDenominacion: 1.5,  // Días estimados
        depositoCapital: 1,
        firmaEstatuto: 1.5,
        inscripcion: 1
      }
    }

    if (tramitesCompletadosConFechas.length > 0) {
      // Obtener IDs de trámites para buscar fechas de validación
      const tramiteIds = tramitesCompletadosConFechas.map(t => t.id)
      
      // Buscar fechas de validación en el historial (cuando cambió a EN_PROCESO)
      // La validación ocurre cuando el estado cambia a EN_PROCESO
      const historialesValidacion = await prisma.historialEstado.findMany({
        where: {
          tramiteId: { in: tramiteIds },
          estadoNuevo: 'EN_PROCESO'
        },
        select: {
          tramiteId: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'asc' // Tomar la primera vez que cambió a EN_PROCESO
        }
      })

      // Crear mapa de fechas de validación por trámite
      const fechasValidacion = new Map<string, Date>()
      historialesValidacion.forEach(h => {
        if (!fechasValidacion.has(h.tramiteId)) {
          fechasValidacion.set(h.tramiteId, h.createdAt)
        }
      })

      // Calcular tiempos desde Reserva de Nombre hasta inscripción (tiempo total)
      const tiemposDesdeReserva = tramitesCompletadosConFechas
        .map(t => {
          const fechaReserva = t.fechaDenominacionReservada
          const fechaInscripcion = t.fechaSociedadInscripta

          // Solo calcular si tenemos ambas fechas
          if (fechaReserva && fechaInscripcion) {
            const diff = fechaInscripcion.getTime() - fechaReserva.getTime()
            return diff / (1000 * 60 * 60 * 24) // Convertir a días
          }
          return null
        })
        .filter((t): t is number => t !== null) // Filtrar nulls

      // Calcular tiempos desde validación hasta inscripción
      const tiemposDesdeValidacion = tramitesCompletadosConFechas
        .map(t => {
          const fechaValidacion = fechasValidacion.get(t.id)
          const fechaInscripcion = t.fechaSociedadInscripta

          // Solo calcular si tenemos ambas fechas
          if (fechaValidacion && fechaInscripcion) {
            const diff = fechaInscripcion.getTime() - fechaValidacion.getTime()
            return diff / (1000 * 60 * 60 * 24) // Convertir a días
          }
          return null
        })
        .filter((t): t is number => t !== null) // Filtrar nulls

      if (tiemposDesdeReserva.length > 0) {
        tiemposPromedio.total = tiemposDesdeReserva.reduce((a, b) => a + b, 0) / tiemposDesdeReserva.length
      }

      if (tiemposDesdeValidacion.length > 0) {
        tiemposPromedio.desdeValidacion = tiemposDesdeValidacion.reduce((a, b) => a + b, 0) / tiemposDesdeValidacion.length
      }
    }

    // Respuesta final
    const [leadsConsulta, leadsBorrador, perdidosPorMotivo] = await Promise.all([
      prisma.lead.count(),
      prisma.tramite.count({ where: { formularioCompleto: false } }),
      prisma.lead.groupBy({
        by: ['motivoPerdida'],
        where: { estado: 'DESCARTADO', motivoPerdida: { not: null } },
        _count: { _all: true },
      }),
    ])

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
        promedioPorTramite: tramitesCompletados > 0 
          ? Math.round((pagosPeriodo._sum.monto || 0) / tramitesCompletados) 
          : 0,
        porMes: ingresosPorMes
      },
      leads: {
        // El embudo arrancaba en «registrados», o sea después de que la persona
        // ya decidió abrir una cuenta. Todo el interés anterior quedaba fuera de
        // la medición, que es justo donde estaba el agujero.
        consultas: leadsConsulta,
        borradores: leadsBorrador,
        perdidosPorMotivo: perdidosPorMotivo.map((m: { motivoPerdida: string | null; _count: { _all: number } }) => ({
          motivo: m.motivoPerdida,
          cantidad: m._count._all,
        })),
      },
      clientes: {
        registrados: usuariosRegistrados,
        activos: usuariosActivos,
        nuevos: usuariosNuevos,
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

