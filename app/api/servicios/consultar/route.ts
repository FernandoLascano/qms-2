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

    // El interés queda anotado en la cartera de su sociedad como oportunidad.
    // Antes sólo se mandaba un aviso y, una vez leído, no quedaba rastro de
    // quién quería qué. Best-effort: si falla, el aviso sale igual.
    let tramiteId: string | null = null
    let linkAdmin = '/dashboard/admin/usuarios'
    try {
      const [tramite, catalogo] = await Promise.all([
        prisma.tramite.findFirst({
          where: { userId: session.user.id, formularioCompleto: true },
          orderBy: [{ sociedadInscripta: 'desc' }, { updatedAt: 'desc' }],
          select: { id: true, sociedadInscripta: true },
        }),
        prisma.servicioCatalogo.findFirst({ where: { nombre: servicio }, select: { id: true, slug: true } }),
      ])
      tramiteId = tramite?.id ?? null
      if (tramite) {
        linkAdmin = tramite.sociedadInscripta
          ? `/dashboard/admin/sociedades/${tramite.id}`
          : `/dashboard/admin/tramites/${tramite.id}`
      }
      if (tramite && catalogo && catalogo.slug !== 'domicilio-sede') {
        const yaEsta = await prisma.servicioContratado.findFirst({
          where: { tramiteId: tramite.id, servicioId: catalogo.id, estado: { in: ['INTERESADO', 'ACTIVO'] } },
          select: { id: true },
        })
        if (!yaEsta) {
          await prisma.servicioContratado.create({
            data: { tramiteId: tramite.id, servicioId: catalogo.id, estado: 'INTERESADO', notas: 'Pidió info desde su panel.' },
          })
        }
      }
    } catch (error) {
      console.error('[servicios] no se pudo anotar el interés:', error)
    }

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
            tramiteId,
            link: linkAdmin
          }))
        })
      } catch {
        // Notificación interna no crítica
      }

      await Promise.allSettled(
        admins
          .filter((a) => a.email)
          .map((a) => enviarEmailNotificacion(a.email, a.name || 'Equipo', titulo, mensaje, undefined, { paraAdmin: true, tono: 'info' }))
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'No se pudo registrar la consulta' }, { status: 500 })
  }
}
