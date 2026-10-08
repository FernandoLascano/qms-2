import { readFile } from 'node:fs/promises'
import path from 'node:path'

/**
 * Diseño común de los reportes en PDF (mismo lenguaje que el contrato de
 * domicilio: Montserrat para títulos, Open Sans para texto, negro y rojo de
 * QuieroMiSAS). Cada reporte arma su cuerpo con estas piezas y lo convierte
 * con htmlAPdf (lib/pdf.ts).
 *
 * Las piezas devuelven HTML como texto. Todo lo que viene de la base pasa por
 * esc() antes de entrar.
 */

const DIR = path.join(process.cwd(), 'lib/plantillas')

export const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/* ───────────────────────── Formatos ───────────────────────── */

export const pesos = (n: number) => `$ ${Math.round(n).toLocaleString('es-AR')}`
export const numero = (n: number) => Math.round(n).toLocaleString('es-AR')
export const pct = (n: number, decimales = 0) =>
  `${n.toLocaleString('es-AR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales })}%`

/** Variación entre dos valores, en %. null si no hay base para comparar. */
export function variacion(actual: number, anterior: number): number | null {
  if (!anterior) return null
  return ((actual - anterior) / anterior) * 100
}

/* ───────────────────────── Piezas ───────────────────────── */

export type Portada = {
  rotulo: string // "Informe de gestión"
  titulo: string // "Octubre 2026"
  bajada: string // una línea que dice qué es
  datos: [string, string][] // [["Preparado por", "Fernando Lascano"], …]
}

function portadaHtml(p: Portada, logo: string) {
  return `
  <section class="portada">
    <img class="portada-logo" src="data:image/png;base64,${logo}" alt="QuieroMiSAS">
    <div class="portada-centro">
      <p class="portada-rotulo">${esc(p.rotulo)}</p>
      <h1>${esc(p.titulo)}</h1>
      <div class="portada-regla"></div>
      <p class="portada-bajada">${esc(p.bajada)}</p>
    </div>
    <dl class="portada-datos">
      ${p.datos.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}
    </dl>
    <div class="portada-pie">
      <span>Ancalan Consulting S.A. · operando bajo la marca QuieroMiSAS</span>
      <span class="conf">Confidencial</span>
    </div>
  </section>`
}

/** Sección numerada: "01  Resumen ejecutivo". `nueva` la empieza en hoja nueva. */
export function seccion(numero: number, titulo: string, cuerpo: string, opciones: { nueva?: boolean; bajada?: string } = {}) {
  return `
  <section class="seccion${opciones.nueva ? ' nueva' : ''}">
    <header class="seccion-titulo">
      <span class="seccion-num">${String(numero).padStart(2, '0')}</span>
      <div>
        <h2>${esc(titulo)}</h2>
        ${opciones.bajada ? `<p>${esc(opciones.bajada)}</p>` : ''}
      </div>
    </header>
    ${cuerpo}
  </section>`
}

export function subtitulo(texto: string) {
  return `<h3 class="sub">${esc(texto)}</h3>`
}

export function parrafo(texto: string) {
  return `<p>${esc(texto)}</p>`
}

/** Recuadro de mensajes clave (lo primero que lee un socio). Acepta <strong>. */
export function mensajesClave(titulo: string, puntos: string[]) {
  return `
  <div class="claves">
    <p class="claves-titulo">${esc(titulo)}</p>
    <ul>${puntos.map((p) => `<li>${p}</li>`).join('')}</ul>
  </div>`
}

export type Indicador = {
  valor: string
  etiqueta: string
  /** Variación en % contra el período anterior; null = sin comparación. */
  delta?: number | null
  /** Texto chico debajo (p. ej. "vs. septiembre"). */
  nota?: string
  /** Si bajar es bueno (p. ej. tiempos), el color se invierte. */
  menorEsMejor?: boolean
}

export function indicadores(items: Indicador[]) {
  return `<div class="kpis kpis-${items.length}">${items
    .map((k) => {
      let delta = ''
      if (k.delta != null && Number.isFinite(k.delta)) {
        const sube = k.delta > 0.05
        const baja = k.delta < -0.05
        const bueno = k.menorEsMejor ? baja : sube
        const malo = k.menorEsMejor ? sube : baja
        const flecha = sube ? '▲' : baja ? '▼' : '='
        delta = `<span class="delta ${bueno ? 'bien' : malo ? 'mal' : ''}">${flecha} ${pct(Math.abs(k.delta))}</span>`
      }
      return `<div class="kpi">
        <p class="kpi-valor">${esc(k.valor)}</p>
        <p class="kpi-etiqueta">${esc(k.etiqueta)}</p>
        ${delta || k.nota ? `<p class="kpi-nota">${delta}${k.nota ? ` <span>${esc(k.nota)}</span>` : ''}</p>` : ''}
      </div>`
    })
    .join('')}</div>`
}

export type Columna = { titulo: string; num?: boolean; ancho?: string }

/** Cuadro al estilo de un informe: título arriba (se numera solo, en orden), fuente abajo. */
export function cuadro(opciones: {
  titulo?: string
  columnas: Columna[]
  filas: (string | number)[][]
  total?: (string | number)[]
  fuente?: string
  vacio?: string
}) {
  const { columnas, filas, total } = opciones
  const celda = (v: string | number, i: number, tag: 'td' | 'th' = 'td') =>
    `<${tag}${columnas[i]?.num ? ' class="num"' : ''}>${typeof v === 'number' ? esc(numero(v)) : v}</${tag}>`
  const cuerpo = filas.length
    ? filas.map((f) => `<tr>${f.map((v, i) => celda(v, i)).join('')}</tr>`).join('')
    : `<tr><td class="vacio" colspan="${columnas.length}">${esc(opciones.vacio ?? 'Sin movimientos en el período.')}</td></tr>`
  return `
  <figure class="exhibit">
    ${opciones.titulo ? `<figcaption class="exhibit-titulo"><span class="n-cuadro"></span>${esc(opciones.titulo)}</figcaption>` : ''}
    <table class="tabla">
      <colgroup>${columnas.map((c) => `<col${c.ancho ? ` style="width:${c.ancho}"` : ''}>`).join('')}</colgroup>
      <thead><tr>${columnas.map((c) => `<th${c.num ? ' class="num"' : ''}>${esc(c.titulo)}</th>`).join('')}</tr></thead>
      <tbody>${cuerpo}</tbody>
      ${total ? `<tfoot><tr>${total.map((v, i) => celda(v, i)).join('')}</tr></tfoot>` : ''}
    </table>
    ${opciones.fuente ? `<p class="fuente">${esc(opciones.fuente)}</p>` : ''}
  </figure>`
}

/** Envoltorio de un gráfico SVG con título numerado y fuente. */
export function grafico(opciones: { titulo: string; svg: string; fuente?: string }) {
  return `
  <figure class="exhibit">
    <figcaption class="exhibit-titulo"><span class="n-grafico"></span>${esc(opciones.titulo)}</figcaption>
    <div class="grafico">${opciones.svg}</div>
    ${opciones.fuente ? `<p class="fuente">${esc(opciones.fuente)}</p>` : ''}
  </figure>`
}

export function dosColumnas(a: string, b: string) {
  return `<div class="dos-col"><div>${a}</div><div>${b}</div></div>`
}

export function notas(titulo: string, items: string[]) {
  return `<div class="notas"><p class="notas-titulo">${esc(titulo)}</p><ol>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ol></div>`
}

/* ───────────────────────── Documento ───────────────────────── */

/**
 * Arma el reporte como dos documentos: la portada (hoja entera, sin pie) y el
 * cuerpo (con pie y número de página). Se convierten por separado y se unen:
 * así la portada no lleva número y el cuerpo empieza en «Página 1».
 */
export async function documentoReporte(opciones: { titulo: string; portada: Portada; cuerpo: string }) {
  const [logo, montserrat, openSans, openSansItalic] = await Promise.all([
    readFile(path.join(DIR, 'logo-qms.png')),
    readFile(path.join(DIR, 'fuentes/montserrat-800.woff2')),
    readFile(path.join(DIR, 'fuentes/opensans.woff2')),
    readFile(path.join(DIR, 'fuentes/opensans-italic.woff2')),
  ])
  const b64 = (b: Buffer) => b.toString('base64')
  const html = (cuerpo: string, paginaCompleta: boolean) => `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${esc(opciones.titulo)}</title>
<style>
  @font-face { font-family: 'Montserrat'; font-weight: 800; src: url(data:font/woff2;base64,${b64(montserrat)}) format('woff2'); }
  @font-face { font-family: 'Open Sans'; font-weight: 300 800; font-style: normal; src: url(data:font/woff2;base64,${b64(openSans)}) format('woff2'); }
  @font-face { font-family: 'Open Sans'; font-weight: 300 800; font-style: italic; src: url(data:font/woff2;base64,${b64(openSansItalic)}) format('woff2'); }
  ${CSS}
  ${paginaCompleta ? '@page { margin: 0; }' : ''}
</style>
</head>
<body>
${cuerpo}
</body>
</html>`

  return {
    portada: html(portadaHtml(opciones.portada, b64(logo)), true),
    cuerpo: html(`<main class="cuerpo">\n${opciones.cuerpo}\n</main>`, false),
  }
}

export type DocumentoReporte = Awaited<ReturnType<typeof documentoReporte>>

/** Pie de cada hoja (la portada lo esconde con su propio fondo). */
export function pieReporte(texto: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  html { -webkit-print-color-adjust: exact; }
  body { margin: 0; font-family: 'Open Sans', Arial, sans-serif; font-size: 7pt; color: #8a8a8a; }
  table { width: calc(100% - 36mm); margin: 0 18mm; border-collapse: collapse; border-top: 1px solid #d6d2cf; }
  td { padding-top: 2.2mm; }
  td + td { text-align: right; }
  strong { color: #a51c1c; }
</style></head><body><table><tr>
  <td><strong>QuieroMiSAS</strong> · ${esc(texto)} · Confidencial</td>
  <td>Página <span class="pageNumber"></span> de <span class="totalPages"></span></td>
</tr></table></body></html>`
}

const CSS = `
  :root {
    --rojo: #a51c1c; --rojo-suave: #f6e7e7; --negro: #1c1c1c; --texto: #2b2b2b;
    --gris: #6b6b6b; --gris-2: #9a9a9a; --linea: #e3dfdc; --fondo: #f4f1ef; --verde: #2f7d4f;
  }
  @page { size: A4; margin: 15mm 0 17mm 0; }
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; font-family: 'Open Sans', sans-serif; font-size: 9pt; line-height: 1.55; color: var(--texto); }
  p { margin: 0 0 2.2mm; }
  strong { color: var(--negro); }

  /* Portada: ocupa la hoja entera (sin márgenes ni pie). */
  .portada { position: relative; height: 297mm; padding: 22mm 22mm 0; overflow: hidden; }
  .portada-logo { height: 18mm; }
  .portada-centro { position: absolute; left: 22mm; right: 22mm; top: 92mm; }
  .portada-rotulo { margin: 0 0 4mm; font-size: 10pt; font-weight: 700; letter-spacing: 0.24em; text-transform: uppercase; color: var(--rojo); }
  .portada h1 { margin: 0; font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: 34pt; line-height: 1.1; color: var(--negro); }
  .portada-regla { width: 28mm; height: 1.6mm; background: var(--rojo); margin: 8mm 0 6mm; }
  .portada-bajada { max-width: 130mm; font-size: 11pt; line-height: 1.5; color: var(--gris); }
  .portada-datos { position: absolute; left: 22mm; right: 22mm; bottom: 42mm; margin: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 6mm; border-top: 1px solid var(--linea); padding-top: 5mm; }
  .portada-datos dt { font-size: 7.5pt; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--gris-2); }
  .portada-datos dd { margin: 1mm 0 0; font-size: 9.5pt; color: var(--negro); }
  .portada-pie { position: absolute; left: 0; right: 0; bottom: 0; height: 24mm; background: var(--negro); border-top: 1.4mm solid var(--rojo); color: #d9d9d9; font-size: 8.5pt; display: flex; justify-content: space-between; align-items: center; padding: 0 22mm; }
  .portada-pie .conf { color: #fff; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; font-size: 7.5pt; }

  .cuerpo { padding: 0 18mm; }

  /* Secciones */
  .seccion { margin-top: 9mm; }
  .seccion:first-child { margin-top: 0; }
  .seccion.nueva { break-before: page; margin-top: 0; }
  .seccion-titulo { display: flex; align-items: flex-start; gap: 4mm; padding-bottom: 3mm; margin-bottom: 5mm; border-bottom: 1px solid var(--linea); break-after: avoid; }
  .seccion-num { font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: 20pt; line-height: 1; color: var(--rojo); }
  .seccion-titulo h2 { margin: 0; font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: 15pt; line-height: 1.15; color: var(--negro); }
  .seccion-titulo p { margin: 1mm 0 0; color: var(--gris); font-size: 8.8pt; }
  .sub { margin: 6mm 0 2.5mm; font-size: 9.5pt; font-weight: 700; color: var(--negro); letter-spacing: 0.02em; break-after: avoid; }

  /* Mensajes clave */
  .claves { background: var(--fondo); border-left: 1.2mm solid var(--rojo); padding: 4.5mm 6mm 3mm; margin: 0 0 6mm; break-inside: avoid; }
  .claves-titulo { margin: 0 0 2mm; font-size: 7.8pt; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: var(--rojo); }
  .claves ul { margin: 0; padding-left: 4.5mm; }
  .claves li { margin-bottom: 1.8mm; }
  .claves li::marker { color: var(--rojo); }

  /* Indicadores */
  .kpis { display: grid; gap: 3mm; margin: 0 0 6mm; break-inside: avoid; }
  .kpis-2 { grid-template-columns: repeat(2, 1fr); }
  .kpis-3 { grid-template-columns: repeat(3, 1fr); }
  .kpis-4 { grid-template-columns: repeat(4, 1fr); }
  .kpi { border-top: 1mm solid var(--negro); background: var(--fondo); padding: 3.5mm 4mm 3mm; }
  .kpi-valor { margin: 0; font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: 15pt; line-height: 1.15; color: var(--negro); white-space: nowrap; }
  .kpi-etiqueta { margin: 1.2mm 0 0; font-size: 8pt; font-weight: 600; color: var(--texto); }
  .kpi-nota { margin: 1mm 0 0; font-size: 7.4pt; color: var(--gris); }
  .delta { font-weight: 700; color: var(--gris); }
  .delta.bien { color: var(--verde); }
  .delta.mal { color: var(--rojo); }

  /* Cuadros y gráficos */
  .exhibit { margin: 0 0 6mm; break-inside: avoid; }
  .exhibit-titulo { margin-bottom: 2.2mm; font-size: 8.6pt; font-weight: 700; color: var(--negro); }
  /* «Cuadro N» y «Gráfico N» se numeran solos en el orden del documento. */
  .cuerpo { counter-reset: cuadro grafico; }
  .n-cuadro::before { counter-increment: cuadro; content: 'Cuadro ' counter(cuadro); }
  .n-grafico::before { counter-increment: grafico; content: 'Gráfico ' counter(grafico); }
  .exhibit-titulo span { display: inline-block; margin-right: 2mm; color: var(--rojo); font-size: 7.4pt; letter-spacing: 0.14em; text-transform: uppercase; }
  .fuente { margin: 1.6mm 0 0; font-size: 7.2pt; font-style: italic; color: var(--gris-2); }
  .tabla { width: 100%; border-collapse: collapse; font-size: 8.3pt; table-layout: fixed; }
  .tabla thead th { background: var(--negro); color: #fff; font-weight: 600; text-align: left; padding: 1.8mm 2.4mm; font-size: 7.6pt; letter-spacing: 0.03em; }
  .tabla td { padding: 1.7mm 2.4mm; border-bottom: 1px solid var(--linea); vertical-align: top; }
  .tabla tbody tr:nth-child(even) td { background: #faf8f7; }
  .tabla tr { break-inside: avoid; }
  .tabla .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .tabla tfoot td { font-weight: 700; color: var(--negro); border-top: 1.5px solid var(--negro); border-bottom: none; background: none; }
  .tabla .vacio { text-align: center; color: var(--gris-2); font-style: italic; padding: 4mm; }
  .tabla .tenue { color: var(--gris-2); }
  .grafico svg { display: block; width: 100%; height: auto; }

  .dos-col { display: grid; grid-template-columns: 1fr 1fr; gap: 7mm; }

  /* Notas */
  .notas { margin-top: 8mm; padding-top: 3mm; border-top: 1px solid var(--linea); font-size: 7.6pt; color: var(--gris); break-inside: avoid; }
  .notas-titulo { margin: 0 0 1.5mm; font-weight: 700; color: var(--texto); letter-spacing: 0.1em; text-transform: uppercase; font-size: 7.2pt; }
  .notas ol { margin: 0; padding-left: 4mm; }
  .notas li { margin-bottom: 1mm; }

  /* Texto que completa el usuario (costos de MW, evolución) */
  .libre { white-space: pre-line; }
  .pendiente { color: var(--rojo); font-style: italic; }
`
