import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { enviarEmailNotificacion } from '@/lib/emails/send'
import { enSegundoPlano } from '@/lib/en-segundo-plano'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verificar PRIMERO que el usuario sea dueño del trámite (o admin)
    // antes de modificar nada. De lo contrario cualquier usuario podría
    // vencer enlaces ajenos iterando ids.
    const enlaceExistente = await prisma.enlacePago.findUnique({
      where: { id },
      include: { tramite: { select: { userId: true } } },
    })

    if (!enlaceExistente || !enlaceExistente.tramite) {
      return NextResponse.json({ error: 'Enlace no encontrado' }, { status: 404 })
    }

    const esAdmin = session.user.rol === 'ADMIN'
    if (!esAdmin && enlaceExistente.tramite.userId !== session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Actualizar enlace
    const enlace = await prisma.enlacePago.update({
      where: { id },
      data: {
        reportadoVencido: true,
        estado: 'VENCIDO'
      }
    })

    // Notificar a los admins (buscar usuarios admin)
    const admins = await prisma.user.findMany({
      where: { rol: 'ADMIN' },
      select: { id: true, email: true, name: true }
    })

    const mensajeAviso = `El cliente reportó que el enlace de ${enlace.concepto} está vencido. Genera y envía uno nuevo.`

    // Una sola consulta para todos los admins, en vez de una por admin.
    await prisma.notificacion.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        tramiteId: enlace.tramiteId,
        tipo: 'ALERTA' as const,
        titulo: '⚠️ Enlace de Pago Reportado como Vencido',
        mensaje: mensajeAviso,
        link: `/dashboard/admin/tramites/${enlace.tramiteId}?tab=pagos`
      }))
    })

    for (const admin of admins) {

      // Enviar email al admin
      if (admin.email) {
        try {
          enSegundoPlano('enlaces-pago/[id]/reportar-vencido', () => enviarEmailNotificacion(
            admin.email,
            admin.name || 'Administrador',
            '⚠️ Enlace de Pago Reportado como Vencido',
            mensajeAviso,
            enlace.tramiteId,
            { paraAdmin: true, tono: 'aviso', cta: { texto: 'Generar un enlace nuevo', tab: 'pagos' } }
          ))
        } catch {
          // Email no crítico
        }
      }
    }

    return NextResponse.json({ success: true })

  } catch {
    return NextResponse.json(
      { error: 'Error al reportar enlace vencido' },
      { status: 500 }
    )
  }
}

