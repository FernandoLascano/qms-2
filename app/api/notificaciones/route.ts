import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const tipo = searchParams.get('tipo')
    const leida = searchParams.get('leida')

    // Construir filtros
    const where: any = {
      userId: session.user.id
    }

    if (tipo && tipo !== 'TODOS') {
      where.tipo = tipo
    }

    if (leida === 'true') {
      where.leida = true
    } else if (leida === 'false') {
      where.leida = false
    }

    // Obtener todas las notificaciones
    const notificaciones = await prisma.notificacion.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        tipo: true,
        titulo: true,
        mensaje: true,
        link: true,
        leida: true,
        createdAt: true,
        tramiteId: true
      }
    })

    // Contar notificaciones no leídas
    const count = await prisma.notificacion.count({
      where: {
        userId: session.user.id,
        leida: false
      }
    })

    return NextResponse.json({
      notificaciones,
      count
    })
  } catch (error) {
    console.error('Error al obtener notificaciones:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
