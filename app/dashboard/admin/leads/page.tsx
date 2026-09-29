import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import LeadsCRM from '@/components/admin/leads/LeadsCRM'
import type { LeadCRM } from '@/components/admin/leads/tipos'
import {
  HITOS,
  calcularAvance,
  hitosCumplidos,
  leerDatosUsuario,
  segmentoDe,
  SEGMENTO_TEXTO,
} from '@/lib/leads/avance'
import { calcularPrioridad, franjaDe } from '@/lib/leads/prioridad'
import { TOQUES } from '@/lib/leads/mensajes'
import { ORIGEN_TEXTO, puntajeConsulta } from '@/lib/leads/consultas'

const HITO_TEXTO: Record<(typeof HITOS)[number], string> = {
  nombre: 'Nombre',
  dni: 'DNI',
  denominacion: 'Denominación',
  domicilio: 'Domicilio',
  socios: 'Socios',
  administradores: 'Administradores',
}

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null)

export default async function AdminLeadsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.rol !== 'ADMIN') redirect('/dashboard')

  const ahora = new Date()

  // Dos fuentes, una sola lista:
  // · formularios empezados y nunca enviados (viven en Tramite, campos lead*);
  // · consultas sin trámite: formulario de contacto, chat, registros sin
  //   trámite y los cargados a mano (viven en Lead).
  // Se incluyen también los ganados, para que la conversión se vea.
  const [borradores, consultas] = await Promise.all([
    prisma.tramite.findMany({
      where: { formularioCompleto: false },
      include: {
        user: { select: { name: true, email: true, phone: true, partnerId: true } },
        leadSeguimientos: {
          include: { admin: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.lead.findMany({
      // Los que ya tienen un trámite empezado aparecen por el borrador:
      // mostrarlos dos veces sería trabajar dos veces a la misma persona.
      where: { OR: [{ userId: null }, { user: { tramites: { none: {} } } }] },
      include: {
        partner: { select: { nombre: true } },
        contactos: {
          include: { admin: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const desdeBorradores: LeadCRM[] = borradores.map((t) => {
    const datos = leerDatosUsuario(t.datosUsuario)
    const telefono = datos.telefono || t.user.phone || null
    const email = datos.email || t.user.email
    const nombre = `${datos.nombre || ''} ${datos.apellido || ''}`.trim() || t.user.name || email || 'Sin nombre'
    const segmento = segmentoDe(t)
    const hitos = hitosCumplidos(t)
    const { puntaje, senales } = calcularPrioridad(
      { ...t, ultimaActividad: t.updatedAt, telefono, vienePorPartner: !!t.user.partnerId },
      ahora,
    )

    return {
      id: t.id,
      tipo: 'BORRADOR',
      nombre,
      email,
      telefono,
      estado: t.leadEstado,
      motivoPerdida: t.leadMotivoPerdida,
      motivoNota: t.leadMotivoNota,
      ultimoContacto: iso(t.leadUltimoContacto),
      proximoContacto: iso(t.leadProximoContacto),
      creado: t.createdAt.toISOString(),
      ultimaActividad: t.updatedAt.toISOString(),
      puntaje,
      franja: franjaDe(puntaje),
      senales,
      origenTexto: 'Formulario sin terminar',
      denominacion: t.denominacionSocial1 === 'Pendiente de definir' ? null : t.denominacionSocial1,
      jurisdiccion: t.jurisdiccion,
      plan: t.plan,
      avance: calcularAvance(t),
      segmento,
      segmentoTexto: SEGMENTO_TEXTO[segmento],
      hitos: HITOS.map((h) => ({ texto: HITO_TEXTO[h], ok: hitos[h] })),
      toques: { enviados: t.leadToquesEnviados, total: TOQUES.length, ultimo: iso(t.leadUltimoToque) },
      mensaje: null,
      partner: null,
      actividad: t.leadSeguimientos.map((s) => ({
        id: s.id,
        canal: s.canal,
        nota: s.nota,
        admin: s.admin.name ?? 'Admin',
        fecha: s.createdAt.toISOString(),
      })),
    }
  })

  const desdeConsultas: LeadCRM[] = consultas.map((l) => {
    const { puntaje, senales } = puntajeConsulta(l, ahora)
    return {
      id: l.id,
      tipo: 'CONSULTA',
      nombre: l.nombre?.trim() || l.email || l.telefono || 'Sin nombre',
      email: l.email,
      telefono: l.telefono,
      estado: l.estado,
      motivoPerdida: l.motivoPerdida,
      motivoNota: l.motivoNota,
      ultimoContacto: iso(l.ultimoContacto),
      proximoContacto: iso(l.proximoContacto),
      creado: l.createdAt.toISOString(),
      ultimaActividad: l.updatedAt.toISOString(),
      puntaje,
      franja: franjaDe(puntaje),
      senales,
      origenTexto: ORIGEN_TEXTO[l.origen] || l.origen,
      denominacion: null,
      jurisdiccion: null,
      plan: null,
      avance: null,
      segmento: null,
      segmentoTexto: null,
      hitos: null,
      toques: null,
      mensaje: l.mensaje,
      partner: l.partner?.nombre ?? null,
      actividad: l.contactos.map((c) => ({
        id: c.id,
        canal: c.canal,
        nota: c.nota,
        admin: c.admin.name ?? 'Admin',
        fecha: c.createdAt.toISOString(),
      })),
    }
  })

  return <LeadsCRM leads={[...desdeBorradores, ...desdeConsultas]} />
}
