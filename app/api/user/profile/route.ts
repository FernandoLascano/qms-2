import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buildEmailVerificationLink, createEmailVerificationToken } from '@/lib/email-verification'
import { enviarEmailVerificacionCuenta } from '@/lib/emails/send'
import {
  normalizarEmail,
  validarEmailCuenta,
  validarNombreUsuario,
  validarTelefono,
} from '@/lib/validaciones'

// PUT - Actualizar perfil de usuario
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
    }

    // Mismas reglas que el registro: el email se guarda sin espacios y en
    // minúsculas (el login lo busca así), y el teléfono es opcional.
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = normalizarEmail(typeof body.email === 'string' ? body.email : '')
    const phone = typeof body.phone === 'string' && body.phone.trim() ? body.phone.trim() : null

    const errorValidacion =
      validarNombreUsuario(name) ||
      validarEmailCuenta(email) ||
      (phone ? validarTelefono(phone) : null)
    if (errorValidacion) {
      return NextResponse.json({ error: errorValidacion }, { status: 400 })
    }

    const actual = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    })
    if (!actual) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const cambiaEmail = normalizarEmail(actual.email) !== email

    // Verificar que el email no esté en uso por otro usuario (sin distinguir
    // mayúsculas, por si quedó alguno guardado de antes sin normalizar).
    if (cambiaEmail) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: { equals: email, mode: 'insensitive' },
          NOT: { id: session.user.id },
        },
        select: { id: true },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'El email ya está en uso' },
          { status: 400 }
        )
      }
    }

    // Actualizar usuario. Si cambia el email, deja de estar verificado hasta
    // que abra el link que le mandamos a la casilla nueva.
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        email,
        phone,
        ...(cambiaEmail ? { emailVerified: null } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        rol: true,
        emailVerified: true,
        createdAt: true
      }
    })

    if (cambiaEmail) {
      // Igual que en el registro: si falla el envío, el cambio ya quedó hecho.
      try {
        const { token } = await createEmailVerificationToken({ userId: updatedUser.id })
        const verifyUrl = buildEmailVerificationLink({ token })
        await enviarEmailVerificacionCuenta({
          email: updatedUser.email,
          nombre: updatedUser.name,
          verifyUrl,
        })
      } catch {
        // Error al enviar el email de verificación (no crítico)
      }
    }

    return NextResponse.json({ ...updatedUser, emailCambiado: cambiaEmail })
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2002') {
      return NextResponse.json(
        { error: 'El email ya está en uso' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al actualizar perfil' },
      { status: 500 }
    )
  }
}
