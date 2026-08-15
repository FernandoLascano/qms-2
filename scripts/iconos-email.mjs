/**
 * Genera los iconos de los emails a partir de los mismos lucide que usa el sitio.
 *
 * Los clientes de correo no renderizan SVG ni componentes de React, así que la
 * iconografía tiene que viajar como PNG alojado. Este script toma el trazado de
 * cada icono desde node_modules/lucide-react, lo pinta del color del tono que
 * corresponde y lo rasteriza a 3x para que se vea nítido en pantallas densas.
 *
 * Correr después de cambiar los colores de marca:
 *   node scripts/iconos-email.mjs
 */
import { readFileSync, mkdirSync, readdirSync, unlinkSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const LUCIDE = join(RAIZ, 'node_modules/lucide-react/dist/esm/icons')
const SALIDA = join(RAIZ, 'public/assets/img/email')

/** Los mismos valores que lib/emails/templates.tsx y app/globals.css. */
const TONOS = {
  brand: '#991d23',
  success: '#1c6433',
  warning: '#724b15',
  info: '#145690',
  danger: '#912b26',
  neutral: '#616266',
}

/**
 * Qué icono acompaña a cada situación. Los nombres son los del sitio: si en el
 * panel una etapa cumplida es un CheckCircle, en el mail también.
 */
const ICONOS = [
  // Hechos con final feliz
  ['circle-check', 'success'],
  ['badge-check', 'success'],
  // Algo que el cliente tiene que hacer
  ['credit-card', 'warning'],
  ['clock', 'warning'],
  // Algo que salió mal
  ['file-text', 'danger'],
  ['circle-alert', 'danger'],
  // Contexto y ayuda
  ['info', 'info'],
  ['circle-help', 'info'],
  ['info', 'neutral'],
  // Marca
  ['sparkles', 'brand'],
  ['mail-check', 'brand'],
  ['clock', 'brand'],
  ['shield-check', 'brand'],
  ['chart-line', 'brand'],
  ['message-circle', 'brand'],
]

/** El tamaño de trazo de lucide en el sitio, escalado 3x para retina. */
const LADO = 24
const ESCALA = 3

/**
 * Los archivos de lucide exportan el trazado como `__iconNode`: un arreglo de
 * pares [etiqueta, atributos]. Se lee de ahí en vez de copiar los path a mano,
 * así un cambio de versión de lucide se refleja solo.
 */
function trazado(nombre, saltos = 0) {
  const archivo = join(LUCIDE, `${nombre}.js`)
  if (!existsSync(archivo)) throw new Error(`No existe el icono "${nombre}" en lucide-react`)
  const fuente = readFileSync(archivo, 'utf8')

  // Varios nombres son alias que reexportan otro archivo (circle-help apunta a
  // circle-question-mark). Se sigue la referencia.
  const alias = fuente.match(/export \{ default \} from '\.\/([\w-]+)\.js'/)
  if (alias) {
    if (saltos > 3) throw new Error(`Cadena de alias demasiado larga en "${nombre}"`)
    return trazado(alias[1], saltos + 1)
  }

  // El arreglo puede ocupar varias líneas y contiene corchetes anidados, así
  // que se corta en el `];` de cierre y no en el primer `]`.
  const m = fuente.match(/const __iconNode = (\[[\s\S]*?\n?\]);/)
  if (!m) throw new Error(`No pude leer el trazado de "${nombre}"`)
  // El literal usa claves sin comillas: se normaliza antes de parsear.
  const json = m[1].replace(/([{,]\s*)([a-zA-Z][\w-]*)(\s*:)/g, '$1"$2"$3')
  return JSON.parse(json)
}

function svg(nodos, color) {
  const cuerpo = nodos
    .map(([etiqueta, attrs]) => {
      const props = Object.entries(attrs)
        .filter(([k]) => k !== 'key')
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ')
      return `<${etiqueta} ${props} />`
    })
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${LADO}" height="${LADO}" viewBox="0 0 ${LADO} ${LADO}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${cuerpo}</svg>`
}

mkdirSync(SALIDA, { recursive: true })
for (const f of readdirSync(SALIDA)) if (f.endsWith('.png')) unlinkSync(join(SALIDA, f))

let n = 0
for (const [icono, tono] of ICONOS) {
  const nodos = trazado(icono)
  const marcado = svg(nodos, TONOS[tono])
  const destino = join(SALIDA, `${icono}-${tono}.png`)
  await sharp(Buffer.from(marcado), { density: 72 * ESCALA })
    .resize(LADO * ESCALA, LADO * ESCALA)
    .png({ compressionLevel: 9 })
    .toFile(destino)
  n++
}

console.log(`${n} iconos generados en public/assets/img/email/`)
