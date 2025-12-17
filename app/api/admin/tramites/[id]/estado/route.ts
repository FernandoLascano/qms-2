import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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
    const { estado } = await request.json()

    // Actualizar estado
    const tramite = await prisma.tramite.update({
      where: { id },
      data: {
        estadoGeneral: estado
      }
    })

    // Crear registro en historial
    await prisma.historialEstado.create({
      data: {
        tramiteId: id,
        estadoAnterior: tramite.estadoGeneral,
        estadoNuevo: estado,
        descripcion: `Estado cambiado por administrador`
      }
    })

    // Notificar al usuario
    await prisma.notificacion.create({
      data: {
        userId: tramite.userId,
        tramiteId: id,
        tipo: 'INFO',
        titulo: 'Estado del trámite actualizado',
        mensaje: `El estado de tu trámite ha sido actualizado a: ${estado}`
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error al actualizar estado:', error)
    return NextResponse.json(
      { error: 'Error al actualizar estado' },
      { status: 500 }
    )
  }
}

