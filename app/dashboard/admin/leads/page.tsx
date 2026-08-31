import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import LeadsLista from '@/components/admin/LeadsLista'
import {
  calcularAvance,
  leerDatosUsuario,
  segmentoDe,
  SEGMENTO_TEXTO,
} from '@/lib/leads/avance'
import { calcularPrioridad, franjaDe } from '@/lib/leads/prioridad'
import { mensajeWhatsapp } from '@/lib/leads/mensajes'
import { ORIGEN_TEXTO, puntajeConsulta, mensajeConsulta } from '@/lib/leads/consultas'

async function AdminLeadsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.rol !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Leads = formularios empezados y nunca enviados.
  //
  // Antes esta consulta excluía a quien ya tuviera un trámite enviado, y por eso
  // un lead desaparecía en el momento exacto en que convertía: nunca se podía
  // ver ni medir una conversión. Ahora entran todos y el ganado se marca con
  // `leadEstado`, así que la pantalla puede mostrar el resultado del trabajo y
  // no sólo lo que falta hacer.
  const borradores = await prisma.tramite.findMany({
    where: { formularioCompleto: false },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
          partnerId: true,
        },
      },
      leadSeguimientos: {
        include: { admin: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  // La otra mitad: consultas que todavía no son un trámite —formulario de
  // contacto, chat, registros que nunca abrieron nada—. Viven en `Lead` y hasta
  // ahora no aparecían en ninguna parte del panel.
  const consultas = await prisma.lead.findMany({
    where: { userId: null },
    include: {
      partner: { select: { nombre: true } },
      contactos: {
        include: { admin: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Los que ya tienen cuenta se muestran igual, salvo que además tengan un
  // borrador: en ese caso ya están en la lista de arriba y duplicarlos sería
  // trabajar dos veces a la misma persona.
  const conCuenta = await prisma.lead.findMany({
    where: {
      userId: { not: null },
      user: { tramites: { none: {} } },
    },
    include: {
      partner: { select: { nombre: true } },
      contactos: {
        include: { admin: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const ahora = new Date()

  const leads = borradores.map((tramite) => {
    const datosUsuario = leerDatosUsuario(tramite.datosUsuario)
    const nombre =
      `${datosUsuario.nombre || ''} ${datosUsuario.apellido || ''}`.trim() ||
      tramite.user.name ||
      ''
    const telefono = datosUsuario.telefono || tramite.user.phone || null
    const segmento = segmentoDe(tramite)

    const { puntaje, senales } = calcularPrioridad(
      {
        ...tramite,
        ultimaActividad: tramite.updatedAt,
        telefono,
        vienePorPartner: !!tramite.user.partnerId,
      },
      ahora,
    )

    return {
      id: tramite.id,
      tipo: 'BORRADOR' as const,
      denominacion:
        tramite.denominacionSocial1 === 'Pendiente de definir'
          ? null
          : tramite.denominacionSocial1,
      nombre,
      email: datosUsuario.email || tramite.user.email,
      telefono,
      jurisdiccion: tramite.jurisdiccion,
      plan: tramite.plan,
      avance: calcularAvance(tramite),
      segmento,
      segmentoTexto: SEGMENTO_TEXTO[segmento],
      puntaje,
      franja: franjaDe(puntaje),
      senales,
      mensaje: null,
      partner: null,
      mensajeSugerido: mensajeWhatsapp(segmento, nombre),
      creado: tramite.createdAt.toISOString(),
      ultimaActividad: tramite.updatedAt.toISOString(),
      leadEstado: tramite.leadEstado,
      leadMotivoPerdida: tramite.leadMotivoPerdida,
      leadUltimoContacto: tramite.leadUltimoContacto?.toISOString() || null,
      leadProximoContacto: tramite.leadProximoContacto?.toISOString() || null,
      leadToquesEnviados: tramite.leadToquesEnviados,
      seguimientos: tramite.leadSeguimientos.map((s) => ({
        id: s.id,
        canal: s.canal,
        nota: s.nota,
        admin: s.admin.name,
        createdAt: s.createdAt.toISOString(),
      })),
    }
  })

  const leadsConsulta = [...consultas, ...conCuenta].map((lead) => {
    const { puntaje, senales } = puntajeConsulta(lead, ahora)
    return {
    id: lead.id,
    tipo: 'CONSULTA' as const,
    denominacion: null,
    nombre: lead.nombre || '',
    email: lead.email,
    telefono: lead.telefono,
    jurisdiccion: '',
    plan: '',
    avance: null,
    segmento: lead.origen,
    segmentoTexto: ORIGEN_TEXTO[lead.origen] || lead.origen,
    puntaje,
    franja: franjaDe(puntaje),
    senales,
    mensaje: lead.mensaje,
    partner: lead.partner?.nombre || null,
    mensajeSugerido: mensajeConsulta(lead.nombre || ''),
    creado: lead.createdAt.toISOString(),
    ultimaActividad: lead.updatedAt.toISOString(),
    leadEstado: lead.estado,
    leadMotivoPerdida: lead.motivoPerdida,
    leadUltimoContacto: lead.ultimoContacto?.toISOString() || null,
    leadProximoContacto: lead.proximoContacto?.toISOString() || null,
    leadToquesEnviados: 0,
    seguimientos: lead.contactos.map((c) => ({
      id: c.id,
      canal: c.canal,
      nota: c.nota,
      admin: c.admin.name,
      createdAt: c.createdAt.toISOString(),
    })),
    }
  })

  const todos = [...leads, ...leadsConsulta]

  return (
    <div className="space-y-section">
      <PageHeader
        title="Leads"
        description="Formularios sin terminar y consultas sin trámite, en una sola lista ordenada por prioridad"
        actions={
          <Button asChild variant="secondary">
            <Link href="/dashboard/admin/tramites">Ver trámites</Link>
          </Button>
        }
      />
      <LeadsLista leads={todos} />
    </div>
  )
}

export default AdminLeadsPage
