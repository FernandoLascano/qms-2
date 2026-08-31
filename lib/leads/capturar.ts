import { prisma } from '@/lib/prisma'
import type { LeadOrigen } from '@prisma/client'

/**
 * Registra un interés comercial que todavía no es un trámite.
 *
 * Nunca lanza. Capturar el lead es un efecto secundario de otra cosa que le
 * importa a la persona —mandar una consulta, registrarse—, y esa acción no
 * puede fallar porque el registro comercial falle.
 *
 * Si el email ya existe se actualiza en vez de duplicarse: alguien que escribe
 * dos veces es el mismo interesado insistiendo, no dos personas.
 */

export interface DatosCaptura {
  email: string
  nombre?: string | null
  telefono?: string | null
  origen: LeadOrigen
  mensaje?: string | null
  userId?: string | null
  atribucion?: Atribucion | null
}

export interface Atribucion {
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  referrer?: string | null
  landingPath?: string | null
  partnerId?: string | null
}

const recortar = (valor: string | null | undefined, max: number): string | null => {
  const v = (valor || '').trim()
  return v ? v.slice(0, max) : null
}

export async function capturarLead(datos: DatosCaptura): Promise<string | null> {
  const email = recortar(datos.email, 200)?.toLowerCase()
  if (!email || !email.includes('@')) return null

  const a = datos.atribucion || {}

  try {
    const lead = await prisma.lead.upsert({
      where: { email },
      create: {
        email,
        nombre: recortar(datos.nombre, 200),
        telefono: recortar(datos.telefono, 60),
        origen: datos.origen,
        mensaje: recortar(datos.mensaje, 5000),
        userId: datos.userId || null,
        utmSource: recortar(a.utmSource, 120),
        utmMedium: recortar(a.utmMedium, 120),
        utmCampaign: recortar(a.utmCampaign, 200),
        referrer: recortar(a.referrer, 500),
        landingPath: recortar(a.landingPath, 500),
        partnerId: a.partnerId || null,
      },
      update: {
        // Sólo se completa lo que falta. El origen y la atribución son los de
        // la PRIMERA vez: por dónde entró realmente, no por dónde volvió.
        nombre: recortar(datos.nombre, 200) || undefined,
        telefono: recortar(datos.telefono, 60) || undefined,
        mensaje: recortar(datos.mensaje, 5000) || undefined,
        userId: datos.userId || undefined,
      },
      select: { id: true },
    })
    return lead.id
  } catch (error) {
    console.error('[leads] no se pudo capturar el lead:', error)
    return null
  }
}

/**
 * Marca ganado el lead de una persona que abrió un trámite. Es el mismo
 * criterio que para los borradores: lo pone el sistema, no una persona.
 */
export async function marcarLeadGanadoPorEmail(email: string | null | undefined) {
  const limpio = (email || '').trim().toLowerCase()
  if (!limpio) return
  try {
    await prisma.lead.updateMany({
      where: { email: limpio, estado: { notIn: ['CONVERTIDO'] } },
      data: { estado: 'CONVERTIDO', ganadoAt: new Date(), motivoPerdida: null, motivoNota: null },
    })
  } catch (error) {
    console.error('[leads] no se pudo marcar ganado el lead:', error)
  }
}

/** Lee la atribución de las cookies que deja el middleware en la primera visita. */
export function atribucionDeCookies(
  cookies: { get(name: string): { value: string } | undefined },
): Atribucion {
  const leer = (n: string) => cookies.get(n)?.value || null
  return {
    utmSource: leer('qms_utm_source'),
    utmMedium: leer('qms_utm_medium'),
    utmCampaign: leer('qms_utm_campaign'),
    referrer: leer('qms_referrer'),
    landingPath: leer('qms_landing'),
  }
}
