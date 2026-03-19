import { NextRequest, NextResponse } from 'next/server'
import { chatWithAssistant } from '@/lib/ai/assistant'
import { rateLimit } from '@/lib/rate-limit'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await rateLimit(request, 'chat', 10, '1 m')
    if (rateLimitResponse) return rateLimitResponse
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Servicio de chat no configurado.' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { messages } = body as { messages: { role: 'user' | 'assistant'; content: string }[] }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Se requiere al menos un mensaje' }, { status: 400 })
    }

    // Limitar cantidad de mensajes para evitar costos
    const recentMessages = messages.slice(-10)

    const response = await chatWithAssistant(recentMessages, apiKey)

    // Guardar la última pregunta y respuesta para analytics
    const lastUserMessage = recentMessages.filter(m => m.role === 'user').pop()
    if (lastUserMessage) {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
      prisma.consultaChat.create({
        data: {
          pregunta: lastUserMessage.content.substring(0, 2000),
          respuesta: response.substring(0, 2000),
          ip,
        }
      }).catch(() => {})
    }

    return NextResponse.json({ message: response })
  } catch {
    return NextResponse.json(
      { error: 'No pude procesar tu consulta. Probá de nuevo o contactanos.' },
      { status: 500 }
    )
  }
}
