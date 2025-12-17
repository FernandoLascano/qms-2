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

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const { mensaje } = await request.json()

    // Obtener el trámite para saber a quién notificar
    const tramite = await prisma.tramite.findUnique({
      where: { id }
    })

    if (!tramite) {
      return NextResponse.json(
        { error: 'Trámite no encontrado' },
        { status: 404 }
      )
    }

    // Crear notificación para el usuario
    await prisma.notificacion.create({
      data: {
        userId: tramite.userId,
        tramiteId: id,
        tipo: 'ACCION_REQUERIDA',
        titulo: 'Nueva observación del administrador',
        mensaje: mensaje
      }
    })

    // Enviar email al usuario
    const usuario = await prisma.user.findUnique({
      where: { id: tramite.userId }
    })

    if (usuario) {
      await enviarEmailNotificacion(
        usuario.email,
        usuario.name,
        'Nuevo mensaje del equipo',
        mensaje,
        id
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error al enviar observación:', error)
    return NextResponse.json(
      { error: 'Error al enviar observación' },
      { status: 500 }
    )
  }
}

