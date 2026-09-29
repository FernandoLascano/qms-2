import { prisma } from '@/lib/prisma'
import { situacionDe, type Situacion } from '@/lib/leads/agenda'

/**
 * Cuántos leads tiene la agenda de hoy, con el MISMO criterio que la pantalla
 * de leads. El panel «Hoy» contaba por su lado: sólo formularios sin terminar
 * (no las consultas) y con otra definición de vencido, así que el número de
 * la portada no coincidía con el de «Para hoy».
 */
export async function contarAgendaLeads(hoy: string): Promise<Record<Situacion, number>> {
  const [borradores, consultas] = await Promise.all([
    prisma.tramite.findMany({
      where: { formularioCompleto: false },
      select: { leadEstado: true, leadUltimoContacto: true, leadProximoContacto: true },
    }),
    prisma.lead.findMany({
      // Igual que la pantalla de leads: los que ya tienen trámite aparecen por
      // el borrador y no se cuentan dos veces.
      where: { OR: [{ userId: null }, { user: { tramites: { none: {} } } }] },
      select: { estado: true, ultimoContacto: true, proximoContacto: true },
    }),
  ])

  const cuenta: Record<Situacion, number> = {
    VENCIDO: 0, HOY: 0, NUEVO: 0, SIN_PASO: 0, AGENDADO: 0, GANADO: 0, PERDIDO: 0,
  }
  const iso = (d: Date | null) => (d ? d.toISOString() : null)

  for (const b of borradores) {
    cuenta[situacionDe({ estado: b.leadEstado, ultimoContacto: iso(b.leadUltimoContacto), proximoContacto: iso(b.leadProximoContacto) }, hoy)]++
  }
  for (const c of consultas) {
    cuenta[situacionDe({ estado: c.estado, ultimoContacto: iso(c.ultimoContacto), proximoContacto: iso(c.proximoContacto) }, hoy)]++
  }
  return cuenta
}
