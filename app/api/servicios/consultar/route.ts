import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { enviarEmailNotificacion } from '@/lib/emails/send'

// POST - El cliente manifiesta interés en un servicio adicional. Avisa al equipo.
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { servicio } = await request.json()
    if (!servicio || typeof servicio !== 'string') {
      return NextResponse.json({ error: 'Servicio no válido' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true }
    })
    const quien = user?.name || user?.email || 'Un cliente'

    const admins = await prisma.user.findMany({ where: { rol: 'ADMIN' }, select: { id: true, email: true, name: true } })
    const titulo = `Consulta de servicio: ${servicio}`
    const mensaje = `${quien} manifestó interés en el servicio "${servicio}". Contactalo para avanzar.`

    if (admins.length > 0) {
      try {
        await prisma.notificacion.createMany({
          data: admins.map((a) => ({
            userId: a.id,
            tipo: 'INFO' as const,
            titulo,
            mensaje,
            link: '/dashboard/admin/usuarios'
          }))
        })
      } catch {
        // Notificación interna no crítica
      }

      await Promise.allSettled(
        admins
          .filter((a) => a.email)
          .map((a) => enviarEmailNotificacion(a.email, a.name || 'Equipo', titulo, mensaje))
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'No se pudo registrar la consulta' }, { status: 500 })
  }
}
