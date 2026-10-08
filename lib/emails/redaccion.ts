/**
 * Ayudas para los mails escritos a mano desde la bandeja (redactar, responder
 * y reenviar). Son funciones puras: las usa el navegador para completar la
 * plantilla y avisar antes de enviar, y el servidor como red de seguridad.
 */

/** Lo que se sabe del destinatario para rellenar las variables de una plantilla. */
export interface DatosDestinatario {
  email: string
  /** Nombre de pila, para el saludo y {{nombre}}. Vacío si no se conoce. */
  nombre: string
  nombreCompleto: string
  denominacion: string
  cuit: string
  matricula: string
  tramiteId: string
}

/** Primer nombre de una persona; nunca una dirección de email. */
export function primerNombre(nombre?: string | null): string {
  const limpio = (nombre ?? '').trim()
  if (!limpio || limpio.includes('@')) return ''
  return limpio.split(/\s+/)[0]
}

/** Las variables que se pueden usar en una plantilla de la base. */
export function variablesDe(datos: Partial<DatosDestinatario> | null | undefined): Record<string, string> {
  if (!datos) return {}
  const out: Record<string, string> = {}
  for (const [clave, valor] of Object.entries(datos)) {
    if (typeof valor === 'string' && valor.trim()) out[clave] = valor.trim()
  }
  // Alias que aparecen en las plantillas viejas.
  if (out.denominacion) out.denominacionSocial = out.denominacion
  if (out.nombreCompleto) out.nombre_completo = out.nombreCompleto
  return out
}

const VARIABLE = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g

/**
 * Reemplaza las {{variables}} que se conocen y deja a la vista las que no:
 * a diferencia de `interpolar`, que las borra, acá conviene que queden para
 * poder frenar el envío y que el operador las complete.
 */
export function interpolarConocidas(texto: string, datos: Record<string, string>): string {
  return texto.replace(VARIABLE, (crudo, clave: string) => datos[clave] ?? crudo)
}

/**
 * Indicaciones entre corchetes de las plantillas rápidas, del tipo
 * «[Completar con la novedad]». Sólo las que empiezan con un verbo de
 * instrucción, para no frenar un texto que lleva corchetes de verdad.
 */
const INDICACION =
  /\[\s*(?:completar|complet[aá]|escribir|escrib[ií]|agregar|agreg[aá]|insertar|insert[aá]|reemplazar|reemplaz[aá]|indicar|indic[aá]|detallar|detall[aá]|poner|pon[eé]|cargar|carg[aá]|xx+|\.\.\.|…)[^\]\n]*\]/gi

export interface Pendientes {
  indicaciones: string[]
  variables: string[]
}

/** Lo que quedó sin completar en el asunto o el cuerpo. */
export function pendientesDeCompletar(...textos: string[]): Pendientes {
  const todo = textos.join('\n')
  const indicaciones = Array.from(new Set(todo.match(INDICACION) ?? []))
  const variables = Array.from(new Set(Array.from(todo.matchAll(VARIABLE), (m) => `{{${m[1]}}}`)))
  return { indicaciones, variables }
}

/** Mensaje para el operador, o null si el mail está listo para salir. */
export function mensajeDePendientes({ indicaciones, variables }: Pendientes): string | null {
  const partes: string[] = []
  if (indicaciones.length) {
    partes.push(`Reemplazá ${indicaciones.length === 1 ? 'el texto' : 'los textos'} ${indicaciones.map((i) => `«${i}»`).join(', ')} por el contenido real`)
  }
  if (variables.length) {
    partes.push(
      variables.length === 1
        ? `Falta completar ${variables[0]}: no hay datos del destinatario para rellenarla, escribila a mano`
        : `Faltan completar ${variables.join(', ')}: no hay datos del destinatario para rellenarlas, escribilas a mano`,
    )
  }
  return partes.length ? `Antes de enviar: ${partes.join('. ')}.` : null
}

/**
 * Si el texto ya arranca con un saludo propio. Quien escribe a mano casi
 * siempre empieza con «¡Hola Martina!» o «Buen día»: con el saludo automático
 * del sobre, el mail decía hola dos veces.
 */
export function yaSaluda(texto: string): boolean {
  const inicio = texto
    .trimStart()
    .replace(/^[¡¿!"'«“(\s]+/, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
  return /^(hola|holis|buen(os|as)?\s+(dia|dias|tarde|tardes|noche|noches)|buenas|buen dia|estimad[oa]s?|querid[oa]s?|senor(a|es|as)?|sr\.?|sra\.?|srta\.?|saludos|que tal|hi|hello|dear)(?![a-z])/.test(
    inicio,
  )
}
