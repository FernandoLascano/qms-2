import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - Registrar una vista de un post publicado (llamado desde el cliente
// al abrir el artículo). Es público y best-effort: nunca debe romper la página.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.post.updateMany({
      where: { id, publicado: true },
      data: { vistas: { increment: 1 } },
    })
    return NextResponse.json({ ok: true })
  } catch {
    // No exponemos el error: el conteo de vistas no es crítico.
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
