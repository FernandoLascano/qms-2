import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { Prisma } from '@prisma/client'
import { EmailDirection, EmailStatus } from '@prisma/client'

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

// GET - Listar emails con filtros y paginación
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const direction = searchParams.get('direction') // INBOUND, OUTBOUND
    const status = searchParams.get('status') // UNREAD, READ, REPLIED, ARCHIVED
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: Prisma.EmailWhereInput = {}

    if (direction && Object.values(EmailDirection).includes(direction as EmailDirection)) {
      where.direction = direction as EmailDirection
    }
    if (status && Object.values(EmailStatus).includes(status as EmailStatus)) {
      where.status = status as EmailStatus
    }
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { from: { contains: search, mode: 'insensitive' } },
        { fromName: { contains: search, mode: 'insensitive' } },
        { bodyText: { contains: search, mode: 'insensitive' } },
        { bodyHtml: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [emails, total, unreadCount] = await Promise.all([
      prisma.email.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          attachments: { select: { id: true, fileName: true, mimeType: true, size: true } },
          tramite: { select: { id: true, denominacionSocial1: true } },
          _count: { select: { replies: true } },
        },
      }),
      prisma.email.count({ where }),
      prisma.email.count({ where: { status: 'UNREAD', direction: 'INBOUND' } }),
    ])

    return NextResponse.json({
      emails,
      total,
      unreadCount,
      pages: Math.ceil(total / limit),
      page,
    })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// POST - Enviar un email nuevo
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { to, cc, bcc, subject, html, text, tramiteId, attachments } = await request.json()
    const toList = normalizeRecipients(to)
    const ccList = normalizeRecipients(cc)
    const bccList = normalizeRecipients(bcc)

    if (!toList.length || !subject || !html) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (to, subject, html)' }, { status: 400 })
    }

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

    // Enviar email
    const result = await sendEmail({
      to: toList,
      cc: ccList,
      bcc: bccList.length ? bccList : undefined,
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
      return NextResponse.json({ error: 'Error al enviar email' }, { status: 500 })
    }

    // Guardar en DB
    const email = await prisma.email.create({
      data: {
        messageId: result.messageId || `outbound-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        from: process.env.SMTP_FROM || 'contacto@quieromisas.com',
        fromName: process.env.SMTP_FROM_NAME || 'QuieroMiSAS',
        to: toList,
        cc: ccList,
        bcc: bccList,
        subject,
        bodyHtml: html,
        bodyText: text || html.replace(/<[^>]*>/g, ''),
        direction: 'OUTBOUND',
        status: 'READ',
        tramiteId: tramiteId || null,
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

    return NextResponse.json({ success: true, emailId: email.id })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
