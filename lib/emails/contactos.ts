import { prisma } from '@/lib/prisma'

/**
 * Quién es cada dirección de email para el negocio.
 *
 * La bandeja recibe unos 60 mails por mes y ninguno sabía de quién era: había
 * que buscar a mano si el remitente era un cliente, un lead o un desconocido.
 * No se guarda en la base (no hay columna para eso): se resuelve al leer, con
 * dos consultas por página, así también reconoce a quien se registra después
 * de haber escrito.
 */
export type ContactoEmail =
  | {
      tipo: 'CLIENTE'
      nombre: string
      tramite: { id: string; denominacion: string; inscripta: boolean }
    }
  | {
      tipo: 'LEAD'
      nombre: string
      /** Id que abre el lead en el CRM (/dashboard/admin/leads?lead=…). */
      leadId: string
      origen: 'BORRADOR' | 'CONSULTA'
      estado: string
    }

export async function contactosDe(direcciones: string[]): Promise<Record<string, ContactoEmail>> {
  const emails = Array.from(new Set(direcciones.map((d) => d.trim().toLowerCase()).filter(Boolean)))
  if (!emails.length) return {}

  const [usuarios, leads] = await Promise.all([
    prisma.user.findMany({
      where: { email: { in: emails, mode: 'insensitive' } },
      select: {
        email: true,
        name: true,
        tramites: {
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            denominacionSocial1: true,
            denominacionAprobada: true,
            formularioCompleto: true,
            sociedadInscripta: true,
            leadEstado: true,
          },
        },
      },
    }),
    prisma.lead.findMany({
      where: { email: { in: emails } },
      select: { id: true, email: true, nombre: true, estado: true },
    }),
  ])

  const out: Record<string, ContactoEmail> = {}

  for (const l of leads) {
    if (!l.email) continue
    out[l.email.toLowerCase()] = {
      tipo: 'LEAD',
      nombre: l.nombre?.trim() || l.email,
      leadId: l.id,
      origen: 'CONSULTA',
      estado: l.estado,
    }
  }

  // Un usuario con trámite enviado es cliente, aunque también figure como lead.
  for (const u of usuarios) {
    const clave = u.email.toLowerCase()
    const nombre = u.name?.trim() || u.email
    const enviado = u.tramites.find((t) => t.formularioCompleto)
    if (enviado) {
      out[clave] = {
        tipo: 'CLIENTE',
        nombre,
        tramite: {
          id: enviado.id,
          denominacion: enviado.denominacionAprobada || enviado.denominacionSocial1,
          inscripta: enviado.sociedadInscripta,
        },
      }
    } else if (u.tramites[0]) {
      out[clave] = { tipo: 'LEAD', nombre, leadId: u.tramites[0].id, origen: 'BORRADOR', estado: u.tramites[0].leadEstado }
    }
  }

  return out
}

/** La dirección de la otra parte: el remitente si entró, el destinatario si salió. */
export const contraparteDe = (e: { direction: string; from: string; to: string[] }) =>
  (e.direction === 'INBOUND' ? e.from : e.to[0] ?? '').toLowerCase()
