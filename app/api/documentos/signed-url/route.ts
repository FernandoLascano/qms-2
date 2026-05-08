import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { extractDocumentsObjectPath, getSignedUrlSupabase } from '@/lib/supabase-storage'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const documentoId = req.nextUrl.searchParams.get('documentoId')
    const url = req.nextUrl.searchParams.get('url')

    async function signedForStored(storedUrl: string): Promise<NextResponse> {
      const resolved = extractDocumentsObjectPath(storedUrl)
      if (resolved) {
        const signed = await getSignedUrlSupabase(resolved.path, 3600, resolved.bucket)
        if (signed) {
          return NextResponse.json({ signedUrl: signed })
        }
      }
      return NextResponse.json({ signedUrl: storedUrl })
    }

    if (documentoId) {
      const documento = await prisma.documento.findUnique({
        where: { id: documentoId },
        include: {
          tramite: {
            select: {
              userId: true,
            },
          },
        },
      })

      if (!documento) {
        return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
      }

      const isOwner = documento.tramite.userId === session.user.id
      const isAdmin = session.user.rol === 'ADMIN'

      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }

      return signedForStored(documento.url)
    }

    if (url && session.user.rol === 'ADMIN') {
      return signedForStored(url)
    }

    return NextResponse.json({ error: 'Se requiere documentoId o url' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
