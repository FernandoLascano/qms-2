import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { contactosDe, contraparteDe } from '@/lib/emails/contactos'

// GET - Obtener un email específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const email = await prisma.email.findUnique({
      where: { id },
      include: {
        attachments: true,
        tramite: { select: { id: true, denominacionSocial1: true, estadoGeneral: true } },
        parentEmail: { select: { id: true, subject: true, from: true, createdAt: true } },
        replies: {
          select: { id: true, subject: true, from: true, to: true, createdAt: true, direction: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!email) {
      return NextResponse.json({ error: 'Email no encontrado' }, { status: 404 })
    }

    // Marcar como leído si es UNREAD
    if (email.status === 'UNREAD') {
      await prisma.email.update({
        where: { id },
        data: { status: 'READ' },
      })
    }

    // Quién es la otra parte: cliente (con su trámite), lead o desconocido.
    const contactos = await contactosDe([contraparteDe(email)])

    return NextResponse.json({ ...email, contacto: contactos[contraparteDe(email)] ?? null })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// PATCH - Actualizar email (archivar, vincular a trámite, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const updateData: { status?: 'UNREAD' | 'READ' | 'REPLIED' | 'ARCHIVED'; tramiteId?: string | null } = {}
    if (body.status !== undefined) {
      if (!['UNREAD', 'READ', 'REPLIED', 'ARCHIVED'].includes(body.status)) {
        return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
      }
      updateData.status = body.status
    }
    if (body.tramiteId !== undefined) updateData.tramiteId = body.tramiteId || null

    const email = await prisma.email.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(email)
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
