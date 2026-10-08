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
import { cuadro, dosColumnas, esc, indicadores, pct, pesos, seccion, subtitulo } from './diseno'

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
  const [porcentajes, movsHasta, distribuciones, gastos, liquidaciones] = await Promise.all([
    getPorcentajes(),
    prisma.movimientoComision.findMany({ where: { excluido: false, fecha: { lt: mes.lt } }, orderBy: { fecha: 'asc' } }),
    prisma.distribucionFondo.findMany({ where: { fecha: { lt: mes.lt } } }),
    prisma.gastoFondo.findMany({ where: { fecha: { lt: mes.lt } }, orderBy: { fecha: 'asc' } }),
    prisma.liquidacionPago.findMany({ where: { periodo } }),
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

export type Partes = Datos

/** Piezas del reporte que salen de la liquidación (cláusulas 4 y 5.3). */
export function piezasPartes(d: Datos, textos: TextosPartes) {
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

  const claves = [
    `Corresponde pagar <strong>${pesos(t.subtotalPagable)}</strong> a las partes y aportar <strong>${pesos(t.subtotalFondo)}</strong> al Fondo de Desarrollo.`,
    `Saldo del Fondo al cierre de ${mes}: <strong>${pesos(saldoCierre)}</strong>${Math.abs(saldoInicial - saldoCierre) >= 1 ? ` (al inicio del mes: ${pesos(saldoInicial)})` : ''}.`,
  ]

  /** Detalle de cobros con su originador (va dentro de la sección de ingresos). */
  const detalleCobros = cuadro({
    titulo: `Detalle de cobros de ${mes}`,
    columnas: [
      { titulo: 'Fecha', ancho: '13%' },
      { titulo: 'Cliente' },
      { titulo: 'Concepto', ancho: '27%' },
      { titulo: 'Originador', ancho: '17%' },
      { titulo: 'Monto', num: true, ancho: '16%' },
    ],
    filas: d.movs.map((m) => [fecha(m.fecha), esc(m.cliente), esc(m.asunto), esc(m.originador === 'NINGUNO' ? 'Orgánico' : ORIGINADOR_LABEL[m.originador]), pesos(m.monto)]),
    total: d.movs.length ? ['', 'Total', '', '', pesos(t.ingresoBruto)] : undefined,
    fuente: 'Ingresos brutos según la cláusula 5.3. Originador según la cláusula 4.2.',
  })

  const origen = [
    t.comisionFernando > 0 && ['Originación · Fernando', pct(p.originacion), pesos(t.comisionFernando)],
    t.comisionJustiniano > 0 && ['Originación · Justiniano', pct(p.originacion), pesos(t.comisionJustiniano)],
    t.comisionMw > 0 && ['Originación · MW', pct(p.originacion), pesos(t.comisionMw)],
  ].filter(Boolean) as string[][]

  const distribucion = (n: number) =>
    seccion(
      n,
      'Distribución entre las partes',
      indicadores([
        { valor: pesos(t.ingresoBruto), etiqueta: 'Ingresos brutos' },
        { valor: pesos(t.subtotalPagable), etiqueta: 'A pagar a las partes' },
        { valor: pesos(t.subtotalFondo), etiqueta: 'Aporte al Fondo' },
        { valor: pesos(saldoCierre), etiqueta: 'Saldo del Fondo', nota: 'al cierre del mes' },
      ]) +
        dosColumnas(
          cuadro({
            titulo: 'Reparto según la cláusula IV',
            columnas: [{ titulo: 'Concepto' }, { titulo: '%', num: true, ancho: '16%' }, { titulo: 'Monto', num: true, ancho: '32%' }],
            filas: [
              ...origen,
              ['MW', pct(p.mw), pesos(t.mwBase)],
              ['Operador · Fernando', pct(p.operador), pesos(t.operadorFernando)],
              ['Fondo · Fernando', pct(p.fondoFernando), pesos(t.fondoFernando)],
              ['Fondo · Justiniano', pct(p.fondoJustiniano), pesos(t.fondoJustiniano)],
            ],
            total: ['Total', '', pesos(t.ingresoBruto)],
            fuente: origen.length
              ? `La originación se calcula sobre el cobro; el resto del esquema, sobre lo que queda después.`
              : 'Sin originación en el mes: el esquema se aplica sobre el 100% de lo cobrado.',
          }),
          cuadro({
            titulo: 'A pagar a cada parte',
            columnas: [{ titulo: 'Parte', ancho: '30%' }, { titulo: 'Monto', num: true, ancho: '30%' }, { titulo: 'Estado' }],
            filas: BENEFICIARIOS.map((b) => [BENEFICIARIO_LABEL[b], pesos(aPagar(b, t)), esc(estado(b))]),
            total: ['Total', pesos(t.subtotalPagable), ''],
          }),
        ) +
        (d.movs.length > 1
          ? cuadro({
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
      { nueva: true, bajada: 'Cláusula IV del contrato asociativo. El bono comercial no va: es un acuerdo aparte con MW.' },
    )

  const fila = (concepto: string, f: number, j: number, signo = '') => [concepto, `${signo}${pesos(f)}`, `${signo}${pesos(j)}`, `${signo}${pesos(f + j)}`]
  const gastoDe = (b: 'FERNANDO' | 'JUSTINIANO') =>
    d.fondo.gastosMes.reduce((a, g) => {
      if (g.imputadoA === b) return a + g.monto
      if (g.imputadoA === null) return a + g.monto * (b === 'FERNANDO' ? d.fondo.cierre.parteFernando : 1 - d.fondo.cierre.parteFernando)
      return a
    }, 0)
  const distribDe = (b: 'FERNANDO' | 'JUSTINIANO') =>
    d.fondo.distribucionesMes.filter((x) => x.beneficiario === b).reduce((a, x) => a + x.monto, 0)

  const fondo = (n: number) =>
    seccion(
      n,
      'Fondo de Desarrollo',
      cuadro({
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
              titulo: 'Detalle de gastos del Fondo',
              columnas: [{ titulo: 'Fecha', ancho: '14%' }, { titulo: 'Concepto' }, { titulo: 'Imputado a', ancho: '20%' }, { titulo: 'Monto', num: true, ancho: '18%' }],
              filas: d.fondo.gastosMes.map((g) => [fecha(g.fecha), esc(g.concepto), g.imputadoA ? BENEFICIARIO_LABEL[g.imputadoA] : 'Ambos', pesos(g.monto)]),
              total: ['', 'Total', '', pesos(gastosMes)],
            })
          : ''),
    )

  const costosYNovedades = (n: number) =>
    seccion(
      n,
      'Costos de MW y novedades del producto',
      subtitulo('Costos cubiertos por MW (cláusula 3.1)') + textoLibre(textos.costosMw) + subtitulo('Novedades del producto') + textoLibre(textos.evolucion),
    )

  return { claves, detalleCobros, distribucion, fondo, costosYNovedades }
}
