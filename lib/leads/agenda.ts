/**
 * En qué situación está cada lead respecto del seguimiento.
 *
 * La pantalla anterior tenía seis filtros que se pisaban («Cola de hoy»,
 * «Pendientes», «A seguir hoy», «Todos»…) y la cola metía a todo el que
 * tuviera teléfono, así que nunca se vaciaba. En los datos reales, 36 de 48
 * leads nunca se contactaron y sólo uno tenía próximo contacto agendado: el
 * problema no era filtrar, era que ningún lead tenía un próximo paso.
 *
 * Regla de CRM: todo lead abierto tiene una fecha de próximo contacto. La
 * agenda del día son los que vencen hoy o antes, más los que todavía no
 * tienen ninguno (nuevos sin tocar, o contactados sin fecha).
 */

export type Situacion =
  | 'VENCIDO' // tenía fecha y ya pasó
  | 'HOY' // la fecha es hoy
  | 'NUEVO' // nunca se lo contactó
  | 'SIN_PASO' // se lo contactó pero nadie agendó cuándo seguir
  | 'AGENDADO' // tiene fecha a futuro: por ahora no hay nada que hacer
  | 'GANADO'
  | 'PERDIDO'

export const ESTADOS_ABIERTOS = ['NUEVO', 'CONTACTADO', 'EN_CONVERSACION', 'ESPERANDO_CLIENTE'] as const

export interface LeadParaAgenda {
  estado: string
  ultimoContacto: string | null
  proximoContacto: string | null
}

/*
 * Las fechas de próximo contacto se eligen como día, sin hora. Se guardan al
 * mediodía UTC y se leen en UTC, así el día es el mismo en cualquier huso. Las
 * viejas quedaron a medianoche UTC: leídas en hora argentina retrocedían un
 * día, y un seguimiento del 30 aparecía vencido el 29.
 */

/** Día (YYYY-MM-DD) de una fecha de próximo contacto. */
export const diaDe = (iso: string) => iso.slice(0, 10)

/** Día de hoy en el reloj local. */
export function hoyClave(ahora = new Date()): string {
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`
}

/** Un día local (YYYY-MM-DD) + n días, como valor para guardar. */
export function diaMas(n: number, ahora = new Date()): string {
  const d = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Cómo se manda a la API un día elegido en el calendario. */
export const diaParaGuardar = (dia: string) => `${dia}T12:00:00.000Z`

export function situacionDe(lead: LeadParaAgenda, hoy = hoyClave()): Situacion {
  if (lead.estado === 'CONVERTIDO') return 'GANADO'
  if (lead.estado === 'DESCARTADO') return 'PERDIDO'
  if (lead.proximoContacto) {
    const dia = diaDe(lead.proximoContacto)
    if (dia < hoy) return 'VENCIDO'
    if (dia === hoy) return 'HOY'
    return 'AGENDADO'
  }
  if (!lead.ultimoContacto && lead.estado === 'NUEVO') return 'NUEVO'
  return 'SIN_PASO'
}

/** Lo que entra en «Para hoy», en el orden en que se muestra. */
export const SITUACIONES_HOY: Situacion[] = ['VENCIDO', 'HOY', 'NUEVO', 'SIN_PASO']

export const SITUACION_TEXTO: Record<Situacion, string> = {
  VENCIDO: 'Seguimiento vencido',
  HOY: 'Toca hoy',
  NUEVO: 'Nuevos sin contactar',
  SIN_PASO: 'Sin próximo paso',
  AGENDADO: 'Agendado',
  GANADO: 'Ganado',
  PERDIDO: 'Perdido',
}
