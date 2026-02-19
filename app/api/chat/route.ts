import { NextResponse } from 'next/server'
import { chatWithAssistant } from '@/lib/ai/assistant'

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Servicio de chat no configurado. Agregá OPENAI_API_KEY en .env' },
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

    return NextResponse.json({ message: response })
  } catch (error) {
    console.error('Error en chat:', error)
    return NextResponse.json(
      { error: 'No pude procesar tu consulta. Probá de nuevo o contactanos.' },
      { status: 500 }
    )
  }
}
