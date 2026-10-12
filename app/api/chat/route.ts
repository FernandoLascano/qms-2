import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { chatWithAssistant } from '@/lib/ai/assistant'
import { rateLimit, rateLimitLong } from '@/lib/rate-limit'
import { prisma } from '@/lib/prisma'
import { verifyTurnstileToken } from '@/lib/turnstile'
import { getPublicConfig } from '@/lib/config'
import { formatARS, precioRegular } from '@/lib/precios'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const { messages, turnstileToken } = body as {
      messages: { role: 'user' | 'assistant'; content: string }[]
      turnstileToken?: string
    }

    const remoteip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      null

    if (session?.user?.id) {
      const rl1 = await rateLimit(request, 'chat_auth', 25, '1 m', session.user.id)
      if (rl1) return rl1
      const rl2 = await rateLimitLong(request, 'chat_auth_daily', 200, '1 d', session.user.id)
      if (rl2) return rl2
    } else {
      const tv = await verifyTurnstileToken({ token: turnstileToken, remoteip })
      if (!tv.ok) {
        return NextResponse.json(
          { error: tv.error || 'Verificación requerida' },
          { status: 403 }
        )
      }
      const rl1 = await rateLimit(request, 'chat_anon', 10, '1 m')
      if (rl1) return rl1
      const rl2 = await rateLimitLong(request, 'chat_anon_daily', 50, '1 d')
      if (rl2) return rl2
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Se requiere al menos un mensaje' }, { status: 400 })
    }

    const recentMessages = messages.slice(-10)

    const { precioPlanBasico, precioPlanEmprendedor, precioPlanPremium } = await getPublicConfig()
    const precios = [
      ['Básico', precioPlanBasico],
      ['Emprendedor', precioPlanEmprendedor],
      ['Premium', precioPlanPremium],
    ] as const
    const contexto = `Honorarios vigentes de QuieroMiSAS (no incluyen las tasas del organismo ni el capital social):\n${precios
      .map(([plan, p]) => `- Plan ${plan}: ${formatARS(p)} por transferencia, ${formatARS(precioRegular(p))} con tarjeta o Mercado Pago`)
      .join('\n')}`

    const response = await chatWithAssistant(recentMessages, contexto)

    const lastUserMessage = recentMessages.filter((m) => m.role === 'user').pop()
    if (lastUserMessage) {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
      prisma.consultaChat
        .create({
          data: {
            pregunta: lastUserMessage.content.substring(0, 2000),
            respuesta: response.substring(0, 2000),
            ip,
          },
        })
        .catch(() => {})
    }

    return NextResponse.json({ message: response })
  } catch {
    return NextResponse.json(
      { error: 'No pude procesar tu consulta. Probá de nuevo o contactanos.' },
      { status: 500 }
    )
  }
}
