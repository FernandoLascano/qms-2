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

    // Las últimas 200 con información del trámite (la lista crecía sin tope), y en
    // paralelo el contador de no leídas.
    const [notificaciones, count] = await Promise.all([
      prisma.notificacion.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: 200,
      include: {
        tramite: {
          select: {
            id: true,
            denominacionAprobada: true,
            denominacionSocial1: true
          }
        }
      }
      }),
      prisma.notificacion.count({ where: { userId: session.user.id, leida: false } }),
    ])

    // Formatear notificaciones con información del trámite
    const notificacionesFormateadas = notificaciones.map(notif => ({
      id: notif.id,
      tipo: notif.tipo,
      titulo: notif.titulo,
      mensaje: notif.mensaje,
      link: notif.link,
      leida: notif.leida,
      createdAt: notif.createdAt,
      tramiteId: notif.tramiteId,
      tramite: notif.tramite ? {
        denominacion: notif.tramite.denominacionAprobada || notif.tramite.denominacionSocial1 || 'Trámite'
      } : null
    }))

    return NextResponse.json({
      notificaciones: notificacionesFormateadas,
      count
    })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
