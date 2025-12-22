import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

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

    // Verificar contraseña actual
    const isValidPassword = await bcrypt.compare(currentPassword, user.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Contraseña actual incorrecta' },
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
  } catch (error: any) {
    console.error('Error al cambiar contraseña:', error)
    return NextResponse.json(
      { error: 'Error al cambiar contraseña', detalles: error.message },
      { status: 500 }
    )
  }
}
