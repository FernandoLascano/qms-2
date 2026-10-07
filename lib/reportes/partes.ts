import { prisma } from '@/lib/prisma'
import { getPorcentajes } from '@/lib/comisiones-server'
import {
  BENEFICIARIO_LABEL,
  ORIGINADOR_LABEL,
  calcularReparto,
  etiquetaPeriodo,
  saldosFondo,
  totalizar,
  type Beneficiario,
} from '@/lib/comisiones'
import { cuadro, documentoReporte, esc, indicadores, mensajesClave, notas, pct, pesos, seccion, subtitulo } from './diseno'

/**
 * Reporte mensual a las partes (cláusula 5.3 del contrato asociativo):
 * ingresos brutos, distribución de cada parte, Fondo de Desarrollo, costos
 * cubiertos por MW y evolución del producto.
 *
 * Usa los mismos datos y cálculos que la pestaña Liquidación. El Fondo se
 * calcula al cierre del mes informado (no a hoy), y el bono comercial no va:
 * es un acuerdo aparte de Fernando con MW.
 */

function rangoMes(periodo: string) {
  const [y, m] = periodo.split('-').map(Number)
  return { gte: new Date(Date.UTC(y, m - 1, 1)), lt: new Date(Date.UTC(y, m, 1)) }
}
const fecha = (d: Date) => d.toISOString().slice(0, 10).split('-').reverse().join('/')

export async function datosPartes(periodo: string) {
  const mes = rangoMes(periodo)
  const mesInst = { gte: new Date(mes.gte.getTime() + 3 * 3_600_000), lt: new Date(mes.lt.getTime() + 3 * 3_600_000) }
  const [porcentajes, movsHasta, distribuciones, gastos, liquidaciones, inscriptas, completos, consultas] = await Promise.all([
    getPorcentajes(),
    prisma.movimientoComision.findMany({ where: { excluido: false, fecha: { lt: mes.lt } }, orderBy: { fecha: 'asc' } }),
    prisma.distribucionFondo.findMany({ where: { fecha: { lt: mes.lt } } }),
    prisma.gastoFondo.findMany({ where: { fecha: { lt: mes.lt } }, orderBy: { fecha: 'asc' } }),
    prisma.liquidacionPago.findMany({ where: { periodo } }),
    prisma.tramite.count({ where: { fechaSociedadInscripta: mesInst } }),
    prisma.tramite.count({ where: { fechaFormularioCompleto: mesInst } }),
    prisma.lead.count({ where: { createdAt: mesInst } }),
  ])

  const enMes = <T extends { fecha: Date }>(x: T) => x.fecha >= mes.gte && x.fecha < mes.lt
  const antes = <T extends { fecha: Date }>(x: T) => x.fecha < mes.gte

  const movs = movsHasta.filter(enMes)
  const totales = totalizar(movs, porcentajes)

  // Fondo al inicio y al cierre del mes, por socio.
  const fondoA = (filtro: <T extends { fecha: Date }>(x: T) => boolean) => {
    const hist = totalizar(movsHasta.filter(filtro), porcentajes)
    return saldosFondo(
      { FERNANDO: hist.fondoFernando, JUSTINIANO: hist.fondoJustiniano },
      distribuciones.filter(filtro),
      gastos.filter(filtro),
      porcentajes,
    )
  }
  const inicial = fondoA(antes)
  const cierre = fondoA(() => true)

  return {
    periodo,
    porcentajes,
    movs,
    totales,
    fondo: {
      inicial,
      cierre,
      gastosMes: gastos.filter(enMes),
      distribucionesMes: distribuciones.filter(enMes),
    },
    liquidaciones,
    producto: { inscriptas, completos, consultas },
  }
}

type Datos = Awaited<ReturnType<typeof datosPartes>>

export type TextosPartes = {
  costosMw: string
  evolucion: string
}

const BENEFICIARIOS: Beneficiario[] = ['FERNANDO', 'JUSTINIANO', 'MW']
const aPagar = (b: Beneficiario, t: Datos['totales']) =>
  b === 'FERNANDO' ? t.aPagarFernando : b === 'JUSTINIANO' ? t.aPagarJustiniano : t.aPagarMw

function textoLibre(texto: string) {
  const t = texto.trim()
  return t
    ? `<p class="libre">${esc(t)}</p>`
    : `<p class="pendiente">Sin informar.</p>`
}

export async function reportePartesHtml(d: Datos, textos: TextosPartes, preparadoPor: string) {
  const { totales: t, porcentajes: p } = d
  const mes = etiquetaPeriodo(d.periodo).toLowerCase()
  const saldoCierre = d.fondo.cierre.FERNANDO.saldo + d.fondo.cierre.JUSTINIANO.saldo
  const saldoInicial = d.fondo.inicial.FERNANDO.saldo + d.fondo.inicial.JUSTINIANO.saldo
  const gastosMes = d.fondo.gastosMes.reduce((a, g) => a + g.monto, 0)

  const estado = (b: Beneficiario) => {
    const l = d.liquidaciones.find((x) => x.beneficiario === b)
    if (!l?.pagado) return aPagar(b, t) > 0 ? 'Pendiente' : '—'
    const dif = aPagar(b, t) - l.monto
    const cuando = l.fechaPago ? ` el ${l.fechaPago.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}` : ''
    return Math.abs(dif) >= 0.01 ? `Pagado ${pesos(l.monto)}${cuando}; ${dif > 0 ? 'falta' : 'sobra'} ${pesos(Math.abs(dif))}` : `Pagado${cuando}`
  }

  // 01 · Resumen
  const resumen = seccion(
    1,
    'Resumen',
    mensajesClave('En síntesis', [
      `Ingresos brutos de <strong>${pesos(t.ingresoBruto)}</strong> en ${d.movs.length} ${d.movs.length === 1 ? 'cobro' : 'cobros'}.`,
      `Corresponde pagar <strong>${pesos(t.subtotalPagable)}</strong> a las partes y aportar <strong>${pesos(t.subtotalFondo)}</strong> al Fondo de Desarrollo.`,
      `Saldo del Fondo al cierre de ${mes}: <strong>${pesos(saldoCierre)}</strong>${saldoInicial !== saldoCierre ? ` (al inicio del mes: ${pesos(saldoInicial)})` : ''}.`,
    ]) +
      indicadores([
        { valor: pesos(t.ingresoBruto), etiqueta: 'Ingresos brutos' },
        { valor: pesos(t.subtotalPagable), etiqueta: 'A pagar a las partes' },
        { valor: pesos(t.subtotalFondo), etiqueta: 'Aporte al Fondo' },
        { valor: pesos(saldoCierre), etiqueta: 'Saldo del Fondo', nota: 'al cierre del mes' },
      ]),
    { bajada: `Cláusula 5.3 del contrato asociativo · ${etiquetaPeriodo(d.periodo)}` },
  )

  // 02 · Ingresos brutos
  const ingresos = seccion(
    2,
    'Ingresos brutos',
    cuadro({
      numero: 1,
      titulo: `Cobros computables de ${mes}`,
      columnas: [
        { titulo: 'Fecha', ancho: '13%' },
        { titulo: 'Cliente' },
        { titulo: 'Concepto', ancho: '27%' },
        { titulo: 'Originador', ancho: '17%' },
        { titulo: 'Monto', num: true, ancho: '16%' },
      ],
      filas: d.movs.map((m) => [fecha(m.fecha), esc(m.cliente), esc(m.asunto), esc(m.originador === 'NINGUNO' ? 'Orgánico' : ORIGINADOR_LABEL[m.originador]), pesos(m.monto)]),
      total: d.movs.length ? ['', 'Total', '', '', pesos(t.ingresoBruto)] : undefined,
      fuente: 'Honorarios y domicilio en sede cobrados, sin tasas ni gastos de terceros. Originador según la cláusula 4.2.',
    }),
  )

  // 03 · Distribución
  const origen = [
    t.comisionFernando > 0 && ['Originación · Fernando', pct(p.originacion), pesos(t.comisionFernando)],
    t.comisionJustiniano > 0 && ['Originación · Justiniano', pct(p.originacion), pesos(t.comisionJustiniano)],
    t.comisionMw > 0 && ['Originación · MW', pct(p.originacion), pesos(t.comisionMw)],
  ].filter(Boolean) as string[][]
  const distribucion = seccion(
    3,
    'Distribución',
    cuadro({
      numero: 2,
      titulo: 'Reparto según la cláusula IV',
      columnas: [{ titulo: 'Concepto' }, { titulo: '%', num: true, ancho: '14%' }, { titulo: 'Monto', num: true, ancho: '22%' }],
      filas: [
        ...origen,
        ['MW', pct(p.mw), pesos(t.mwBase)],
        ['Operador · Fernando', pct(p.operador), pesos(t.operadorFernando)],
        ['Fondo de Desarrollo · Fernando', pct(p.fondoFernando), pesos(t.fondoFernando)],
        ['Fondo de Desarrollo · Justiniano', pct(p.fondoJustiniano), pesos(t.fondoJustiniano)],
      ],
      total: ['Total distribuido', '', pesos(t.ingresoBruto)],
      fuente: origen.length
        ? `La originación (${pct(p.originacion)}) se calcula sobre el cobro; el resto del esquema, sobre lo que queda después de la originación.`
        : 'Sin originación en el mes: el esquema se aplica sobre el 100% de lo cobrado.',
    }) +
      cuadro({
        numero: 3,
        titulo: 'A pagar a cada parte',
        columnas: [{ titulo: 'Parte', ancho: '22%' }, { titulo: 'Monto', num: true, ancho: '20%' }, { titulo: 'Estado' }],
        filas: BENEFICIARIOS.map((b) => [BENEFICIARIO_LABEL[b], pesos(aPagar(b, t)), esc(estado(b))]),
        total: ['Total', pesos(t.subtotalPagable), ''],
      }) +
      (d.movs.length > 1
        ? cuadro({
            numero: 4,
            titulo: 'Reparto de cada cobro',
            columnas: [
              { titulo: 'Cliente' },
              { titulo: 'Cobro', num: true, ancho: '14%' },
              { titulo: 'Originación', num: true, ancho: '13%' },
              { titulo: 'MW', num: true, ancho: '13%' },
              { titulo: 'Operador', num: true, ancho: '13%' },
              { titulo: 'Fondo F.', num: true, ancho: '12%' },
              { titulo: 'Fondo J.', num: true, ancho: '12%' },
            ],
            filas: d.movs.map((m) => {
              const r = calcularReparto(m.monto, m.originador, p)
              return [esc(m.cliente), pesos(m.monto), pesos(r.comisionOriginacion), pesos(r.mw), pesos(r.operadorFernando), pesos(r.fondoFernando), pesos(r.fondoJustiniano)]
            }),
            total: ['Total', pesos(t.ingresoBruto), pesos(t.comisionFernando + t.comisionJustiniano + t.comisionMw), pesos(t.mwBase), pesos(t.operadorFernando), pesos(t.fondoFernando), pesos(t.fondoJustiniano)],
          })
        : ''),
    { nueva: true },
  )

  // 04 · Fondo de Desarrollo
  const fila = (concepto: string, f: number, j: number, signo = '') => [
    concepto,
    `${signo}${pesos(f)}`,
    `${signo}${pesos(j)}`,
    `${signo}${pesos(f + j)}`,
  ]
  const gastoDe = (b: 'FERNANDO' | 'JUSTINIANO') =>
    d.fondo.gastosMes.reduce((a, g) => {
      if (g.imputadoA === b) return a + g.monto
      if (g.imputadoA === null) return a + g.monto * (b === 'FERNANDO' ? d.fondo.cierre.parteFernando : 1 - d.fondo.cierre.parteFernando)
      return a
    }, 0)
  const distribDe = (b: 'FERNANDO' | 'JUSTINIANO') =>
    d.fondo.distribucionesMes.filter((x) => x.beneficiario === b).reduce((a, x) => a + x.monto, 0)

  const fondo = seccion(
    4,
    'Fondo de Desarrollo',
    cuadro({
      numero: 5,
      titulo: `Movimientos del Fondo en ${mes}`,
      columnas: [{ titulo: 'Concepto' }, { titulo: 'Fernando', num: true, ancho: '19%' }, { titulo: 'Justiniano', num: true, ancho: '19%' }, { titulo: 'Total', num: true, ancho: '19%' }],
      filas: [
        fila('Saldo al inicio del mes', d.fondo.inicial.FERNANDO.saldo, d.fondo.inicial.JUSTINIANO.saldo),
        fila('Aportes del mes', t.fondoFernando, t.fondoJustiniano, '+ '),
        fila('Gastos del mes', gastoDe('FERNANDO'), gastoDe('JUSTINIANO'), '− '),
        fila('Distribuciones del mes', distribDe('FERNANDO'), distribDe('JUSTINIANO'), '− '),
      ],
      total: fila('Saldo al cierre', d.fondo.cierre.FERNANDO.saldo, d.fondo.cierre.JUSTINIANO.saldo),
      fuente: `Un gasto sin imputar se reparte en la proporción en que se forma el Fondo (${pct(p.fondoFernando)} y ${pct(p.fondoJustiniano)}).`,
    }) +
      (d.fondo.gastosMes.length
        ? cuadro({
            numero: 6,
            titulo: 'Detalle de gastos del Fondo',
            columnas: [{ titulo: 'Fecha', ancho: '14%' }, { titulo: 'Concepto' }, { titulo: 'Imputado a', ancho: '20%' }, { titulo: 'Monto', num: true, ancho: '18%' }],
            filas: d.fondo.gastosMes.map((g) => [fecha(g.fecha), esc(g.concepto), g.imputadoA ? BENEFICIARIO_LABEL[g.imputadoA] : 'Ambos', pesos(g.monto)]),
            total: ['', 'Total', '', pesos(gastosMes)],
          })
        : ''),
  )

  // 05 · Costos cubiertos por MW · 06 · Evolución del producto
  const costos = seccion(5, 'Costos cubiertos por MW', textoLibre(textos.costosMw), { bajada: 'Cláusula 3.1 del contrato asociativo.' })
  const evolucion = seccion(
    6,
    'Evolución del producto',
    indicadores([
      { valor: String(d.producto.consultas), etiqueta: 'Consultas nuevas' },
      { valor: String(d.producto.completos), etiqueta: 'Formularios completos' },
      { valor: String(d.producto.inscriptas), etiqueta: 'Sociedades inscriptas' },
    ]) +
      subtitulo('Novedades del mes') +
      textoLibre(textos.evolucion) +
      notas('Notas', [
        'Los montos son nominales, en pesos. Las fechas de cobro se toman en hora argentina.',
        'El bono comercial que MW le paga a Fernando de su propia parte es un acuerdo aparte y no forma parte de este reporte.',
        'El detalle completo de cada cobro y su reparto está disponible en el módulo de Comisiones de QuieroMiSAS.',
      ]),
  )

  return documentoReporte({
    titulo: `Reporte a las partes · ${etiquetaPeriodo(d.periodo)}`,
    portada: {
      rotulo: 'Reporte mensual a las partes',
      titulo: etiquetaPeriodo(d.periodo),
      bajada:
        'Ingresos brutos, distribución de cada parte, Fondo de Desarrollo, costos cubiertos por MW y evolución del producto, según la cláusula 5.3 del contrato asociativo.',
      datos: [
        ['Preparado por', preparadoPor],
        ['Fecha de emisión', new Date().toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: 'numeric', month: 'long', year: 'numeric' })],
        ['Destinatarios', 'Partes del contrato asociativo'],
      ],
    },
    cuerpo: resumen + ingresos + distribucion + fondo + costos + evolucion,
  })
}
