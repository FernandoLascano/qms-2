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

    // Agregar información adicional de cada usuario
    const usuariosConInfo = await Promise.all(
      usuarios.map(async (user) => {
        // Obtener el último trámite del usuario
        const ultimoTramite = await prisma.tramite.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          select: {
            denominacionSocial1: true,
            estadoGeneral: true,
            createdAt: true
          }
        })

        return {
          ...user,
          ultimoTramite
        }
      })
    )

    return NextResponse.json(usuariosConInfo)

  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    )
  }
}
