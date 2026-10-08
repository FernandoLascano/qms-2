/**
 * Fechas para mostrar, siempre en el calendario argentino.
 *
 * En la base conviven dos tipos de fecha:
 *   - Fechas civiles cargadas desde un input de fecha («2026-09-14»):
 *     `new Date('2026-09-14')` las guarda a las 00:00 UTC. Algunas, las más
 *     nuevas, se guardan a mediodía UTC (`diaParaGuardar` de lib/cartera).
 *   - Instantes reales (`new Date()` al marcar una etapa, registrar un cobro…).
 *
 * Antes cada pantalla elegía: unas formateaban en UTC y otras en la hora local
 * del navegador o del servidor. Una fecha civil a las 00:00 UTC son las 21 h
 * del día anterior en Argentina, así que el mismo dato aparecía corrido un día
 * según dónde se mirara (inscripción en Sociedades vs. el detalle;
 * vencimientos de domicilio en Sociedades vs. Domicilios).
 *
 * Regla única: si la fecha cae justo a las 00:00:00.000 UTC es una fecha civil
 * y se lee su día UTC; cualquier otra hora es un instante y se lee en
 * America/Argentina/Buenos_Aires. Para las de mediodía UTC las dos lecturas
 * dan el mismo día. Módulo puro: sirve en el servidor y en el cliente.
 */

export const ZONA_ARGENTINA = 'America/Argentina/Buenos_Aires'

type FechaEntrada = Date | string | number | null | undefined

function aDate(fecha: FechaEntrada): Date | null {
  if (fecha === null || fecha === undefined || fecha === '') return null
  const d = fecha instanceof Date ? fecha : new Date(fecha)
  return Number.isNaN(d.getTime()) ? null : d
}

/** ¿Es una fecha civil guardada a medianoche UTC? */
function esMedianocheUTC(d: Date): boolean {
  return (
    d.getUTCHours() === 0 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 &&
    d.getUTCMilliseconds() === 0
  )
}

/** Zona con la que hay que leer esta fecha para obtener su día argentino. */
const zonaDe = (d: Date) => (esMedianocheUTC(d) ? 'UTC' : ZONA_ARGENTINA)

/**
 * Formatea una fecha como día del calendario argentino.
 * Por defecto «14/9/2026». Devuelve `vacio` si no hay fecha.
 */
export function formatearFecha(
  fecha: FechaEntrada,
  opciones: Intl.DateTimeFormatOptions = {},
  vacio = '—',
): string {
  const d = aDate(fecha)
  if (!d) return vacio
  return d.toLocaleDateString('es-AR', { ...opciones, timeZone: zonaDe(d) })
}

/** «14 sept 2026». */
export const fechaCorta = (fecha: FechaEntrada, vacio = '—') =>
  formatearFecha(fecha, { day: 'numeric', month: 'short', year: 'numeric' }, vacio)

/** «14 de septiembre de 2026». */
export const fechaLarga = (fecha: FechaEntrada, vacio = '—') =>
  formatearFecha(fecha, { day: 'numeric', month: 'long', year: 'numeric' }, vacio)

/** Día argentino de una fecha en formato de input (YYYY-MM-DD), o '' si no hay. */
export function fechaParaInput(fecha: FechaEntrada): string {
  const d = aDate(fecha)
  if (!d) return ''
  return d.toLocaleDateString('en-CA', { timeZone: zonaDe(d) })
}

/** Hoy en Argentina, en formato de input (YYYY-MM-DD). */
export const hoyParaInput = () => new Date().toLocaleDateString('en-CA', { timeZone: ZONA_ARGENTINA })

/** Suma años a un día en formato YYYY-MM-DD, sin pasar por la hora local. */
export function sumarAniosInput(dia: string, anios = 1): string {
  const [y, m, d] = dia.split('-').map(Number)
  const r = new Date(Date.UTC(y + anios, m - 1, d))
  return r.toISOString().slice(0, 10)
}
