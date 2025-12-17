import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { enviarEmailBienvenida } from "@/lib/emails/send"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name, phone } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      )
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 400 }
      )
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone: phone || null,
        rol: "CLIENTE"
      }
    })

    // Enviar email de bienvenida (no fallar si hay error)
    try {
      await enviarEmailBienvenida(user.email, user.name)
    } catch (emailError) {
      console.error("Error al enviar email de bienvenida (no crítico):", emailError)
      // No fallar el registro si el email falla
    }

    return NextResponse.json(
      { 
        message: "Usuario creado exitosamente",
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error en registro:", error)
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      stack: error?.stack
    })
    return NextResponse.json(
      { 
        error: "Error al crear usuario",
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}