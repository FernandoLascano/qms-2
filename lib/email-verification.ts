import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 // 24h

function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex')
}

export function buildEmailVerificationLink(params: { token: string }): string {
  const base = process.env.NEXTAUTH_URL || 'https://quieromisas.com'
  return `${base}/verificar-email?token=${encodeURIComponent(params.token)}`
}

export async function createEmailVerificationToken(params: {
  userId: string
  ttlMs?: number
}): Promise<{ token: string; expiresAt: Date }> {
  const token = crypto.randomBytes(32).toString('hex')
  const tokenHash = sha256(token)
  const expiresAt = new Date(Date.now() + (params.ttlMs ?? DEFAULT_TTL_MS))

  await prisma.emailVerificationToken.create({
    data: {
      userId: params.userId,
      tokenHash,
      expiresAt,
    },
  })

  return { token, expiresAt }
}

export async function consumeEmailVerificationToken(params: { token: string }) {
  const tokenHash = sha256(params.token)
  const now = new Date()

  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  })

  if (!record) return { ok: false as const, error: 'Token inválido' }
  if (record.usedAt) return { ok: false as const, error: 'Este link ya fue usado' }
  if (record.expiresAt.getTime() < now.getTime()) return { ok: false as const, error: 'Este link expiró' }

  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: now },
    }),
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: now },
    }),
  ])

  return { ok: true as const }
}

