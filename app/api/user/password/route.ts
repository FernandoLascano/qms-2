import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { rateLimit } from '@/lib/rate-limit'
import { validarPassword } from '@/lib/validaciones'

// PUT - Cambiar contraseña
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // La contraseña actual también se puede adivinar desde acá: mismo límite
    // por usuario que el login.
    const rateLimitResponse = await rateLimit(request, 'password-change', 5, '15 m', session.user.id)
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const { currentPassword, newPassword } = body

    // Obtener usuario con contraseña
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    if (user.password) {
      if (!currentPassword || typeof currentPassword !== 'string') {
        return NextResponse.json(
          { error: 'Contraseña actual requerida' },
          { status: 400 }
        )
      }
      const isValidPassword = await bcrypt.compare(currentPassword, user.password)
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Contraseña actual incorrecta' },
          { status: 400 }
        )
      }
    }

    // Mismas reglas que el registro (mínimo y máximo)
    const errorPassword = validarPassword(newPassword)
    if (errorPassword) {
      return NextResponse.json(
        { error: errorPassword.replace('La contraseña', 'La nueva contraseña') },
        { status: 400 }
      )
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword }
    })

    return NextResponse.json({ message: 'Contraseña actualizada correctamente' })
  } catch {
    return NextResponse.json(
      { error: 'Error al cambiar contraseña' },
      { status: 500 }
    )
  }
}
