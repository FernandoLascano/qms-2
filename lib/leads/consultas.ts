/**
 * Puntaje y etiquetas de los leads que todavía no son un trámite.
 *
 * Un borrador abandonado se puntúa por cuánto avanzó en el formulario; una
 * consulta no tiene formulario, así que las señales son otras: qué tan
 * reciente es, si dejó teléfono, si escribió algo concreto y por dónde entró.
 * La escala es la misma para que las dos fuentes convivan en una sola lista
 * ordenada.
 */

import type { LeadOrigen } from '@prisma/client'
import type { SenalPuntaje } from '@/lib/leads/prioridad'

export const ORIGEN_TEXTO: Record<string, string> = {
  FORMULARIO_CONTACTO: 'Escribió por el formulario',
  CHAT: 'Consultó por el chat',
  REGISTRO_SIN_TRAMITE: 'Se registró, no empezó',
  PARTNER: 'Viene de un partner',
  MANUAL: 'Cargado a mano',
}

export interface ConsultaParaPuntaje {
  createdAt: Date
  updatedAt: Date
  telefono: string | null
  mensaje: string | null
  origen: LeadOrigen
}

const DIA = 1000 * 60 * 60 * 24

export function calcularPuntajeConsulta(
  lead: ConsultaParaPuntaje,
  ahora: Date = new Date(),
): { puntaje: number; senales: SenalPuntaje[] } {
  const senales: SenalPuntaje[] = []
  const dias = Math.floor((ahora.getTime() - lead.updatedAt.getTime()) / DIA)

  if (dias <= 7) senales.push({ texto: 'Entró esta semana', puntos: 3 })
  if (lead.telefono) senales.push({ texto: 'Dejó teléfono', puntos: 2 })

  // Escribir una consulta concreta cuesta esfuerzo: separa al curioso del que
  // tiene un problema real.
  if (lead.mensaje && lead.mensaje.trim().length > 80)
    senales.push({ texto: 'Escribió una consulta concreta', puntos: 2 })

  // Quien escribió por el formulario ya se tomó el trabajo de contactarnos.
  if (lead.origen === 'FORMULARIO_CONTACTO')
    senales.push({ texto: 'Nos escribió por su cuenta', puntos: 2 })
  if (lead.origen === 'PARTNER')
    senales.push({ texto: 'Viene por un partner', puntos: 1 })

  if (dias > 90) senales.push({ texto: `Sin actividad hace ${dias} días`, puntos: -3 })

  return { puntaje: senales.reduce((t, s) => t + s.puntos, 0), senales }
}

/** Alias corto, que es como se usa desde la pantalla. */
export const puntajeConsulta = calcularPuntajeConsulta

/**
 * Lo que se le escribe por WhatsApp a alguien que consultó pero nunca empezó
 * el formulario. No hay paso en el que se haya frenado: se retoma la consulta.
 */
export function mensajeConsulta(nombre: string): string {
  const hola = `Hola${nombre ? ` ${nombre.split(' ')[0]}` : ''}!`
  return (
    `${hola} Soy Justiniano · QuieroMiSAS. Te escribo por la consulta que nos dejaste. ` +
    `Estoy para ayudarte con la constitución de tu empresa o para despejarte cualquier duda: ` +
    `contame en qué estás y te digo cómo seguimos.`
  )
}
