import { prisma } from '@/lib/prisma'
import { etiquetaPeriodo, moverPeriodo } from '@/lib/comisiones'
import {
  cuadro,
  documentoReporte,
  dosColumnas,
  grafico,
  indicadores,
  mensajesClave,
  notas,
  numero,
  pct,
  pesos,
  seccion,
  variacion,
  esc,
} from './diseno'
import { barrasHorizontales, barrasVerticales } from './graficos'

/**
 * Informe de gestión mensual de QuieroMiSAS.
 *
 * Los ingresos salen de los movimientos de comisiones (lo mismo que se
 * liquida), así el informe y la liquidación no pueden dar números distintos.
 */

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const EN_CURSO = ['INICIADO', 'EN_PROCESO', 'ESPERANDO_CLIENTE', 'ESPERANDO_APROBACION'] as const
const DIA = 86_400_000

const MOTIVO: Record<string, string> = {
  NO_ENTENDIO: 'No entendió el servicio',
  SIN_DOMICILIO: 'Sin domicilio para la sede',
  NO_DEFINIO: 'Todavía no lo definió',
  PRECIO: 'Precio',
  LO_HIZO_OTRO: 'Lo hizo con otro',
  NO_CONTESTA: 'No contesta',
  OTRO: 'Otro',
}
const ORIGEN_LEAD: Record<string, string> = {
  FORMULARIO_CONTACTO: 'Formulario de contacto',
  CHAT: 'Chat del sitio',
  REGISTRO_SIN_TRAMITE: 'Se registró sin iniciar',
  PARTNER: 'Partner',
  MANUAL: 'Llamada / WhatsApp',
}
const PLAN: Record<string, string> = { BASICO: 'Básico', EMPRENDEDOR: 'Emprendedor', PREMIUM: 'Premium' }
const JURIS: Record<string, string> = { CORDOBA: 'Córdoba', CABA: 'CABA' }

/** Movimientos: medianoche UTC del día argentino → el mes es el mes UTC. */
function rangoMovimientos(periodo: string) {
  const [y, m] = periodo.split('-').map(Number)
  return { gte: new Date(Date.UTC(y, m - 1, 1)), lt: new Date(Date.UTC(y, m, 1)) }
}
/** Instantes reales (fechas de etapas, leads): el mes según la hora argentina (UTC-3). */
function rangoInstantes(periodo: string) {
  const [y, m] = periodo.split('-').map(Number)
  return { gte: new Date(Date.UTC(y, m - 1, 1, 3)), lt: new Date(Date.UTC(y, m, 1, 3)) }
}
const mesCorto = (periodo: string) => MESES_CORTOS[Number(periodo.slice(5)) - 1]
const nombreMes = (periodo: string) => etiquetaPeriodo(periodo).split(' ')[0].toLowerCase()

function mediana(xs: number[]) {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  const k = Math.floor(s.length / 2)
  return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2
}
const dias = (a: Date | null, b: Date | null) => (a && b ? (b.getTime() - a.getTime()) / DIA : null)

function contarPor<T>(xs: T[], clave: (x: T) => string) {
  const m = new Map<string, number>()
  for (const x of xs) m.set(clave(x), (m.get(clave(x)) ?? 0) + 1)
  return [...m.entries()].sort((a, b) => b[1] - a[1])
}

export async function datosGestion(periodo: string) {
  const anterior = moverPeriodo(periodo, -1)
  const primero12 = moverPeriodo(periodo, -11)
  const mes = rangoInstantes(periodo)
  const mesAnt = rangoInstantes(anterior)
  const doce = { gte: rangoMovimientos(primero12).gte, lt: rangoMovimientos(periodo).lt }
  const doceInst = { gte: rangoInstantes(primero12).gte, lt: mes.lt }
  const anio = { gte: new Date(Date.UTC(Number(periodo.slice(0, 4)), 0, 1)), lt: rangoMovimientos(periodo).lt }

  const [
    movs12,
    movsAnio,
    iniciados,
    iniciadosAnt,
    completos,
    completosAnt,
    inscriptas,
    inscriptasAnt,
    inscriptas12,
    enCurso,
    leadsMes,
    leadsAnt,
    ganadosMes,
    descartadosMes,
    primerosCobros,
    domicilios,
  ] = await Promise.all([
    prisma.movimientoComision.findMany({ where: { excluido: false, fecha: doce } }),
    prisma.movimientoComision.aggregate({ where: { excluido: false, fecha: anio }, _sum: { monto: true }, _count: true }),
    prisma.tramite.count({ where: { createdAt: mes } }),
    prisma.tramite.count({ where: { createdAt: mesAnt } }),
    prisma.tramite.findMany({ where: { fechaFormularioCompleto: mes }, select: { plan: true, jurisdiccion: true } }),
    prisma.tramite.count({ where: { fechaFormularioCompleto: mesAnt } }),
    prisma.tramite.findMany({
      where: { fechaSociedadInscripta: mes },
      select: { denominacionAprobada: true, denominacionSocial1: true, plan: true, jurisdiccion: true, fechaSociedadInscripta: true, fechaFormularioCompleto: true, createdAt: true },
      orderBy: { fechaSociedadInscripta: 'asc' },
    }),
    prisma.tramite.count({ where: { fechaSociedadInscripta: mesAnt } }),
    prisma.tramite.findMany({
      where: { fechaSociedadInscripta: doceInst },
      select: {
        createdAt: true,
        fechaFormularioCompleto: true,
        fechaDenominacionReservada: true,
        fechaCapitalDepositado: true,
        fechaTasaPagada: true,
        fechaDocumentosFirmados: true,
        fechaTramiteIngresado: true,
        fechaSociedadInscripta: true,
      },
    }),
    prisma.tramite.findMany({
      where: { estadoGeneral: { in: [...EN_CURSO] }, formularioCompleto: true, sociedadInscripta: false },
      select: { updatedAt: true },
    }),
    prisma.lead.findMany({ where: { createdAt: mes }, select: { origen: true } }),
    prisma.lead.count({ where: { createdAt: mesAnt } }),
    prisma.lead.count({ where: { ganadoAt: mes } }),
    prisma.lead.findMany({ where: { estado: 'DESCARTADO', updatedAt: mes }, select: { motivoPerdida: true } }),
    prisma.pago.findMany({
      where: { estado: 'APROBADO', concepto: { in: ['HONORARIOS_BASICO', 'HONORARIOS_EMPRENDEDOR', 'HONORARIOS_PREMIUM'] }, fechaPago: mes },
      select: { tramiteId: true },
      distinct: ['tramiteId'],
    }),
    prisma.domicilioSede.findMany({ where: { estado: 'ACTIVO' }, select: { montoAnual: true, fechaVencimiento: true } }),
  ])

  // Ingresos por mes (12 meses que terminan en el período del informe).
  const serie = Array.from({ length: 12 }, (_, i) => {
    const p = moverPeriodo(primero12, i)
    const r = rangoMovimientos(p)
    const delMes = movs12.filter((m) => m.fecha >= r.gte && m.fecha < r.lt)
    return { periodo: p, valor: delMes.reduce((a, m) => a + m.monto, 0), cobros: delMes.length }
  })
  const actual = serie[11]
  const previo = serie[10]
  const rMes = rangoMovimientos(periodo)
  const movsMes = movs12.filter((m) => m.fecha >= rMes.gte && m.fecha < rMes.lt)
  const porAsunto = contarMonto(movsMes, (m) => m.asunto)
  const organico = movsMes.filter((m) => m.originador === 'NINGUNO').reduce((a, m) => a + m.monto, 0)

  // Tiempos: sociedades inscriptas en los últimos 12 meses.
  const etapas: [string, (t: (typeof inscriptas12)[number]) => [Date | null, Date | null]][] = [
    ['Formulario → reserva de nombre', (t) => [t.fechaFormularioCompleto, t.fechaDenominacionReservada]],
    ['Reserva → depósito del capital', (t) => [t.fechaDenominacionReservada, t.fechaCapitalDepositado]],
    ['Depósito → pago de la tasa', (t) => [t.fechaCapitalDepositado, t.fechaTasaPagada]],
    ['Tasa → documentos firmados', (t) => [t.fechaTasaPagada, t.fechaDocumentosFirmados]],
    ['Firma → ingreso al registro', (t) => [t.fechaDocumentosFirmados, t.fechaTramiteIngresado]],
    ['Ingreso → inscripción', (t) => [t.fechaTramiteIngresado, t.fechaSociedadInscripta]],
  ]
  const tiemposEtapa = etapas.map(([etiqueta, f]) => {
    const xs = inscriptas12.map((t) => dias(...f(t))).filter((d): d is number => d != null && d >= 0)
    return { etiqueta, mediana: mediana(xs), casos: xs.length }
  })
  const totales = inscriptas12
    .map((t) => dias(t.fechaFormularioCompleto ?? t.createdAt, t.fechaSociedadInscripta))
    .filter((d): d is number => d != null && d >= 0)
  const totalesMes = inscriptas
    .map((t) => dias(t.fechaFormularioCompleto ?? t.createdAt, t.fechaSociedadInscripta))
    .filter((d): d is number => d != null && d >= 0)

  const hoy = new Date()
  const estancados = enCurso.filter((t) => hoy.getTime() - t.updatedAt.getTime() > 7 * DIA).length
  const finMes = mes.lt
  const vencen90 = domicilios.filter(
    (d) => d.fechaVencimiento && d.fechaVencimiento >= finMes && d.fechaVencimiento.getTime() < finMes.getTime() + 90 * DIA,
  )

  return {
    periodo,
    anterior,
    serie,
    ingresos: { actual: actual.valor, previo: previo.valor, cobros: actual.cobros, cobrosPrevio: previo.cobros, anio: movsAnio._sum.monto ?? 0, cobrosAnio: movsAnio._count, porAsunto, organico, movsMes },
    tramites: {
      iniciados,
      iniciadosAnt,
      completos: completos.length,
      completosAnt,
      inscriptas,
      inscriptasAnt,
      enCurso: enCurso.length,
      estancados,
      porPlan: contarPor(completos, (t) => PLAN[t.plan] ?? t.plan),
      porJurisdiccion: contarPor(completos, (t) => JURIS[t.jurisdiccion] ?? t.jurisdiccion),
    },
    tiempos: { etapas: tiemposEtapa, medianaTotal: mediana(totales), casos: totales.length, medianaMes: mediana(totalesMes) },
    comercial: {
      leads: leadsMes.length,
      leadsAnt,
      porOrigen: contarPor(leadsMes, (l) => ORIGEN_LEAD[l.origen] ?? l.origen),
      ganados: ganadosMes,
      perdidos: contarPor(descartadosMes, (l) => MOTIVO[l.motivoPerdida ?? 'OTRO'] ?? 'Otro'),
      primerosCobros: primerosCobros.length,
    },
    cartera: {
      domiciliosActivos: domicilios.length,
      abonoAnual: domicilios.reduce((a, d) => a + (d.montoAnual ?? 0), 0),
      vencen90: vencen90.length,
      vencen90Monto: vencen90.reduce((a, d) => a + (d.montoAnual ?? 0), 0),
    },
  }
}

function contarMonto<T extends { monto: number }>(xs: T[], clave: (x: T) => string) {
  const m = new Map<string, { monto: number; cantidad: number }>()
  for (const x of xs) {
    const k = clave(x)
    const v = m.get(k) ?? { monto: 0, cantidad: 0 }
    m.set(k, { monto: v.monto + x.monto, cantidad: v.cantidad + 1 })
  }
  return [...m.entries()].map(([etiqueta, v]) => ({ etiqueta, ...v })).sort((a, b) => b.monto - a.monto)
}

type Datos = Awaited<ReturnType<typeof datosGestion>>

/** Frase de variación para los mensajes clave. */
function compara(actual: number, anterior: number, mesAnterior: string, formato: (n: number) => string = numero) {
  const v = variacion(actual, anterior)
  if (v == null) return anterior === 0 && actual > 0 ? `(en ${mesAnterior} no hubo)` : ''
  if (Math.abs(v) < 0.5) return `(igual que en ${mesAnterior})`
  return `(${v > 0 ? '+' : '−'}${pct(Math.abs(v))} contra ${mesAnterior}: ${formato(anterior)})`
}

export async function informeGestionHtml(d: Datos, preparadoPor: string) {
  const mes = nombreMes(d.periodo)
  const mesAnt = nombreMes(d.anterior)
  const ticket = d.ingresos.cobros ? d.ingresos.actual / d.ingresos.cobros : 0
  const ticketAnt = d.ingresos.cobrosPrevio ? d.ingresos.previo / d.ingresos.cobrosPrevio : 0

  // Los meses sin datos al principio (antes de que existiera el módulo) no aportan.
  const primeroConDatos = d.serie.findIndex((s) => s.valor > 0)
  const desde = primeroConDatos < 0 ? 11 : Math.min(primeroConDatos, 6)
  const serieVisible = d.serie.slice(desde)
  const tituloSerie = serieVisible.length === 12 ? 'últimos 12 meses' : `${etiquetaPeriodo(serieVisible[0].periodo).toLowerCase()} a ${etiquetaPeriodo(d.periodo).toLowerCase()}`

  // 01 · Resumen ejecutivo
  const claves = [
    `Ingresos computables de <strong>${pesos(d.ingresos.actual)}</strong> en ${d.ingresos.cobros} ${d.ingresos.cobros === 1 ? 'cobro' : 'cobros'} ${compara(d.ingresos.actual, d.ingresos.previo, mesAnt, pesos)}.`,
    `<strong>${d.tramites.inscriptas.length}</strong> ${d.tramites.inscriptas.length === 1 ? 'sociedad inscripta' : 'sociedades inscriptas'} y <strong>${d.tramites.completos}</strong> ${d.tramites.completos === 1 ? 'formulario completo' : 'formularios completos'} en el mes ${compara(d.tramites.completos, d.tramites.completosAnt, mesAnt)}.`,
    d.tiempos.medianaTotal != null
      ? `Una SAS tarda <strong>${numero(d.tiempos.medianaTotal)} días</strong> (mediana) desde el formulario completo hasta la inscripción, sobre ${d.tiempos.casos} ${d.tiempos.casos === 1 ? 'caso' : 'casos'} de los últimos 12 meses.`
      : `Todavía no hay sociedades inscriptas en los últimos 12 meses para medir tiempos.`,
    `${d.comercial.leads} ${d.comercial.leads === 1 ? 'consulta nueva' : 'consultas nuevas'} y ${d.comercial.primerosCobros} ${d.comercial.primerosCobros === 1 ? 'cliente nuevo' : 'clientes nuevos'} (primer cobro de honorarios) en el mes.`,
    d.cartera.domiciliosActivos
      ? `${d.cartera.domiciliosActivos} domicilios en sede activos, con un abono anual comprometido de ${pesos(d.cartera.abonoAnual)}; ${d.cartera.vencen90} ${d.cartera.vencen90 === 1 ? 'vence' : 'vencen'} en los próximos 90 días.`
      : '',
  ].filter(Boolean)

  const resumen = seccion(
    1,
    'Resumen ejecutivo',
    mensajesClave('Mensajes clave', claves) +
      indicadores([
        { valor: pesos(d.ingresos.actual), etiqueta: 'Ingresos del mes', delta: variacion(d.ingresos.actual, d.ingresos.previo), nota: `vs. ${mesAnt}` },
        { valor: pesos(ticket), etiqueta: 'Ticket promedio', delta: variacion(ticket, ticketAnt), nota: `vs. ${mesAnt}` },
        { valor: numero(d.tramites.inscriptas.length), etiqueta: 'Sociedades inscriptas', delta: variacion(d.tramites.inscriptas.length, d.tramites.inscriptasAnt), nota: `vs. ${mesAnt}` },
        { valor: pesos(d.ingresos.anio), etiqueta: `Acumulado ${d.periodo.slice(0, 4)}`, nota: `${d.ingresos.cobrosAnio} cobros` },
      ]),
    { bajada: `Lo principal de ${etiquetaPeriodo(d.periodo).toLowerCase()} en una hoja.` },
  )

  // 02 · Ingresos
  const ingresos = seccion(
    2,
    'Ingresos',
    grafico({
      numero: 1,
      titulo: `Ingresos computables por mes, ${tituloSerie}`,
      svg: barrasVerticales({ datos: serieVisible.map((s) => ({ etiqueta: mesCorto(s.periodo), valor: s.valor })), destacado: serieVisible.length - 1 }),
      fuente: 'Fuente: módulo de Comisiones de QMS. Honorarios y domicilio en sede, sin tasas ni gastos de terceros.',
    }) +
      dosColumnas(
        cuadro({
          numero: 1,
          titulo: `Composición de los ingresos de ${mes}`,
          columnas: [{ titulo: 'Concepto' }, { titulo: 'Cobros', num: true, ancho: '16%' }, { titulo: 'Monto', num: true, ancho: '30%' }, { titulo: '%', num: true, ancho: '14%' }],
          filas: d.ingresos.porAsunto.map((a) => [esc(a.etiqueta), a.cantidad, pesos(a.monto), pct(d.ingresos.actual ? (a.monto / d.ingresos.actual) * 100 : 0)]),
          total: d.ingresos.porAsunto.length ? ['Total', d.ingresos.cobros, pesos(d.ingresos.actual), '100%'] : undefined,
        }),
        cuadro({
          numero: 2,
          titulo: 'Origen de los ingresos',
          columnas: [{ titulo: 'Origen' }, { titulo: 'Monto', num: true, ancho: '34%' }, { titulo: '%', num: true, ancho: '16%' }],
          filas: d.ingresos.actual
            ? [
                ['Orgánico (web, sin originador)', pesos(d.ingresos.organico), pct((d.ingresos.organico / d.ingresos.actual) * 100)],
                ['Referido por una de las partes', pesos(d.ingresos.actual - d.ingresos.organico), pct(((d.ingresos.actual - d.ingresos.organico) / d.ingresos.actual) * 100)],
              ]
            : [],
          fuente: 'Originador según la cláusula 4.2 del contrato asociativo.',
        }),
      ) +
      cuadro({
        numero: 3,
        titulo: `Detalle de cobros de ${mes}`,
        columnas: [{ titulo: 'Fecha', ancho: '14%' }, { titulo: 'Cliente' }, { titulo: 'Concepto', ancho: '30%' }, { titulo: 'Monto', num: true, ancho: '18%' }],
        filas: d.ingresos.movsMes
          .slice()
          .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
          .map((m) => [m.fecha.toISOString().slice(0, 10).split('-').reverse().join('/'), esc(m.cliente), esc(m.asunto), pesos(m.monto)]),
        total: d.ingresos.movsMes.length ? ['', 'Total', '', pesos(d.ingresos.actual)] : undefined,
      }),
    { bajada: 'Lo cobrado que entra en el reparto del contrato asociativo.' },
  )

  // 03 · Operación
  const etapasValidas = d.tiempos.etapas.filter((e) => e.mediana != null)
  const operacion = seccion(
    3,
    'Operación',
    indicadores([
      { valor: numero(d.tramites.iniciados), etiqueta: 'Trámites iniciados', delta: variacion(d.tramites.iniciados, d.tramites.iniciadosAnt), nota: `vs. ${mesAnt}` },
      { valor: numero(d.tramites.completos), etiqueta: 'Formularios completos', delta: variacion(d.tramites.completos, d.tramites.completosAnt), nota: `vs. ${mesAnt}` },
      { valor: numero(d.tramites.enCurso), etiqueta: 'En curso hoy', nota: `${d.tramites.estancados} sin movimiento hace +7 días` },
      {
        valor: d.tiempos.medianaTotal != null ? `${numero(d.tiempos.medianaTotal)} días` : '—',
        etiqueta: 'Formulario a inscripción',
        nota: 'mediana, últimos 12 meses',
      },
    ]) +
      cuadro({
        numero: 4,
        titulo: `Sociedades inscriptas en ${mes}`,
        columnas: [{ titulo: 'Sociedad' }, { titulo: 'Plan', ancho: '17%' }, { titulo: 'Jurisdicción', ancho: '17%' }, { titulo: 'Inscripta', ancho: '14%' }, { titulo: 'Días', num: true, ancho: '10%' }],
        filas: d.tramites.inscriptas.map((t) => {
          const dd = dias(t.fechaFormularioCompleto ?? t.createdAt, t.fechaSociedadInscripta)
          return [
            esc(t.denominacionAprobada || t.denominacionSocial1),
            PLAN[t.plan] ?? t.plan,
            JURIS[t.jurisdiccion] ?? t.jurisdiccion,
            t.fechaSociedadInscripta ? t.fechaSociedadInscripta.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }) : '',
            dd != null ? numero(dd) : '—',
          ]
        }),
        vacio: 'No se inscribieron sociedades en el mes.',
        fuente: 'Días corridos desde el formulario completo hasta la inscripción.',
      }) +
      (etapasValidas.length
        ? grafico({
            numero: 2,
            titulo: 'Dónde se va el tiempo: días por etapa (mediana)',
            svg: barrasHorizontales({
              datos: etapasValidas.map((e) => ({ etiqueta: e.etiqueta, valor: e.mediana!, nota: `${e.casos} casos` })),
              formato: (n) => `${numero(n)} días`,
              destacarPrimero: false,
            }),
            fuente: 'Sociedades inscriptas en los últimos 12 meses con ambas fechas registradas. Días corridos.',
          })
        : '') +
      dosColumnas(
        cuadro({
          titulo: 'Formularios completos por plan',
          columnas: [{ titulo: 'Plan' }, { titulo: 'Cantidad', num: true, ancho: '30%' }],
          filas: d.tramites.porPlan.map(([k, v]) => [k, v]),
          vacio: 'Sin formularios completos en el mes.',
        }),
        cuadro({
          titulo: 'Formularios completos por jurisdicción',
          columnas: [{ titulo: 'Jurisdicción' }, { titulo: 'Cantidad', num: true, ancho: '30%' }],
          filas: d.tramites.porJurisdiccion.map(([k, v]) => [k, v]),
          vacio: 'Sin formularios completos en el mes.',
        }),
      ),
    { nueva: true, bajada: 'Cuántos trámites entran, cuántos salen y cuánto tardan.' },
  )

  // 04 · Comercial
  const comercial = seccion(
    4,
    'Comercial',
    indicadores([
      { valor: numero(d.comercial.leads), etiqueta: 'Consultas nuevas', delta: variacion(d.comercial.leads, d.comercial.leadsAnt), nota: `vs. ${mesAnt}` },
      { valor: numero(d.comercial.primerosCobros), etiqueta: 'Clientes nuevos', nota: 'primer cobro de honorarios' },
      { valor: numero(d.comercial.perdidos.reduce((a, [, v]) => a + v, 0)), etiqueta: 'Consultas descartadas', nota: 'cerradas sin venta en el mes' },
    ]) +
      grafico({
        numero: 3,
        titulo: `Actividad comercial de ${mes}, paso por paso`,
        svg: barrasHorizontales({
          datos: [
            { etiqueta: 'Consultas', valor: d.comercial.leads },
            { etiqueta: 'Trámites iniciados', valor: d.tramites.iniciados },
            { etiqueta: 'Formularios completos', valor: d.tramites.completos },
            { etiqueta: 'Clientes nuevos (1.er cobro)', valor: d.comercial.primerosCobros },
            { etiqueta: 'Sociedades inscriptas', valor: d.tramites.inscriptas.length },
          ],
          formato: numero,
          destacarPrimero: false,
        }),
        fuente: 'Cuántos casos pasaron por cada paso en el mes. No es una tasa de conversión: quien se inscribe este mes pudo haber consultado antes.',
      }) +
      dosColumnas(
        cuadro({
          titulo: 'De dónde llegaron las consultas',
          columnas: [{ titulo: 'Canal' }, { titulo: 'Consultas', num: true, ancho: '30%' }],
          filas: d.comercial.porOrigen.map(([k, v]) => [k, v]),
          vacio: 'Sin consultas en el mes.',
        }),
        cuadro({
          titulo: 'Por qué se perdieron',
          columnas: [{ titulo: 'Motivo' }, { titulo: 'Casos', num: true, ancho: '30%' }],
          filas: d.comercial.perdidos.map(([k, v]) => [k, v]),
          vacio: 'No se descartaron consultas en el mes.',
        }),
      ),
    { nueva: true, bajada: 'De dónde vienen los clientes y dónde se caen.' },
  )

  // 05 · Cartera recurrente
  const cartera = seccion(
    5,
    'Cartera recurrente',
    indicadores([
      { valor: numero(d.cartera.domiciliosActivos), etiqueta: 'Domicilios en sede activos' },
      { valor: pesos(d.cartera.abonoAnual), etiqueta: 'Abono anual comprometido' },
      { valor: numero(d.cartera.vencen90), etiqueta: 'Vencen en 90 días', nota: d.cartera.vencen90 ? `${pesos(d.cartera.vencen90Monto)} a renovar` : undefined },
    ]) +
      notas('Notas metodológicas', [
        'Ingresos computables: honorarios y domicilio en sede cobrados, según el módulo de Comisiones (lo mismo que se liquida a las partes). No incluyen tasas, depósitos de capital ni otros gastos que paga el cliente a terceros.',
        'Los montos son nominales, en pesos y sin ajustar por inflación.',
        'Las fechas de cobro se toman en hora argentina. Un cobro del último día del mes pertenece a ese mes.',
        '«En curso hoy» y la cartera de domicilios reflejan el estado a la fecha de emisión, no al cierre del mes.',
        'Los tiempos usan la mediana (el caso del medio) para que un trámite trabado no distorsione el promedio.',
      ]),
  )

  return documentoReporte({
    titulo: `Informe de gestión · ${etiquetaPeriodo(d.periodo)}`,
    portada: {
      rotulo: 'Informe de gestión',
      titulo: etiquetaPeriodo(d.periodo),
      bajada: 'Ingresos, operación y actividad comercial de QuieroMiSAS en el mes, comparados con el mes anterior y los últimos doce meses.',
      datos: [
        ['Preparado por', preparadoPor],
        ['Fecha de emisión', new Date().toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: 'numeric', month: 'long', year: 'numeric' })],
        ['Clasificación', 'Confidencial · uso interno'],
      ],
    },
    cuerpo: resumen + ingresos + operacion + comercial + cartera,
  })
}

