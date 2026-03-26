import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { enviarEmailBienvenida } from "@/lib/emails/send"
import { rateLimit } from "@/lib/rate-limit"
import { verifyTurnstileToken } from "@/lib/turnstile"
import { buildEmailVerificationLink, createEmailVerificationToken } from "@/lib/email-verification"
import { enviarEmailVerificacionCuenta } from "@/lib/emails/send"

export async function POST(request: Request) {
  try {
    const rateLimitResponse = await rateLimit(request, 'auth', 5, '1 m')
    if (rateLimitResponse) return rateLimitResponse
    const body = await request.json()
    const { email, password, name, phone, turnstileToken, website } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      )
    }

    // Honeypot anti-bot: si viene con contenido, es spam.
    if (typeof website === 'string' && website.trim().length > 0) {
      return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 })
    }

    // Captcha (Cloudflare Turnstile) validado server-side
    const forwardedFor = request.headers.get('x-forwarded-for')
    const remoteip = forwardedFor ? forwardedFor.split(',')[0]?.trim() : null
    const turnstile = await verifyTurnstileToken({ token: turnstileToken, remoteip })
    if (!turnstile.ok) {
      return NextResponse.json(
        { error: "Anti-spam", details: turnstile.error, codes: turnstile.codes },
        { status: 400 }
      )
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
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
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        name,
        phone: phone || null,
        rol: "CLIENTE"
      }
    })

    // Verificación de email + bienvenida (no fallar si hay error)
    try {
      const { token } = await createEmailVerificationToken({ userId: user.id })
      const verifyUrl = buildEmailVerificationLink({ token })

      await Promise.allSettled([
        enviarEmailVerificacionCuenta({ email: user.email, nombre: user.name, verifyUrl }),
        enviarEmailBienvenida(user.email, user.name),
      ])
    } catch {
      // Error al enviar email de bienvenida (no crítico)
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
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Error al crear usuario. Intenta nuevamente." },
      { status: 500 }
    )
  }
}
