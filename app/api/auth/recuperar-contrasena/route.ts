import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { crearTokenRestablecer, linkRestablecer } from '@/lib/password-reset'
import { enviarEmailRecuperarPassword } from '@/lib/emails/send'
import { normalizarEmail } from '@/lib/validaciones'

/**
 * Pide el link para cambiar la contraseña. Responde siempre lo mismo, exista o
 * no la cuenta, para no revelar qué emails están registrados. Límite por IP y
 * por email para que no sirva para llenarle la casilla a nadie.
 */
const RESPUESTA = {
  ok: true,
  message: 'Si hay una cuenta con ese email, te mandamos un link para cambiar la contraseña.',
}

export async function POST(request: Request) {
  const porIp = await rateLimit(request, 'recuperar-contrasena', 5, '10 m')
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

  const porEmail = await rateLimit(request, 'recuperar-contrasena-email', 3, '1 h', email)
  if (porEmail) return porEmail

  try {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, name: true } })
    // También para cuentas creadas con Google: así pueden sumar una contraseña.
    if (user) {
      const token = await crearTokenRestablecer(user.id)
      await enviarEmailRecuperarPassword({ email: user.email, nombre: user.name, resetUrl: linkRestablecer(token) })
    }
  } catch (error) {
    console.error('[recuperar-contrasena]', error)
  }

  return NextResponse.json(RESPUESTA)
}
