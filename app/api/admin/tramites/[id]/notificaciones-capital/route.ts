import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id: tramiteId } = await params

    const notificaciones = await prisma.notificacion.findMany({
      where: {
        tramiteId,
        titulo: {
          contains: 'Depósito del 25%'
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        createdAt: true,
        metadata: true
      }
    })

    return NextResponse.json(notificaciones)
  } catch (error) {
    console.error('Error al obtener historial de capital:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

