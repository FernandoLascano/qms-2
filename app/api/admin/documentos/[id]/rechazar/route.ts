import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { enviarEmailDocumentoRechazado } from '@/lib/emails/send'

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
    const { observaciones } = await request.json()

    // Actualizar documento
    const documento = await prisma.documento.update({
      where: { id },
      data: {
        estado: 'RECHAZADO',
        observaciones: observaciones
      }
    })

    // Notificar al usuario
    await prisma.notificacion.create({
      data: {
        userId: documento.userId,
        tramiteId: documento.tramiteId,
        tipo: 'ALERTA',
        titulo: 'Documento rechazado',
        mensaje: `Tu documento "${documento.nombre}" ha sido rechazado. Motivo: ${observaciones}`,
        link: `/dashboard/tramites/${documento.tramiteId}`
      }
    })

    // Enviar email al usuario
    const usuario = await prisma.user.findUnique({
      where: { id: documento.userId }
    })

    if (usuario) {
      try {
        await enviarEmailDocumentoRechazado(
          usuario.email,
          usuario.name,
          documento.nombre,
          observaciones,
          documento.tramiteId
        )
      } catch (emailError) {
        console.error("Error al enviar email de documento rechazado (no crítico):", emailError)
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error al rechazar documento:', error)
    return NextResponse.json(
      { error: 'Error al rechazar documento' },
      { status: 500 }
    )
  }
}

