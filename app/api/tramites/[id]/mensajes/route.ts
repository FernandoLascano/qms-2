import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener todos los mensajes de un trámite
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Verificar que el usuario tenga acceso al trámite
    const tramite = await prisma.tramite.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id },
          { user: { rol: 'ADMIN' } }
        ]
      }
    })

    if (!tramite && session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const mensajes = await prisma.mensaje.findMany({
      where: { tramiteId: id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            rol: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(mensajes)
  } catch (error) {
    console.error('Error al obtener mensajes:', error)
    return NextResponse.json(
      { error: 'Error al obtener mensajes' },
      { status: 500 }
    )
  }
}

// POST - Crear un nuevo mensaje
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const { contenido } = await req.json()

    if (!contenido || contenido.trim().length === 0) {
      return NextResponse.json(
        { error: 'El mensaje no puede estar vacío' },
        { status: 400 }
      )
    }

    // Verificar que el usuario tenga acceso al trámite
    const tramite = await prisma.tramite.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id },
          { user: { rol: 'ADMIN' } }
        ]
      }
    })

    if (!tramite && session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const mensaje = await prisma.mensaje.create({
      data: {
        contenido: contenido.trim(),
        tramiteId: id,
        userId: session.user.id,
        esAdmin: session.user.rol === 'ADMIN',
        leido: false
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            rol: true
          }
        }
      }
    })

    // Crear notificación para el destinatario
    const esAdmin = session.user.rol === 'ADMIN'
    let destinatarioId: string | undefined = undefined
    if (esAdmin && tramite) {
      destinatarioId = tramite.userId
    }

    if (destinatarioId) {
      await prisma.notificacion.create({
        data: {
          tipo: 'MENSAJE',
          titulo: esAdmin ? 'Nuevo mensaje del equipo' : 'Nuevo mensaje del cliente',
          mensaje: contenido.substring(0, 100),
          userId: destinatarioId,
          tramiteId: id,
          leida: false,
          link: esAdmin ? `/dashboard/tramites/${id}` : `/dashboard/admin/tramites/${id}`
        }
      })
    }

    return NextResponse.json(mensaje)
  } catch (error) {
    console.error('Error al crear mensaje:', error)
    return NextResponse.json(
      { error: 'Error al crear mensaje' },
      { status: 500 }
    )
  }
}

