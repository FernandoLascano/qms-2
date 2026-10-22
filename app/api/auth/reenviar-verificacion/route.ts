import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { buildEmailVerificationLink, createEmailVerificationToken } from '@/lib/email-verification'
import { enviarEmailVerificacionCuenta } from '@/lib/emails/send'
import { normalizarEmail } from '@/lib/validaciones'

/**
 * Reenvía el email de verificación de cuenta.
 *
 * Sin esto, a quien no le llegaba el primer email (spam, error de tipeo del
 * proveedor, link vencido a las 24 h) quedaba trabado: el login le pide
 * verificar y no había forma de pedir otro.
 *
 * La respuesta es siempre la misma exista o no la cuenta, para que el endpoint
 * no sirva para averiguar qué emails están registrados. Límite por IP y por
 * email para que no se pueda usar para mandar correos a terceros.
 */
const RESPUESTA = {
  ok: true,
  message: 'Si hay una cuenta pendiente de verificar con ese email, te reenviamos el link.',
}

export async function POST(request: Request) {
  const porIp = await rateLimit(request, 'reenviar-verificacion', 5, '10 m')
  if (porIp) return porIp

  let email = ''
  try {
    const body = await request.json()
    email = normalizarEmail(typeof body?.email === 'string' ? body.email : '')
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Ingresá un email válido' }, { status: 400 })
  }

  const porEmail = await rateLimit(request, 'reenviar-verificacion-email', 3, '1 h', email)
  if (porEmail) return porEmail

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, emailVerified: true, password: true },
    })
    // Sólo cuentas con contraseña: las de Google ya vienen verificadas.
    if (user && !user.emailVerified && user.password) {
      const { token } = await createEmailVerificationToken({ userId: user.id })
      await enviarEmailVerificacionCuenta({
        email: user.email,
        nombre: user.name,
        verifyUrl: buildEmailVerificationLink({ token }),
      })
    }
  } catch (error) {
    console.error('[reenviar-verificacion]', error)
  }

  return NextResponse.json(RESPUESTA)
}
