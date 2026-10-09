/**
 * Cambio del capital social de un trámite.
 *
 * Los aportes de los socios se guardan en pesos (`aporteCapital`) dentro del
 * JSON `socios`. Si sólo se cambia `capitalSocial` (por ejemplo, el cliente
 * puso el mínimo y QMS lo redondea a $1.000.000), los aportes quedan con el
 * capital viejo y el estatuto saldría con números que no suman. Acá se
 * reescalan manteniendo el porcentaje de cada socio.
 */

type Socio = Record<string, unknown>

function aporteEnPesos(socio: Socio): number {
  const v = socio.aporteCapital
  if (typeof v === 'number') return v
  return parseFloat(String(v ?? '').replace(/\./g, '').replace(',', '.')) || 0
}

function porcentajeGuardado(socio: Socio): number {
  let p = parseFloat(String(socio.aportePorcentaje ?? socio.porcentaje ?? '').replace('%', '').replace(',', '.')) || 0
  // Algunos formularios viejos lo guardaron ×100.
  if (p > 100 && p <= 10_000) p /= 100
  return p > 0 && p <= 100 ? p : 0
}

/** Porcentaje de cada socio sobre el capital actual (suman 100 si los datos están bien). */
function porcentajes(socios: Socio[], capitalAnterior: number): number[] {
  const aportes = socios.map(aporteEnPesos)
  const total = aportes.reduce((a, b) => a + b, 0)
  // Si los aportes en pesos cierran con el capital, son la fuente más fiel.
  if (total > 0 && Math.abs(total - capitalAnterior) <= 1) {
    return aportes.map((a) => (a / total) * 100)
  }
  const guardados = socios.map(porcentajeGuardado)
  const sumaGuardados = guardados.reduce((a, b) => a + b, 0)
  if (sumaGuardados > 0) return guardados.map((p) => (p / sumaGuardados) * 100)
  if (total > 0) return aportes.map((a) => (a / total) * 100)
  return socios.map(() => 100 / socios.length)
}

/**
 * Devuelve los socios con los aportes en pesos llevados al capital nuevo.
 * Redondea a pesos enteros y el último socio absorbe la diferencia, así la
 * suma da exactamente el capital.
 */
export function reescalarAportes(sociosJson: unknown, capitalAnterior: number, capitalNuevo: number): unknown {
  if (!Array.isArray(sociosJson) || sociosJson.length === 0) return sociosJson
  const socios = sociosJson as Socio[]
  const pcts = porcentajes(socios, capitalAnterior)
  let asignado = 0
  return socios.map((socio, i) => {
    const aporte = i === socios.length - 1
      ? capitalNuevo - asignado
      : Math.round((capitalNuevo * pcts[i]) / 100)
    asignado += aporte
    const pct = capitalNuevo > 0 ? (aporte / capitalNuevo) * 100 : 0
    return {
      ...socio,
      aporteCapital: typeof socio.aporteCapital === 'number' ? aporte : String(aporte),
      ...(socio.aportePorcentaje !== undefined
        ? { aportePorcentaje: String(Number(pct.toFixed(2))) }
        : {}),
    }
  })
}
