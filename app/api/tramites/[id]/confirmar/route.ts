import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// Acciones de autoservicio que el cliente puede confirmar por sí mismo.
// El admin también puede marcar estos pasos desde su panel (ver /etapas), sin bloquearse.
const ACCIONES: Record<string, { campo: string; fecha: string; tituloAdmin: string }> = {
  ciudadano_digital: {
    campo: 'ciudadanoDigitalOk',
    fecha: 'fechaCiudadanoDigitalOk',
    tituloAdmin: 'El cliente confirmó tener Ciudadano Digital Nivel 2'
  },
  aprobar_borrador: {
    campo: 'borradorAprobadoCliente',
    fecha: 'fechaBorradorAprobadoCliente',
    tituloAdmin: 'El cliente aprobó el borrador de los documentos'
  }
}

// PATCH - El cliente confirma un paso que depende de él
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params
    const { accion } = await request.json()

    const config = ACCIONES[accion]
    if (!config) {
      return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    }

    // Solo el dueño del trámite puede confirmar
    const tramite = await prisma.tramite.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!tramite) {
      return NextResponse.json({ error: 'Trámite no encontrado' }, { status: 404 })
    }

    await prisma.tramite.update({
      where: { id },
      data: {
        [config.campo]: true,
        [config.fecha]: new Date()
      }
    })

    // Avisar al equipo (notificación interna para admins)
    try {
      const admins = await prisma.user.findMany({ where: { rol: 'ADMIN' }, select: { id: true } })
      if (admins.length > 0) {
        await prisma.notificacion.createMany({
          data: admins.map((a) => ({
            userId: a.id,
            tramiteId: id,
            tipo: 'INFO' as const,
            titulo: config.tituloAdmin,
            mensaje: `Trámite ${tramite.denominacionSocial1}`,
            link: `/dashboard/admin/tramites/${id}`
          }))
        })
      }
    } catch {
      // Notificar a admins es best-effort, no crítico
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error al confirmar el paso' }, { status: 500 })
  }
}
