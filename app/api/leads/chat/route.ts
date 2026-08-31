import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { capturarLead } from '@/lib/leads/capturar'

/**
 * Deja el email de alguien que estaba consultando por el chat.
 *
 * El chat era anónimo: 11 consultas registradas en `ConsultaChat` sin ninguna
 * forma de saber quién preguntó ni de responderle. Acá la persona elige dejar
 * su contacto, y recién ahí nace el lead.
 *
 * Es opcional a propósito y no corta la conversación: pedirle los datos a
 * alguien que todavía está entendiendo qué es una S.A.S. es la mejor forma de
 * que se vaya.
 */
export async function POST(request: NextRequest) {
  try {
    const limite = await rateLimit(request, 'lead-chat', 5, '10 m')
    if (limite) return limite

    const body = await request.json()
    const { email, nombre, consulta, atribucion, website } = body

    // Honeypot, igual que en el formulario de contacto.
    if (typeof website === 'string' && website.trim().length > 0) {
      return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
    }

    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Necesitamos un email válido' }, { status: 400 })
    }

    await capturarLead({
      email,
      nombre: typeof nombre === 'string' ? nombre : null,
      origen: 'CHAT',
      mensaje: typeof consulta === 'string' ? consulta : null,
      atribucion: atribucion || null,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al guardar el lead del chat:', error)
    return NextResponse.json({ error: 'No pudimos guardar tus datos' }, { status: 500 })
  }
}
