import { readFile } from 'node:fs/promises'
import path from 'node:path'
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'

/**
 * Contrato de domicilio en sede, generado a partir de la plantilla Word
 * lib/plantillas/contrato-domicilio.docx. La plantilla usa campos {{así}};
 * docxtemplater los reemplaza dentro del propio .docx, así que se conservan
 * colores, tablas, logo y pie de página.
 *
 * Para cambiar el texto del contrato, se edita el Word y se reemplaza el
 * archivo: cada {{campo}} tiene que escribirse de una sola vez y con un único
 * formato, o Word lo parte y no se reemplaza.
 */

const PLANTILLA = path.join(process.cwd(), 'lib/plantillas/contrato-domicilio.docx')

/** Lo que carga el formulario: todo texto, salvo las casillas. */
export type DatosContrato = {
  sociedad_denominacion: string
  sociedad_cuit: string
  sociedad_matricula: string
  administracion_real: string
  representante_nombre: string
  representante_dni: string
  representante_caracter: string
  coobligado_nombre: string
  coobligado_dni: string
  coobligado_domicilio: string
  email: string
  email_alternativo: string
  whatsapp: string
  fiscal_arca: boolean
  fiscal_rentas: boolean
  precio_y_condiciones: string
  fecha_inicio: string // DD/MM/AAAA
  multa_diaria: string
  fianza_monto_maximo: string
  prestador_representante: string
  prestador_dni: string
  prestador_caracter: string
}

/** Socio o administrador que se puede elegir como representante o coobligado. */
export type PersonaContrato = {
  clave: string
  rol: string // "Administrador titular", "Socio", ...
  nombre: string
  dni: string
  domicilio: string
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

const CASILLA = (marcada: boolean) => (marcada ? '☒' : '☐')

/** La plantilla ya agrega "S.A.S." después de la denominación. */
export function sinTipoSocietario(denominacion: string): string {
  return denominacion.replace(/[\s,]*\b(S\.?\s?A\.?\s?S\.?)\s*$/i, '').trim()
}

/** Fecha en DD/MM/AAAA según el día argentino. */
export function fechaDDMMAAAA(fecha: Date): string {
  const [y, m, d] = fecha
    .toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
    .split('-')
  return `${d}/${m}/${y}`
}

export function precioYCondiciones(montoAnual: number | null | undefined): string {
  if (!montoAnual) return ''
  const monto = `$ ${Math.round(montoAnual).toLocaleString('es-AR')}`
  return `${monto} por año, pagadero por adelantado al inicio de cada período anual.`
}

/** Valores de la plantilla a partir del formulario. La firma es la fecha de generación. */
export function camposPlantilla(d: DatosContrato, generadoEl: Date = new Date()) {
  const [dia, mes, anio] = fechaDDMMAAAA(generadoEl).split('/')
  const inscripta = d.sociedad_matricula.trim() !== ''
  const { fiscal_arca, fiscal_rentas, ...texto } = d
  return {
    ...Object.fromEntries(Object.entries(texto).map(([k, v]) => [k, String(v ?? '').trim()])),
    sociedad_denominacion: sinTipoSocietario(d.sociedad_denominacion),
    check_inscripta: CASILLA(inscripta),
    check_en_tramite: CASILLA(!inscripta),
    check_fiscal_arca: CASILLA(fiscal_arca),
    check_fiscal_rentas: CASILLA(fiscal_rentas),
    firma_dia: String(Number(dia)),
    firma_mes: MESES[Number(mes) - 1],
    firma_anio: anio,
  }
}

const VACIO = '________'
const DIR = path.join(process.cwd(), 'lib/plantillas')

const escaparHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * Versión HTML del contrato, para el PDF: se ve como el diseño de QuieroMiSAS
 * (la conversión del Word con LibreOffice no lo respeta). El texto legal es el
 * mismo de la plantilla Word.
 */
export async function contratoDomicilioHtml(d: DatosContrato, generadoEl: Date = new Date()): Promise<string> {
  const [plantilla, logo, montserrat, openSans, openSansItalic] = await Promise.all([
    readFile(path.join(DIR, 'contrato-domicilio.html'), 'utf8'),
    readFile(path.join(DIR, 'logo-qms.png')),
    readFile(path.join(DIR, 'fuentes/montserrat-800.woff2')),
    readFile(path.join(DIR, 'fuentes/opensans.woff2')),
    readFile(path.join(DIR, 'fuentes/opensans-italic.woff2')),
  ])
  const archivos: Record<string, string> = {
    LOGO: logo.toString('base64'),
    FUENTE_MONTSERRAT: montserrat.toString('base64'),
    FUENTE_OPENSANS: openSans.toString('base64'),
    FUENTE_OPENSANS_ITALIC: openSansItalic.toString('base64'),
  }
  const campos: Record<string, string> = camposPlantilla(d, generadoEl)

  return plantilla.replace(/\{\{([A-Za-z_]+)\}\}/g, (todo, clave: string) => {
    if (clave in archivos) return archivos[clave]
    if (!(clave in campos)) return VACIO
    const valor = campos[clave]
    // Las casillas se dibujan: ☒ marcada (roja), ☐ vacía.
    if (clave.startsWith('check_')) return `<span class="box${valor === '☒' ? ' on' : ''}"></span>`
    return valor ? escaparHtml(valor).replace(/\n/g, '<br>') : VACIO
  })
}

/** Pie de página del PDF (Chromium lo dibuja en el margen inferior de cada hoja). */
export const PIE_CONTRATO_HTML = `<!doctype html><html><head><meta charset="utf-8"><style>
  html { -webkit-print-color-adjust: exact; }
  body { margin: 0; font-family: 'Open Sans', Arial, sans-serif; font-size: 7.5pt; color: #8a8a8a; }
  table { width: calc(100% - 38mm); margin: 0 19mm; border-collapse: collapse; border-top: 1px solid #d6d2cf; }
  td { padding-top: 2.5mm; }
  td + td { text-align: right; }
  strong { color: #a51c1c; }
</style></head><body><table><tr>
  <td><strong>QuieroMiSAS</strong> · quieromisas.com</td>
  <td>Contrato de servicio de domicilio · Página <span class="pageNumber"></span> de <span class="totalPages"></span></td>
</tr></table></body></html>`

export async function generarContratoDomicilio(d: DatosContrato, generadoEl: Date = new Date()): Promise<Buffer> {
  const zip = new PizZip(await readFile(PLANTILLA))
  const doc = new Docxtemplater(zip, {
    delimiters: { start: '{{', end: '}}' },
    paragraphLoop: true,
    linebreaks: true,
    // Un dato vacío o faltante queda como línea para completar a mano.
    nullGetter: () => '________',
  })
  const campos = camposPlantilla(d, generadoEl)
  // nullGetter sólo actúa con undefined/null: los textos vacíos también van a línea.
  doc.render(Object.fromEntries(Object.entries(campos).map(([k, v]) => [k, v === '' ? null : v])))
  return doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' }) as Buffer
}
