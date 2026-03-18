import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

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

    const where: any = {}

    if (direction) where.direction = direction
    if (status) where.status = status
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { from: { contains: search, mode: 'insensitive' } },
        { fromName: { contains: search, mode: 'insensitive' } },
        { bodyText: { contains: search, mode: 'insensitive' } },
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

    const { to, subject, html, text, tramiteId } = await request.json()

    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (to, subject, html)' }, { status: 400 })
    }

    // Enviar email
    const result = await sendEmail({
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
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
        to: Array.isArray(to) ? to : [to],
        subject,
        bodyHtml: html,
        bodyText: text || html.replace(/<[^>]*>/g, ''),
        direction: 'OUTBOUND',
        status: 'READ',
        tramiteId: tramiteId || null,
      },
    })

    return NextResponse.json({ success: true, emailId: email.id })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
