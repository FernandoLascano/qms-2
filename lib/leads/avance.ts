/**
 * Cuánto del formulario completó un borrador, y dónde se frenó.
 *
 * Vive acá y no dentro de la pantalla de leads porque lo consumen tres lugares:
 * la lista del panel, el puntaje de prioridad y la secuencia de emails, que
 * necesita saber en qué paso se trabó la persona para decirle algo útil.
 */

export type DatosUsuario = {
  nombre?: string
  apellido?: string
  dni?: string
  email?: string
  telefono?: string
  ciudad?: string
  provincia?: string
}

type Persona = { nombre?: string }

export interface BorradorParaAvance {
  datosUsuario: unknown
  socios: unknown
  administradores: unknown
  denominacionSocial1: string
  domicilioLegal: string
}

export const leerPersonas = (valor: unknown): Persona[] =>
  Array.isArray(valor) ? (valor as Persona[]) : []

export const leerDatosUsuario = (valor: unknown): DatosUsuario =>
  valor && typeof valor === 'object' ? (valor as DatosUsuario) : {}

/**
 * El domicilio se guarda como "calle, número, localidad, provincia" y la
 * provincia viene precargada. Cuando la persona no completó nada, queda el
 * literal ", , , Córdoba".
 *
 * La versión anterior preguntaba si el campo quedaba vacío al sacarle espacios
 * y comas — y ", , , Córdoba" deja "Córdoba", que no está vacío. Resultado: 17
 * de 25 borradores figuraban con el domicilio hecho sin tener una dirección, y
 * el avance mostrado quedaba inflado justo en el paso donde la gente se cae.
 *
 * Ahora se exige más de un componente con contenido: una dirección de verdad
 * tiene al menos calle y localidad, no sólo la provincia que ya estaba puesta.
 */
export function tieneDomicilioReal(domicilioLegal: string | null | undefined): boolean {
  const valor = (domicilioLegal || '').trim()
  if (!valor || valor === 'A informar') return false
  const partes = valor
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
  return partes.length >= 2
}

/** Los hitos del formulario, en el orden en que se los encuentra la persona. */
export const HITOS = [
  'nombre',
  'dni',
  'denominacion',
  'domicilio',
  'socios',
  'administradores',
] as const

export type Hito = (typeof HITOS)[number]

export function hitosCumplidos(tramite: BorradorParaAvance): Record<Hito, boolean> {
  const datos = leerDatosUsuario(tramite.datosUsuario)
  return {
    nombre: !!datos.nombre,
    dni: !!datos.dni,
    denominacion: tramite.denominacionSocial1 !== 'Pendiente de definir',
    domicilio: tieneDomicilioReal(tramite.domicilioLegal),
    socios: leerPersonas(tramite.socios).some((s) => s.nombre),
    administradores: leerPersonas(tramite.administradores).some((a) => a.nombre),
  }
}

export function calcularAvance(tramite: BorradorParaAvance): number {
  const cumplidos = Object.values(hitosCumplidos(tramite)).filter(Boolean).length
  return Math.round((cumplidos / HITOS.length) * 100)
}

/**
 * Segmentos de abandono.
 *
 * Medido sobre los 25 borradores de producción: 10 no llegaron a escribir un
 * nombre y 8 cargaron datos pero nunca una dirección — de 8 que eligen
 * denominación, sólo 1 completa el domicilio. Son dos problemas distintos y
 * necesitan mensajes distintos, así que el segmento es lo que elige qué se le
 * dice a cada uno.
 */
export type SegmentoLead = 'NO_ARRANCO' | 'TRABADO_DOMICILIO' | 'CASI_LISTO'

export function segmentoDe(tramite: BorradorParaAvance): SegmentoLead {
  const h = hitosCumplidos(tramite)
  if (!h.nombre && !h.dni) return 'NO_ARRANCO'
  if (!h.domicilio) return 'TRABADO_DOMICILIO'
  return 'CASI_LISTO'
}

export const SEGMENTO_TEXTO: Record<SegmentoLead, string> = {
  NO_ARRANCO: 'No arrancó',
  TRABADO_DOMICILIO: 'Trabado en el domicilio',
  CASI_LISTO: 'Casi listo',
}
