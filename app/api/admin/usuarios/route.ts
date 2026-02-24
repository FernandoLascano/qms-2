import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Listar todos los usuarios
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const usuarios = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        rol: true,
        createdAt: true,
        _count: {
          select: {
            tramites: true
          }
        }
      }
    })

    // Obtener último trámite de cada usuario en UNA sola query (evita N+1)
    const userIds = usuarios.map(u => u.id)
    const ultimosTramites = await prisma.tramite.findMany({
      where: { userId: { in: userIds } },
      orderBy: { createdAt: 'desc' },
      distinct: ['userId'],
      select: {
        userId: true,
        denominacionSocial1: true,
        estadoGeneral: true,
        createdAt: true
      }
    })

    const tramiteMap = new Map(ultimosTramites.map(t => [t.userId, t]))

    const usuariosConInfo = usuarios.map(user => ({
      ...user,
      ultimoTramite: tramiteMap.get(user.id) || null
    }))

    return NextResponse.json(usuariosConInfo)

  } catch {
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    )
  }
}
