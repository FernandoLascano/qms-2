import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Polling ligero (reemplaza SSE para menor uso de Fluid CPU/memoria). */
export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const notificaciones = await prisma.notificacion.findMany({
      where: {
        userId,
        leida: false,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        tramite: {
          select: {
            id: true,
            denominacionAprobada: true,
            denominacionSocial1: true,
          },
        },
      },
    })

    const notifications = notificaciones.map((notif) => ({
      id: notif.id,
      tipo: notif.tipo,
      titulo: notif.titulo,
      mensaje: notif.mensaje,
      link: notif.link,
      leida: notif.leida,
      createdAt: notif.createdAt,
      tramiteId: notif.tramiteId,
      tramite: notif.tramite
        ? {
            denominacion:
              notif.tramite.denominacionAprobada ||
              notif.tramite.denominacionSocial1 ||
              'Trámite',
          }
        : null,
    }))

    const count = await prisma.notificacion.count({
      where: { userId, leida: false },
    })

    return NextResponse.json({
      type: 'notifications' as const,
      count,
      notifications,
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'Error al consultar notificaciones' }, { status: 500 })
  }
}
