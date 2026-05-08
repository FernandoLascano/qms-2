import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { adminUsuarioPatchSchema } from '@/lib/schemas/admin-user'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET - Obtener detalle de un usuario
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params

    const usuario = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        rol: true,
        partnerId: true,
        referredAt: true,
        referralSource: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        tramites: {
          select: {
            id: true,
            denominacionSocial1: true,
            estadoGeneral: true,
            createdAt: true,
            sociedadInscripta: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            tramites: true,
            documentos: true,
            pagos: true,
            notificaciones: true,
            mensajes: true,
          },
        },
      },
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(usuario)

  } catch {
    return NextResponse.json(
      { error: 'Error al obtener usuario' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar usuario y todos sus datos
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verificar que el usuario existe
    const usuario = await prisma.user.findUnique({
      where: { id },
      include: {
        tramites: {
          select: { id: true }
        }
      }
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // No permitir eliminar admins
    if (usuario.rol === 'ADMIN') {
      return NextResponse.json(
        { error: 'No se puede eliminar un administrador' },
        { status: 400 }
      )
    }

    // No permitir eliminarse a sí mismo
    if (usuario.id === session.user.id) {
      return NextResponse.json(
        { error: 'No puedes eliminarte a ti mismo' },
        { status: 400 }
      )
    }

    // Eliminar datos relacionados de cada trámite
    for (const tramite of usuario.tramites) {
      await prisma.evento.deleteMany({ where: { tramiteId: tramite.id } })
      await prisma.cuentaBancaria.deleteMany({ where: { tramiteId: tramite.id } })
      await prisma.enlacePago.deleteMany({ where: { tramiteId: tramite.id } })
      await prisma.pago.deleteMany({ where: { tramiteId: tramite.id } })
      await prisma.documento.deleteMany({ where: { tramiteId: tramite.id } })
      await prisma.notificacion.deleteMany({ where: { tramiteId: tramite.id } })
      await prisma.mensaje.deleteMany({ where: { tramiteId: tramite.id } })
    }

    // Eliminar trámites
    await prisma.tramite.deleteMany({ where: { userId: id } })

    // Eliminar datos directos del usuario
    await prisma.documento.deleteMany({ where: { userId: id } })
    await prisma.pago.deleteMany({ where: { userId: id } })
    await prisma.notificacion.deleteMany({ where: { userId: id } })
    await prisma.mensaje.deleteMany({ where: { userId: id } })

    // Eliminar el usuario
    await prisma.user.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: `Usuario ${usuario.email} eliminado exitosamente`
    })

  } catch {
    return NextResponse.json(
      { error: 'Error al eliminar usuario' },
      { status: 500 }
    )
  }
}

// PATCH - Actualizar usuario (cambiar rol, blanquear contraseña)
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const raw = await request.json()
    const parsed = adminUsuarioPatchSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const body = parsed.data

    const usuario = await prisma.user.findUnique({
      where: { id }
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Acción: Blanquear contraseña
    if (body.action === 'reset_password') {
      const newPassword = body.newPassword

      const bcrypt = await import('bcryptjs')
      const hashedPassword = await bcrypt.hash(newPassword, 10)

      await prisma.user.update({
        where: { id },
        data: { password: hashedPassword }
      })

      return NextResponse.json({
        success: true,
        message: `Contraseña de ${usuario.email} actualizada exitosamente`
      })
    }

    // Acción: Cambiar rol
    if (body.action === 'change_rol') {
      const newRol = body.newRol

      // No permitir cambiar el rol de uno mismo
      if (id === session.user.id) {
        return NextResponse.json(
          { error: 'No puedes cambiar tu propio rol' },
          { status: 400 }
        )
      }

      await prisma.user.update({
        where: { id },
        data: { rol: newRol }
      })

      return NextResponse.json({
        success: true,
        message: `Rol de ${usuario.email} cambiado a ${newRol}`
      })
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    )

  } catch {
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    )
  }
}
