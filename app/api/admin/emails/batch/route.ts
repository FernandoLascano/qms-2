import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EmailStatus } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const ids = body.ids as unknown
    const status = body.status as unknown

    if (!Array.isArray(ids) || ids.length === 0 || typeof status !== 'string') {
      return NextResponse.json({ error: 'ids[] y status requeridos' }, { status: 400 })
    }

    if (!Object.values(EmailStatus).includes(status as EmailStatus)) {
      return NextResponse.json({ error: 'status inválido' }, { status: 400 })
    }

    const cleanIds = ids.filter((id): id is string => typeof id === 'string' && id.length > 0)
    if (!cleanIds.length) {
      return NextResponse.json({ error: 'Sin ids válidos' }, { status: 400 })
    }

    const result = await prisma.email.updateMany({
      where: { id: { in: cleanIds } },
      data: { status: status as EmailStatus },
    })

    return NextResponse.json({ updated: result.count })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
