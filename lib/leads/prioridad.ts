/**
 * Puntaje de prioridad de un lead.
 *
 * No es un modelo ni un algoritmo: es una suma de señales que se lee en diez
 * segundos y se discute en una reunión. Con 25 leads eso alcanza y sobra, y
 * tiene la ventaja de que cuando la lista ordena raro se puede ver exactamente
 * por qué.
 *
 * El objetivo no es adivinar quién compra: es que nadie quede sepultado abajo
 * de la lista sólo porque entró hace más tiempo.
 */

import { hitosCumplidos, type BorradorParaAvance } from '@/lib/leads/avance'

export interface LeadParaPuntaje extends BorradorParaAvance {
  ultimaActividad: Date
  telefono: string | null
  vienePorPartner?: boolean
}

export interface SenalPuntaje {
  texto: string
  puntos: number
}

const DIA = 1000 * 60 * 60 * 24

/** Devuelve el puntaje y las señales que lo formaron, para poder mostrarlas. */
export function calcularPrioridad(
  lead: LeadParaPuntaje,
  ahora: Date = new Date(),
): { puntaje: number; senales: SenalPuntaje[] } {
  const senales: SenalPuntaje[] = []
  const dias = Math.floor((ahora.getTime() - lead.ultimaActividad.getTime()) / DIA)
  const hitos = hitosCumplidos(lead)

  if (dias <= 7) senales.push({ texto: 'Activo esta semana', puntos: 3 })
  if (lead.telefono) senales.push({ texto: 'Tiene teléfono', puntos: 2 })
  if (hitos.denominacion) senales.push({ texto: 'Eligió denominación', puntos: 2 })

  const completados = Object.values(hitos).filter(Boolean).length
  if (completados >= 3) senales.push({ texto: 'Formulario a más de la mitad', puntos: 2 })

  if (lead.vienePorPartner) senales.push({ texto: 'Viene por un partner', puntos: 1 })

  // Se enfría, no se descarta: sigue en la lista, más abajo.
  if (dias > 90) senales.push({ texto: `Sin actividad hace ${dias} días`, puntos: -3 })

  const puntaje = senales.reduce((total, s) => total + s.puntos, 0)
  return { puntaje, senales }
}

/**
 * Franja para pintar la fila. Los umbrales salen de la distribución real: con
 * los datos de hoy, "alta" deja arriba a los que eligieron denominación y
 * siguen activos.
 */
export type FranjaPrioridad = 'ALTA' | 'MEDIA' | 'BAJA'

export function franjaDe(puntaje: number): FranjaPrioridad {
  if (puntaje >= 6) return 'ALTA'
  if (puntaje >= 3) return 'MEDIA'
  return 'BAJA'
}

export const FRANJA_TEXTO: Record<FranjaPrioridad, string> = {
  ALTA: 'Alta',
  MEDIA: 'Media',
  BAJA: 'Baja',
}
