import { esc } from './diseno'

/**
 * Gráficos en SVG para los reportes. Se dibujan en un lienzo fijo y el PDF los
 * escala al ancho de la columna. Paleta sobria: gris para el contexto, rojo
 * para lo que importa (el mes del informe, el dato a mirar).
 */

const ROJO = '#a51c1c'
const GRIS = '#c9c4c0'
const GRIS_TEXTO = '#6b6b6b'
const NEGRO = '#1c1c1c'
const LINEA = '#e3dfdc'
const FUENTE = `font-family="Open Sans, sans-serif"`

/** Montos cortos para etiquetas: 1,2 M · 850 k. */
export function abreviar(n: number): string {
  const a = Math.abs(n)
  if (a >= 1_000_000) return `${(n / 1_000_000).toLocaleString('es-AR', { maximumFractionDigits: 1 })} M`
  if (a >= 1_000) return `${Math.round(n / 1_000).toLocaleString('es-AR')} k`
  return Math.round(n).toLocaleString('es-AR')
}

/** Escala "linda" para el eje: 0, 500 k, 1 M, 1,5 M… */
function paso(max: number, divisiones = 4) {
  if (max <= 0) return 1
  const bruto = max / divisiones
  const mag = 10 ** Math.floor(Math.log10(bruto))
  const n = bruto / mag
  const lindo = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10
  return lindo * mag
}

/** Barras verticales (p. ej. 12 meses). `destacado` = índice que va en rojo. */
export function barrasVerticales(opciones: {
  datos: { etiqueta: string; valor: number }[]
  destacado?: number
  formato?: (n: number) => string
  alto?: number
}) {
  const { datos, destacado = -1, formato = abreviar } = opciones
  const W = 640
  const H = opciones.alto ?? 220
  const izq = 44
  const abajo = 26
  const arriba = 18
  const max = Math.max(...datos.map((d) => d.valor), 0)
  const p = paso(max)
  const tope = Math.max(p * Math.ceil(max / p), p)
  const altoUtil = H - abajo - arriba
  const y = (v: number) => arriba + altoUtil - (v / tope) * altoUtil
  const ancho = (W - izq) / Math.max(datos.length, 1)
  const barra = Math.min(ancho * 0.62, 34)

  const ejes: string[] = []
  for (let v = 0; v <= tope + 1e-9; v += p) {
    ejes.push(
      `<line x1="${izq}" x2="${W}" y1="${y(v)}" y2="${y(v)}" stroke="${LINEA}" stroke-width="1"/>` +
        `<text x="${izq - 6}" y="${y(v) + 3}" text-anchor="end" font-size="9" fill="${GRIS_TEXTO}" ${FUENTE}>${esc(abreviar(v))}</text>`,
    )
  }
  const barras = datos.map((d, i) => {
    const cx = izq + ancho * i + ancho / 2
    const yv = y(d.valor)
    const color = i === destacado ? ROJO : GRIS
    const valor =
      d.valor > 0
        ? `<text x="${cx}" y="${yv - 4}" text-anchor="middle" font-size="8.5" font-weight="${i === destacado ? 700 : 400}" fill="${i === destacado ? NEGRO : GRIS_TEXTO}" ${FUENTE}>${esc(formato(d.valor))}</text>`
        : ''
    return (
      `<rect x="${cx - barra / 2}" y="${yv}" width="${barra}" height="${Math.max(arriba + altoUtil - yv, 0)}" fill="${color}"/>` +
      valor +
      `<text x="${cx}" y="${H - 8}" text-anchor="middle" font-size="9" fill="${i === destacado ? NEGRO : GRIS_TEXTO}" font-weight="${i === destacado ? 700 : 400}" ${FUENTE}>${esc(d.etiqueta)}</text>`
    )
  })
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${ejes.join('')}${barras.join('')}</svg>`
}

/** Barras horizontales con etiqueta, valor y participación. */
export function barrasHorizontales(opciones: {
  datos: { etiqueta: string; valor: number; nota?: string }[]
  formato?: (n: number) => string
  destacarPrimero?: boolean
}) {
  const { datos, formato = abreviar, destacarPrimero = true } = opciones
  const W = 640
  const fila = 26
  const etiquetaAncho = 190
  const valorAncho = 120
  const H = Math.max(datos.length, 1) * fila + 4
  const max = Math.max(...datos.map((d) => d.valor), 0) || 1
  const util = W - etiquetaAncho - valorAncho
  const filas = datos.map((d, i) => {
    const y = i * fila + 4
    const w = (d.valor / max) * util
    return (
      `<text x="0" y="${y + 13}" font-size="9.5" fill="${NEGRO}" ${FUENTE}>${esc(d.etiqueta)}</text>` +
      `<rect x="${etiquetaAncho}" y="${y + 3}" width="${Math.max(w, 1.5)}" height="14" fill="${destacarPrimero && i === 0 ? ROJO : GRIS}"/>` +
      `<text x="${etiquetaAncho + Math.max(w, 1.5) + 6}" y="${y + 13}" font-size="9" font-weight="600" fill="${NEGRO}" ${FUENTE}>${esc(formato(d.valor))}${d.nota ? `<tspan font-weight="400" fill="${GRIS_TEXTO}">  ${esc(d.nota)}</tspan>` : ''}</text>`
    )
  })
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${filas.join('')}</svg>`
}
