import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { enviarEmailNotificacion } from '@/lib/emails/send'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const { denominacion } = await request.json()

    // Obtener el trámite actual para verificar si es una denominación alternativa
    const tramiteActual = await prisma.tramite.findUnique({
      where: { id },
      select: { denominacionSocial1: true, denominacionSocial2: true, denominacionSocial3: true }
    })

    // Si la denominación no es ninguna de las 3 originales, es una alternativa
    // En ese caso también actualizamos denominacionSocial1 para que se muestre el nombre final
    const esAlternativa = tramiteActual &&
      denominacion !== tramiteActual.denominacionSocial1 &&
      denominacion !== tramiteActual.denominacionSocial2 &&
      denominacion !== tramiteActual.denominacionSocial3

    // Actualizar denominación aprobada (y denominacionSocial1 si es alternativa)
    const tramite = await prisma.tramite.update({
      where: { id },
      data: {
        denominacionAprobada: denominacion,
        // Si es alternativa, actualizar también denominacionSocial1 para mostrar el nombre final
        ...(esAlternativa && { denominacionSocial1: denominacion })
      }
    })

    // Notificar al usuario
    await prisma.notificacion.create({
      data: {
        userId: tramite.userId,
        tramiteId: id,
        tipo: 'INFO',
        titulo: 'Denominación Sugerida',
        mensaje: `Después del examen de homonimia, sugerimos utilizar: "${denominacion}". Te contactaremos para coordinar el pago de la tasa de reserva.`,
        link: `/dashboard/tramites/${id}`
      }
    })

    // Enviar email al usuario
    const usuario = await prisma.user.findUnique({
      where: { id: tramite.userId }
    })
    if (usuario) {
      try {
        await enviarEmailNotificacion(
          usuario.email,
          usuario.name || 'Usuario',
          'Denominación Sugerida para tu Sociedad',
          `Después de realizar el examen de homonimia, sugerimos utilizar la denominación: "${denominacion}" para tu sociedad. Te contactaremos para coordinar el pago de la tasa de reserva de nombre.`,
          id
        )
      } catch {
        // Error al enviar email de denominación sugerida (no crítico)
      }
    }

    return NextResponse.json({ success: true })

  } catch {
    return NextResponse.json(
      { error: 'Error al aprobar denominación' },
      { status: 500 }
    )
  }
}

