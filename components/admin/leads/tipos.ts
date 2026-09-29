import { toast } from 'sonner'
import type { SegmentoLead } from '@/lib/leads/avance'

/**
 * Un lead, venga de donde venga. Los formularios sin terminar viven en
 * `Tramite` y las consultas en `Lead`; la página los lleva a esta forma única
 * para que la pantalla no tenga que preguntar de dónde salió cada dato.
 */
export interface LeadCRM {
  id: string
  tipo: 'BORRADOR' | 'CONSULTA'
  nombre: string
  email: string | null
  telefono: string | null

  estado: string
  motivoPerdida: string | null
  motivoNota: string | null
  ultimoContacto: string | null
  proximoContacto: string | null
  creado: string
  ultimaActividad: string

  puntaje: number
  franja: 'ALTA' | 'MEDIA' | 'BAJA'
  senales: { texto: string; puntos: number }[]

  /** De dónde vino, en palabras. */
  origenTexto: string

  // Formulario sin terminar
  denominacion: string | null
  jurisdiccion: string | null
  plan: string | null
  avance: number | null
  segmento: SegmentoLead | null
  segmentoTexto: string | null
  hitos: { texto: string; ok: boolean }[] | null
  /** Secuencia de emails automáticos del cron. */
  toques: { enviados: number; total: number; ultimo: string | null } | null

  // Consulta
  mensaje: string | null
  partner: string | null

  actividad: { id: string; canal: string; nota: string; admin: string; fecha: string }[]
}

export const ESTADOS: { valor: string; texto: string }[] = [
  { valor: 'NUEVO', texto: 'Nuevo' },
  { valor: 'CONTACTADO', texto: 'Contactado' },
  { valor: 'EN_CONVERSACION', texto: 'En conversación' },
  { valor: 'ESPERANDO_CLIENTE', texto: 'Esperando respuesta' },
  { valor: 'CONVERTIDO', texto: 'Ganado' },
  { valor: 'DESCARTADO', texto: 'Perdido' },
]

export const estadoTexto = (valor: string) => ESTADOS.find((e) => e.valor === valor)?.texto ?? valor

export const MOTIVOS_PERDIDA = [
  { valor: 'NO_ENTENDIO', texto: 'No entendió el proceso' },
  { valor: 'SIN_DOMICILIO', texto: 'No tiene domicilio en Córdoba o CABA' },
  { valor: 'NO_DEFINIO', texto: 'Todavía no sabe qué necesita' },
  { valor: 'PRECIO', texto: 'Precio' },
  { valor: 'LO_HIZO_OTRO', texto: 'Lo hizo con otro' },
  { valor: 'NO_CONTESTA', texto: 'No contesta' },
  { valor: 'OTRO', texto: 'Otro' },
]

export const CANALES = [
  { valor: 'WHATSAPP', texto: 'WhatsApp' },
  { valor: 'LLAMADA', texto: 'Llamada' },
  { valor: 'EMAIL', texto: 'Email' },
  { valor: 'OTRO', texto: 'Nota' },
]

export const canalTexto = (valor: string) => CANALES.find((c) => c.valor === valor)?.texto ?? valor

/** Ruta de la API según la tabla donde vive el lead. */
export const rutaLead = (l: Pick<LeadCRM, 'id' | 'tipo'>) =>
  l.tipo === 'CONSULTA' ? `/api/admin/leads/consulta/${l.id}` : `/api/admin/leads/${l.id}`

export const rutaContacto = (l: Pick<LeadCRM, 'id' | 'tipo'>) =>
  l.tipo === 'CONSULTA' ? `/api/admin/leads/consulta/${l.id}` : `/api/admin/leads/${l.id}/seguimiento`

export async function pedir(url: string, metodo: string, json?: unknown) {
  const res = await fetch(url, {
    method: metodo,
    headers: json !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: json !== undefined ? JSON.stringify(json) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Algo salió mal')
  return data
}

/** Copia al portapapeles con aviso. Devuelve si pudo. */
export async function copiar(texto: string, que = 'Copiado'): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto)
    toast.success(que)
    return true
  } catch {
    toast.error('No se pudo copiar: seleccioná el texto y copialo a mano')
    return false
  }
}
