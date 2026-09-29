// Lógica de reparto de comisiones (cláusula 4 del contrato asociativo).
// Módulo puro (sin dependencias de Prisma/servidor) para poder usarse tanto en
// las API routes como en los componentes de UI.

export type Porcentajes = {
  mw: number // 30 = 30%
  operador: number // 50
  fondoFernando: number // 12
  fondoJustiniano: number // 8
  originacion: number // 30
}

export const PORCENTAJES_DEFAULT: Porcentajes = {
  mw: 30,
  operador: 50,
  fondoFernando: 12,
  fondoJustiniano: 8,
  originacion: 30,
}

export type Originador = 'NINGUNO' | 'FERNANDO' | 'JUSTINIANO' | 'MW'
export type Beneficiario = 'FERNANDO' | 'JUSTINIANO' | 'MW'

export const ORIGINADOR_LABEL: Record<Originador, string> = {
  NINGUNO: 'Ninguno (orgánico)',
  FERNANDO: 'Fernando',
  JUSTINIANO: 'Justiniano',
  MW: 'MW',
}

export const BENEFICIARIO_LABEL: Record<Beneficiario, string> = {
  FERNANDO: 'Fernando',
  JUSTINIANO: 'Justiniano',
  MW: 'MW',
}

// Conceptos de Pago que cuentan como INGRESO (honorarios). El resto son gastos/tasas.
export const CONCEPTOS_HONORARIOS = [
  'HONORARIOS_BASICO',
  'HONORARIOS_EMPRENDEDOR',
  'HONORARIOS_PREMIUM',
] as const

export function esHonorario(concepto: string): boolean {
  return (CONCEPTOS_HONORARIOS as readonly string[]).includes(concepto)
}

// Monto efectivamente cobrado de un Pago: si se pagó por transferencia y hay
// monto con descuento, ése es el ingreso real; si no, el monto de lista.
export function montoCobrado(pago: {
  monto: number
  montoTransferencia?: number | null
  metodoPago?: string | null
}): number {
  if (pago.metodoPago === 'TRANSFERENCIA' && pago.montoTransferencia != null) {
    return pago.montoTransferencia
  }
  return pago.monto
}

export type RepartoMovimiento = {
  comisionOriginacion: number
  baseEsquema: number
  mw: number
  operadorFernando: number
  fondoFernando: number
  fondoJustiniano: number
  // A pagar (liquidable en el período)
  aPagarFernando: number
  aPagarJustiniano: number
  aPagarMw: number
  // Verificación (debe ser ~0)
  verif: number
}

// Reparto de un ingreso individual según el originador y los porcentajes.
// - Sin originador: esquema base sobre el 100%.
// - Con originador: 30% de comisión al originador + esquema base sobre el 70% restante.
//   La comisión se SUMA a las participaciones base del originador.
export function calcularReparto(
  monto: number,
  originador: Originador,
  p: Porcentajes = PORCENTAJES_DEFAULT
): RepartoMovimiento {
  const m = Number.isFinite(monto) ? monto : 0
  const comisionOriginacion = originador !== 'NINGUNO' ? m * (p.originacion / 100) : 0
  const baseEsquema = m - comisionOriginacion

  const mw = baseEsquema * (p.mw / 100)
  const operadorFernando = baseEsquema * (p.operador / 100)
  const fondoFernando = baseEsquema * (p.fondoFernando / 100)
  const fondoJustiniano = baseEsquema * (p.fondoJustiniano / 100)

  const aPagarFernando = operadorFernando + (originador === 'FERNANDO' ? comisionOriginacion : 0)
  const aPagarJustiniano = originador === 'JUSTINIANO' ? comisionOriginacion : 0
  const aPagarMw = mw + (originador === 'MW' ? comisionOriginacion : 0)

  const verif = m - (aPagarFernando + aPagarJustiniano + aPagarMw + fondoFernando + fondoJustiniano)

  return {
    comisionOriginacion,
    baseEsquema,
    mw,
    operadorFernando,
    fondoFernando,
    fondoJustiniano,
    aPagarFernando,
    aPagarJustiniano,
    aPagarMw,
    verif,
  }
}

export type TotalesLiquidacion = {
  ingresoBruto: number
  // A pagar por beneficiario
  aPagarFernando: number
  aPagarJustiniano: number
  aPagarMw: number
  subtotalPagable: number
  // Fondo de Desarrollo (acumulado, no se paga salvo acuerdo)
  fondoFernando: number
  fondoJustiniano: number
  subtotalFondo: number
  // Desglose útil
  operadorFernando: number
  comisionFernando: number
  comisionJustiniano: number
  comisionMw: number
  mwBase: number
}

// Suma el reparto de un conjunto de movimientos (ya filtrados por período).
export function totalizar(
  movimientos: { monto: number; originador: Originador }[],
  p: Porcentajes = PORCENTAJES_DEFAULT
): TotalesLiquidacion {
  const t: TotalesLiquidacion = {
    ingresoBruto: 0,
    aPagarFernando: 0,
    aPagarJustiniano: 0,
    aPagarMw: 0,
    subtotalPagable: 0,
    fondoFernando: 0,
    fondoJustiniano: 0,
    subtotalFondo: 0,
    operadorFernando: 0,
    comisionFernando: 0,
    comisionJustiniano: 0,
    comisionMw: 0,
    mwBase: 0,
  }
  for (const mov of movimientos) {
    const r = calcularReparto(mov.monto, mov.originador, p)
    t.ingresoBruto += mov.monto
    t.aPagarFernando += r.aPagarFernando
    t.aPagarJustiniano += r.aPagarJustiniano
    t.aPagarMw += r.aPagarMw
    t.fondoFernando += r.fondoFernando
    t.fondoJustiniano += r.fondoJustiniano
    t.operadorFernando += r.operadorFernando
    t.mwBase += r.mw
    if (mov.originador === 'FERNANDO') t.comisionFernando += r.comisionOriginacion
    if (mov.originador === 'JUSTINIANO') t.comisionJustiniano += r.comisionOriginacion
    if (mov.originador === 'MW') t.comisionMw += r.comisionOriginacion
  }
  t.subtotalPagable = t.aPagarFernando + t.aPagarJustiniano + t.aPagarMw
  t.subtotalFondo = t.fondoFernando + t.fondoJustiniano
  return t
}

// Convierte el período de una fecha a "YYYY-MM".
export function periodoDe(fecha: Date | string): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/* ───────────────────────── Períodos y fechas ─────────────────────────
   Las fechas de los movimientos se guardan como medianoche UTC del día
   calendario argentino, así que se leen en UTC. El "hoy" del usuario, en
   cambio, es su día local: `toISOString()` a las 22 h de Argentina ya da
   el día siguiente, y por eso los formularios arrancaban con fecha de mañana. */

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

/** "2026-09" → "Septiembre 2026" */
export function etiquetaPeriodo(periodo: string): string {
  const [y, m] = periodo.split('-').map(Number)
  return `${MESES[m - 1]} ${y}`
}

/** Hoy en formato YYYY-MM-DD según el reloj local (para inputs de fecha). */
export function hoyInput(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Período actual según el reloj local. */
export function periodoHoy(): string {
  return hoyInput().slice(0, 7)
}

/** Suma (o resta) meses a un período "YYYY-MM". */
export function moverPeriodo(periodo: string, delta: number): string {
  const [y, m] = periodo.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

/** Todos los meses entre dos períodos, ambos incluidos, del más nuevo al más viejo. */
export function rangoPeriodos(desde: string, hasta: string): string[] {
  const out: string[] = []
  for (let p = hasta; p >= desde; p = moverPeriodo(p, -1)) out.push(p)
  return out
}

/** Medianoche UTC del día calendario argentino de un instante. */
export function diaArgentino(instante: Date): Date {
  const dia = instante.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
  return new Date(`${dia}T00:00:00.000Z`)
}

/* ───────────────────────── Fondo de Desarrollo ───────────────────────── */

export type SaldoFondo = {
  acumulado: number
  distribuido: number
  gastado: number
  saldo: number
}

/**
 * Saldo de cada uno en el fondo. Un gasto sin imputar es común a los dos y
 * se reparte en la MISMA proporción en que se formó el fondo (hoy 12 y 8, o
 * sea 60/40), tomada de la configuración y no de un número fijo.
 */
export function saldosFondo(
  acumulado: { FERNANDO: number; JUSTINIANO: number },
  distribuciones: { beneficiario: Beneficiario; monto: number }[],
  gastos: { imputadoA: Beneficiario | null; monto: number }[],
  p: Porcentajes = PORCENTAJES_DEFAULT
): { FERNANDO: SaldoFondo; JUSTINIANO: SaldoFondo; parteFernando: number } {
  const suma = p.fondoFernando + p.fondoJustiniano
  const parteFernando = suma > 0 ? p.fondoFernando / suma : 0.5

  const de = (b: 'FERNANDO' | 'JUSTINIANO'): SaldoFondo => {
    const distribuido = distribuciones
      .filter((d) => d.beneficiario === b)
      .reduce((a, d) => a + d.monto, 0)
    const gastado = gastos.reduce((a, g) => {
      if (g.imputadoA === b) return a + g.monto
      if (g.imputadoA === null) return a + g.monto * (b === 'FERNANDO' ? parteFernando : 1 - parteFernando)
      return a
    }, 0)
    return { acumulado: acumulado[b], distribuido, gastado, saldo: acumulado[b] - distribuido - gastado }
  }

  return { FERNANDO: de('FERNANDO'), JUSTINIANO: de('JUSTINIANO'), parteFernando }
}
