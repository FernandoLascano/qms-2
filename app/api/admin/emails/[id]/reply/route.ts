import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
const MAX_TOTAL_ATTACHMENTS_BYTES = 20 * 1024 * 1024

function normalizeRecipients(input: unknown): string[] {
  const values = Array.isArray(input) ? input : [input]
  const splitValues = values
    .flatMap((value) => (typeof value === 'string' ? value.split(',') : []))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)

  const unique = Array.from(new Set(splitValues))
  return unique.filter((email) => EMAIL_REGEX.test(email))
}

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
    const { html, text, to, cc, bcc, attachments } = await request.json()

    if (!html) {
      return NextResponse.json({ error: 'El cuerpo del email es obligatorio' }, { status: 400 })
    }

    // Obtener email original
    const originalEmail = await prisma.email.findUnique({ where: { id } })
    if (!originalEmail) {
      return NextResponse.json({ error: 'Email no encontrado' }, { status: 404 })
    }

    const replyTo = originalEmail.replyTo || originalEmail.from
    const toList = normalizeRecipients(to)
    const ccList = normalizeRecipients(cc)
    const bccList = normalizeRecipients(bcc)
    const finalToList = toList.length ? toList : [replyTo]
    const subject = originalEmail.subject.startsWith('Re:')
      ? originalEmail.subject
      : `Re: ${originalEmail.subject}`

    const parsedAttachments: Array<{
      filename: string
      content: Buffer
      contentType?: string
      size: number
    }> = []

    if (Array.isArray(attachments) && attachments.length > 0) {
      let totalBytes = 0
      for (const attachment of attachments) {
        if (!attachment?.filename || !attachment?.contentBase64) continue
        const content = Buffer.from(String(attachment.contentBase64), 'base64')
        const size = content.byteLength
        totalBytes += size
        if (size > MAX_ATTACHMENT_BYTES) {
          return NextResponse.json({ error: `El adjunto ${attachment.filename} supera el límite de 10 MB` }, { status: 400 })
        }
        if (totalBytes > MAX_TOTAL_ATTACHMENTS_BYTES) {
          return NextResponse.json({ error: 'El total de adjuntos supera el límite de 20 MB' }, { status: 400 })
        }
        parsedAttachments.push({
          filename: String(attachment.filename),
          content,
          contentType: attachment.contentType ? String(attachment.contentType) : undefined,
          size,
        })
      }
    }

    // Enviar respuesta
    const result = await sendEmail({
      to: finalToList,
      cc: ccList,
      bcc: bccList.length ? bccList : undefined,
      replyTo: process.env.SMTP_FROM || 'contacto@quieromisas.com',
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
      attachments: parsedAttachments.map((item) => ({
        filename: item.filename,
        content: item.content,
        contentType: item.contentType,
      })),
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
        to: finalToList,
        cc: ccList,
        bcc: bccList,
        subject,
        bodyHtml: html,
        bodyText: text || html.replace(/<[^>]*>/g, ''),
        direction: 'OUTBOUND',
        status: 'READ',
        parentEmailId: id,
        tramiteId: originalEmail.tramiteId,
        attachments: {
          create: parsedAttachments.map((item) => ({
            fileName: item.filename,
            mimeType: item.contentType || 'application/octet-stream',
            size: item.size,
            s3Key: `outbound-inline/${result.messageId || 'unknown'}/${item.filename}`,
          })),
        },
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
