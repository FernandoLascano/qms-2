import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

// POST - Responder a un email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const { html, text } = await request.json()

    if (!html) {
      return NextResponse.json({ error: 'El cuerpo del email es obligatorio' }, { status: 400 })
    }

    // Obtener email original
    const originalEmail = await prisma.email.findUnique({ where: { id } })
    if (!originalEmail) {
      return NextResponse.json({ error: 'Email no encontrado' }, { status: 404 })
    }

    const replyTo = originalEmail.replyTo || originalEmail.from
    const subject = originalEmail.subject.startsWith('Re:')
      ? originalEmail.subject
      : `Re: ${originalEmail.subject}`

    // Enviar respuesta
    const result = await sendEmail({
      to: replyTo,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    })

    if (!result.success) {
      return NextResponse.json({ error: 'Error al enviar respuesta' }, { status: 500 })
    }

    // Guardar en DB
    const reply = await prisma.email.create({
      data: {
        messageId: result.messageId || `reply-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        from: process.env.SMTP_FROM || 'contacto@quieromisas.com',
        fromName: process.env.SMTP_FROM_NAME || 'QuieroMiSAS',
        to: [replyTo],
        subject,
        bodyHtml: html,
        bodyText: text || html.replace(/<[^>]*>/g, ''),
        direction: 'OUTBOUND',
        status: 'READ',
        parentEmailId: id,
        tramiteId: originalEmail.tramiteId,
      },
    })

    // Marcar original como respondido
    await prisma.email.update({
      where: { id },
      data: { status: 'REPLIED' },
    })

    return NextResponse.json({ success: true, emailId: reply.id })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
