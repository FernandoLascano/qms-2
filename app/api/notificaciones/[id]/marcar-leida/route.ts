import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Verificar que la notificación pertenece al usuario
    const notificacion = await prisma.notificacion.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!notificacion) {
      return NextResponse.json({ error: 'Notificación no encontrada' }, { status: 404 })
    }

    // Marcar como leída
    await prisma.notificacion.update({
      where: { id },
      data: { leida: true }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
