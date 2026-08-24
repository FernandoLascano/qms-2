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

  return (
    <div className="space-y-section">
      <PageHeader
        title="Leads"
        description="Formularios empezados y nunca enviados, ordenados por prioridad"
        actions={
          <Button asChild variant="secondary">
            <Link href="/dashboard/admin/tramites">Ver trámites</Link>
          </Button>
        }
      />
      <LeadsLista leads={leads} />
    </div>
  )
}

export default AdminLeadsPage
