import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { extractDocumentsObjectPath, getSignedUrlSupabase } from '@/lib/supabase-storage'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const documento = await prisma.documento.findFirst({
      where: {
        id,
        OR: [{ userId: session.user.id }, { tramite: { userId: session.user.id } }],
      },
      include: {
        tramite: true,
      },
    })

    if (!documento && session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
    }

    const doc = documento
      ? documento
      : await prisma.documento.findUnique({
          where: { id },
        })

    if (!doc) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
    }

    const resolved = extractDocumentsObjectPath(doc.url)
    if (resolved) {
      const signed = await getSignedUrlSupabase(resolved.path, 300, resolved.bucket)
      if (signed) {
        return NextResponse.redirect(signed)
      }
    }

    return NextResponse.redirect(doc.url)
  } catch {
    return NextResponse.json(
      { error: 'Error al obtener documento' },
      { status: 500 }
    )
  }
}
