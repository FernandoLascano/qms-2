import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { SITE_URL } from '@/lib/seo/site'

/**
 * «Olvidé mi contraseña». Mismo esquema que la verificación de email
 * (lib/email-verification.ts): se manda un token aleatorio y en la base queda
 * sólo su hash. Vence en 1 hora y sirve una sola vez.
 */
const VIGENCIA_MS = 1000 * 60 * 60

const sha256 = (texto: string) => crypto.createHash('sha256').update(texto).digest('hex')

export function linkRestablecer(token: string): string {
  const base = process.env.NEXTAUTH_URL || SITE_URL
  return `${base}/restablecer-contrasena?token=${encodeURIComponent(token)}`
}

export async function crearTokenRestablecer(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex')
  await prisma.passwordResetToken.create({
    data: { userId, tokenHash: sha256(token), expiresAt: new Date(Date.now() + VIGENCIA_MS) },
  })
  return token
}

type Resultado = { ok: true; email: string } | { ok: false; error: string }

/**
 * Cambia la contraseña con un token válido. Además:
 * - invalida los demás links pendientes del usuario;
 * - marca el email como verificado (abrir el link prueba que el email es suyo,
 *   y si no, quien no había verificado quedaría trabado de nuevo en el login).
 */
export async function restablecerPassword(token: string, password: string): Promise<Resultado> {
  const registro = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: sha256(token) },
    select: { id: true, userId: true, expiresAt: true, usedAt: true, user: { select: { email: true, emailVerified: true } } },
  })
  if (!registro) return { ok: false, error: 'El link no es válido. Pedí uno nuevo.' }
  if (registro.usedAt) return { ok: false, error: 'Este link ya se usó. Si necesitás cambiarla otra vez, pedí uno nuevo.' }
  if (registro.expiresAt.getTime() < Date.now()) return { ok: false, error: 'El link venció. Pedí uno nuevo: dura 1 hora.' }

  const ahora = new Date()
  const hash = await bcrypt.hash(password, 10)
  await prisma.$transaction([
    prisma.user.update({
      where: { id: registro.userId },
      data: { password: hash, ...(registro.user.emailVerified ? {} : { emailVerified: ahora }) },
    }),
    prisma.passwordResetToken.updateMany({
      where: { userId: registro.userId, usedAt: null },
      data: { usedAt: ahora },
    }),
  ])
  return { ok: true, email: registro.user.email }
}
