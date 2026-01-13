import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña requeridos' },
        { status: 400 }
      )
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json({
        found: false,
        message: 'Usuario no encontrado',
        email
      })
    }

    // Verificar si tiene contraseña
    if (!user.password) {
      return NextResponse.json({
        found: true,
        hasPassword: false,
        message: 'Usuario encontrado pero no tiene contraseña',
        userId: user.id,
        email: user.email
      })
    }

    // Comparar contraseña
    const isCorrect = await bcrypt.compare(password, user.password)

    return NextResponse.json({
      found: true,
      hasPassword: true,
      passwordCorrect: isCorrect,
      userId: user.id,
      email: user.email,
      name: user.name,
      rol: user.rol,
      passwordHashLength: user.password.length
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

