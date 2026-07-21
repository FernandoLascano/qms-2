import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { enviarEmailNotificacion } from '@/lib/emails/send'

export const dynamic = 'force-dynamic'
export const maxDuration = 10 // Timeout de 10 segundos máximo

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

    // Verificar acceso según el rol del USUARIO de la sesión (no del dueño del
    // trámite): admin accede a cualquiera; el cliente solo a los suyos.
    const esAdmin = session.user.rol === 'ADMIN'
    const tramite = await prisma.tramite.findFirst({
      where: esAdmin ? { id } : { id, userId: session.user.id },
      select: { id: true },
    })

    if (!tramite) {
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
  } catch {
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

    // Verificar acceso según el rol del USUARIO de la sesión: admin accede a
    // cualquier trámite; el cliente solo a los suyos.
    const esAdminSesion = session.user.rol === 'ADMIN'
    const tramite = await prisma.tramite.findFirst({
      where: esAdminSesion ? { id } : { id, userId: session.user.id },
      select: { userId: true, denominacionSocial1: true },
    })

    if (!tramite) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const tramiteForNotify = tramite

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

    const esAdmin = session.user.rol === 'ADMIN'
    const textoCorto = contenido.trim().substring(0, 150)

    if (esAdmin && tramiteForNotify) {
      await prisma.notificacion.create({
        data: {
          tipo: 'MENSAJE',
          titulo: 'Nuevo mensaje del equipo',
          mensaje: textoCorto,
          userId: tramiteForNotify.userId,
          tramiteId: id,
          leida: false,
          link: `/dashboard/tramites/${id}`,
        },
      })
    } else if (!esAdmin && tramiteForNotify) {
      const admins = await prisma.user.findMany({
        where: { rol: 'ADMIN' },
        select: { id: true, email: true, name: true },
      })
      const denom = tramiteForNotify.denominacionSocial1?.trim() || 'Trámite'
      const titulo =
        denom.length > 56 ? `Chat trámite: ${denom.slice(0, 53)}…` : `Chat trámite: ${denom}`
      const nombre = session.user?.name?.trim() || 'Cliente'
      const mensajeAviso = `${nombre}: ${textoCorto}`
      await Promise.all(
        admins.map(async (admin) => {
          await prisma.notificacion.create({
            data: {
              tipo: 'MENSAJE',
              titulo,
              mensaje: mensajeAviso,
              userId: admin.id,
              tramiteId: id,
              leida: false,
              link: `/dashboard/admin/tramites/${id}`,
            },
          })

          // Enviar email al admin
          if (admin.email) {
            try {
              await enviarEmailNotificacion(
                admin.email,
                admin.name || 'Administrador',
                titulo,
                mensajeAviso,
                id
              )
            } catch {
              // Email no crítico
            }
          }
        }),
      )
    }

    return NextResponse.json(mensaje)
  } catch {
    return NextResponse.json(
      { error: 'Error al crear mensaje' },
      { status: 500 }
    )
  }
}

