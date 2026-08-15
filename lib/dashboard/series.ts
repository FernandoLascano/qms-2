/**
 * Series temporales para las tendencias del panel.
 *
 * Se calculan en JS a partir de las fechas que ya trae la consulta, en vez de
 * pedirle a la base un groupBy por semana: son decenas de filas, no miles, y
 * evita depender del dialecto SQL.
 */

const SEMANA_MS = 7 * 24 * 60 * 60 * 1000

/** Reparte fechas en N cubos semanales terminando en la semana actual. */
export function porSemana(fechas: (Date | null | undefined)[], semanas = 12): number[] {
  const ahora = Date.now()
  const cubos = new Array(semanas).fill(0)

  for (const fecha of fechas) {
    if (!fecha) continue
    const antiguedad = Math.floor((ahora - new Date(fecha).getTime()) / SEMANA_MS)
    if (antiguedad < 0 || antiguedad >= semanas) continue
    cubos[semanas - 1 - antiguedad] += 1
  }

  return cubos
}

/** Serie acumulada: útil para totales que sólo crecen (usuarios, inscriptas). */
export function acumulado(serie: number[], base = 0): number[] {
  let suma = base
  return serie.map((v) => (suma += v))
}

/**
 * Variación entre las últimas dos mitades de la serie, en porcentaje.
 * Devuelve null si no hay base con la que comparar.
 */
export function variacion(serie: number[]): number | null {
  if (serie.length < 4) return null
  const mitad = Math.floor(serie.length / 2)
  const previo = serie.slice(0, mitad).reduce((a, b) => a + b, 0)
  const actual = serie.slice(mitad).reduce((a, b) => a + b, 0)
  if (previo === 0) return actual > 0 ? 100 : null
  return Math.round(((actual - previo) / previo) * 100)
}
