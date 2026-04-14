import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** Plantillas editables en BD (EmailTemplate) para redactar desde admin */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const templates = await prisma.emailTemplate.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { displayName: 'asc' }],
      select: {
        id: true,
        name: true,
        displayName: true,
        subject: true,
        bodyHtml: true,
        category: true,
      },
    })

    return NextResponse.json({ templates })
  } catch {
    return NextResponse.json({ error: 'Error al listar plantillas' }, { status: 500 })
  }
}
