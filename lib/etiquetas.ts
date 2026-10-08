// Etiquetas legibles para valores que se guardan como códigos (planes,
// jurisdicciones, provincias, conceptos de pago, etapas). Se usan en las
// pantallas del cliente para no mostrar «EMPRENDEDOR», «CORDOBA» o
// «DEPOSITO_CAPITAL» tal cual están en la base.

export const NOMBRES_PLAN: Record<string, string> = {
  BASICO: 'Básico',
  EMPRENDEDOR: 'Emprendedor',
  PREMIUM: 'Premium',
}

export function nombrePlan(plan: string | null | undefined): string {
  if (!plan) return ''
  return NOMBRES_PLAN[plan] ?? capitalizar(plan)
}

const JURISDICCIONES: Record<string, { nombre: string; organismo: string }> = {
  CORDOBA: { nombre: 'Córdoba', organismo: 'IPJ' },
  CABA: { nombre: 'CABA', organismo: 'IGJ' },
}

/** «CORDOBA» → «Córdoba (IPJ)»; con `organismo: false` → «Córdoba». */
export function nombreJurisdiccion(
  jurisdiccion: string | null | undefined,
  { organismo = true }: { organismo?: boolean } = {}
): string {
  if (!jurisdiccion) return ''
  const j = JURISDICCIONES[jurisdiccion]
  if (!j) return provinciaLegible(jurisdiccion)
  return organismo ? `${j.nombre} (${j.organismo})` : j.nombre
}

const PROVINCIAS = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes',
  'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones',
  'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe',
  'Santiago del Estero', 'Tierra del Fuego', 'Tucumán',
]

const clave = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[_\s]+/g, ' ').trim().toUpperCase()

const PROVINCIA_POR_CLAVE = new Map(PROVINCIAS.map((p) => [clave(p), p]))
PROVINCIA_POR_CLAVE.set('CIUDAD AUTONOMA DE BUENOS AIRES', 'CABA')

/** «CORDOBA» o «cordoba» → «Córdoba». Si no la reconoce, la devuelve igual. */
export function provinciaLegible(provincia: string | null | undefined): string {
  if (!provincia) return ''
  return PROVINCIA_POR_CLAVE.get(clave(provincia)) ?? provincia
}

/** 782400 → «$ 782.400» */
export function pesos(monto: number | string | null | undefined): string {
  const n = typeof monto === 'string' ? Number(monto) : monto
  if (n == null || !Number.isFinite(n)) return ''
  return `$ ${Math.round(n).toLocaleString('es-AR')}`
}

export const NOMBRES_CONCEPTO: Record<string, string> = {
  DEPOSITO_CAPITAL: 'Depósito de capital',
  TASA_RETRIBUTIVA: 'Tasa retributiva',
  TASA_RESERVA_NOMBRE: 'Tasa de reserva de nombre',
  HONORARIOS_BASICO: 'Honorarios plan Básico',
  HONORARIOS_EMPRENDEDOR: 'Honorarios plan Emprendedor',
  HONORARIOS_PREMIUM: 'Honorarios plan Premium',
  HONORARIOS: 'Honorarios',
}

// Etapas del trámite (claves camelCase de la base)
const NOMBRES_ETAPA: Record<string, string> = {
  honorariosPagados: 'Honorarios pagados',
  denominacionReservada: 'Denominación reservada',
  capitalDepositado: 'Capital depositado',
  tasaPagada: 'Tasa pagada',
  borradorEnviado: 'Borrador enviado',
  documentosFirmados: 'Documentos firmados',
  tramiteIngresado: 'Trámite ingresado',
  tramiteObservado: 'Trámite observado',
  sociedadInscripta: 'Sociedad inscripta',
}
const ETAPA_POR_CLAVE = new Map(Object.entries(NOMBRES_ETAPA).map(([k, v]) => [k.toLowerCase(), v]))

/**
 * Limpia textos guardados que traen códigos crudos: «Comprobante - DEPOSITO_CAPITAL»
 * → «Comprobante - Depósito de capital»; «Etapa completada: tramite Ingresado»
 * → «Etapa completada: Trámite ingresado». Solo para mostrar: no cambia lo guardado.
 */
export function textoLegible(texto: string | null | undefined): string {
  if (!texto) return ''
  let t = texto.replace(/\b[A-Z]+(?:_[A-Z]+)+\b/g, (codigo) => NOMBRES_CONCEPTO[codigo] ?? codigo)
  t = t.replace(/^(Etapa completada:\s*)(.+)$/, (todo, prefijo: string, etapa: string) => {
    const nombre = ETAPA_POR_CLAVE.get(etapa.replace(/\s+/g, '').toLowerCase())
    return nombre ? prefijo + nombre : todo
  })
  for (const [tuteo, voseo] of VOSEO) t = t.replace(tuteo, voseo)
  return t
}

// Frases en tuteo de notificaciones viejas (ya guardadas en la base). Las que
// se generan hoy deberían venir en voseo; esto unifica lo que ya está guardado.
const VOSEO: [RegExp, string][] = [
  [/\bYa puedes\b/g, 'Ya podés'],
  [/\bPuedes\b/g, 'Podés'],
  [/\bpuedes\b/g, 'podés'],
  [/\bTienes\b/g, 'Tenés'],
  [/\btienes\b/g, 'tenés'],
  [/\bDebes\b/g, 'Tenés que'],
  [/\bdebes\b/g, 'tenés que'],
  [/\bIngresa a\b/g, 'Ingresá a'],
  [/\bingresa a\b/g, 'ingresá a'],
  [/\bHemos recibido\b/g, 'Recibimos'],
  [/\bLo revisaremos\b/g, 'Lo vamos a revisar'],
  [/\bRevisa\b/g, 'Revisá'],
  [/\bSube\b/g, 'Subí'],
  [/\bDescárgalos\b/g, 'Descargalos'],
]

function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}
