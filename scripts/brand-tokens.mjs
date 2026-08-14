#!/usr/bin/env node
/**
 * Imprime la rampa de marca en hexadecimal para un tono dado.
 *
 * El dashboard no lo necesita: toma los colores de las variables CSS de
 * app/globals.css y se actualiza solo. Esto existe porque el HTML de los
 * emails no soporta variables CSS y hay que pegar los hex a mano en
 * lib/emails/templates.tsx.
 *
 *   node scripts/brand-tokens.mjs            → tono actual (24.5, rojo QMS)
 *   node scripts/brand-tokens.mjs 250        → azul
 *   node scripts/brand-tokens.mjs 150 0.14   → verde con menos saturación
 *
 * El tono y el croma tienen que coincidir con --brand-h / --brand-c
 * de app/globals.css.
 */

// --- sRGB <-> OKLab (Björn Ottosson) ---------------------------------------
const linearToSrgb = (c) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055

function oklchToHex(L, C, H) {
  const h = (H * Math.PI) / 180
  const a = C * Math.cos(h)
  const b = C * Math.sin(h)

  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3

  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map(linearToSrgb)

  const fueraDeGamut = rgb.some((v) => v < -0.002 || v > 1.002)
  const hex =
    '#' +
    rgb
      .map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0'))
      .join('')

  return { hex, fueraDeGamut }
}

// Misma escalera que app/globals.css: [paso, luminosidad, fracción de croma]
const ESCALERA = [
  [50, 0.97, 0.066],
  [100, 0.935, 0.152],
  [200, 0.878, 0.298],
  [300, 0.782, 0.559],
  [400, 0.679, 0.856],
  [500, 0.598, 1.0],
  [600, 0.496, 0.897],
  [700, 0.446, 0.813],
  [800, 0.382, 0.676],
  [900, 0.34, 0.576],
]

const hue = Number(process.argv[2] ?? 24.5)
const croma = Number(process.argv[3] ?? 0.1955)

if (Number.isNaN(hue) || Number.isNaN(croma)) {
  console.error('Uso: node scripts/brand-tokens.mjs [tono 0-360] [croma 0-0.4]')
  process.exit(1)
}

console.log(`\nRampa de marca — tono ${hue}, croma ${croma}\n`)
console.log('  En app/globals.css:  --brand-h: ' + hue + ';  --brand-c: ' + croma + ';\n')
console.log('  Para lib/emails/templates.tsx:\n')

const salida = {}
for (const [paso, L, factor] of ESCALERA) {
  const { hex, fueraDeGamut } = oklchToHex(L, croma * factor, hue)
  salida[paso] = hex
  console.log(
    `    brand-${String(paso).padEnd(3)} ${hex}${fueraDeGamut ? '   ⚠ fuera de gamut sRGB (recortado)' : ''}`,
  )
}

console.log(`
    primary:      '${salida[700]}'   // color del logo / botones
    primaryDark:  '${salida[800]}'   // hover
    primaryLight: '${salida[50]}'    // fondos suaves
`)
