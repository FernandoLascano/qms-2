import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { enviarEmailBienvenida } from "@/lib/emails/send"

export async function POST(request: Request) {
  try {
    // Verificar que DATABASE_URL esté configurada
    if (!process.env.DATABASE_URL) {
      console.error("❌ DATABASE_URL no está configurada")
      return NextResponse.json(
        { error: "Error de configuración del servidor" },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { email, password, name, phone } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      )
    }

    console.log("📝 Intentando crear usuario:", { email, name })

    // Verificar si el usuario ya existe
    let existingUser
    try {
      existingUser = await prisma.user.findUnique({
        where: { email }
      })
    } catch (dbError: any) {
      console.error("❌ Error al verificar usuario existente:", dbError)
      return NextResponse.json(
        { 
          error: "Error de conexión a la base de datos",
          details: process.env.NODE_ENV === 'development' ? dbError?.message : undefined
        },
        { status: 500 }
      )
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 400 }
      )
    }

    // Encriptar contraseña
    console.log("🔐 Encriptando contraseña...")
    let hashedPassword
    try {
      hashedPassword = await bcrypt.hash(password, 10)
    } catch (bcryptError: any) {
      console.error("❌ Error al encriptar contraseña:", bcryptError)
      return NextResponse.json(
        { 
          error: "Error al procesar la contraseña",
          details: process.env.NODE_ENV === 'development' ? bcryptError?.message : undefined
        },
        { status: 500 }
      )
    }

    // Crear usuario
    console.log("👤 Creando usuario en la base de datos...")
    let user
    try {
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phone: phone || null,
          rol: "CLIENTE"
        }
      })
      console.log("✅ Usuario creado exitosamente:", user.id)
    } catch (createError: any) {
      console.error("❌ Error al crear usuario en la base de datos:", createError)
      console.error("Error code:", createError?.code)
      console.error("Error meta:", createError?.meta)
      return NextResponse.json(
        { 
          error: "Error al crear usuario en la base de datos",
          details: process.env.NODE_ENV === 'development' ? createError?.message : undefined
        },
        { status: 500 }
      )
    }

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
    console.error("❌ Error general en registro:", error)
    console.error("Error type:", typeof error)
    console.error("Error name:", error?.name)
    console.error("Error message:", error?.message)
    console.error("Error code:", error?.code)
    console.error("Error stack:", error?.stack)
    
    // Si es un error de Prisma, dar más detalles
    if (error?.code) {
      console.error("Prisma error code:", error.code)
      if (error.code === 'P1001') {
        return NextResponse.json(
          { error: "No se puede conectar a la base de datos. Verifica DATABASE_URL." },
          { status: 500 }
        )
      }
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: "El email ya está registrado" },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { 
        error: "Error al crear usuario",
        details: process.env.NODE_ENV === 'development' ? error?.message : "Verifica los logs del servidor"
      },
      { status: 500 }
    )
  }
}