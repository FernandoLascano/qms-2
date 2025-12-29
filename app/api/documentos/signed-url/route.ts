import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSignedUrlSupabase } from '@/lib/supabase-storage'

// Detectar si una URL es de Supabase Storage
function isSupabaseUrl(url: string): boolean {
  return url.includes('supabase.co/storage')
}

// Extraer el path del archivo desde una URL de Supabase
function extractSupabasePath(url: string): string | null {
  // URL format: https://xxx.supabase.co/storage/v1/object/public/documentos/folder/file.ext
  const match = url.match(/\/storage\/v1\/object\/public\/documentos\/(.+)$/)
  return match ? match[1] : null
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const documentoId = req.nextUrl.searchParams.get('documentoId')
    const url = req.nextUrl.searchParams.get('url')

    // Si se proporciona documentoId, verificar permisos y obtener URL
    if (documentoId) {
      const documento = await prisma.documento.findUnique({
        where: { id: documentoId },
        include: {
          tramite: {
            select: {
              userId: true
            }
          }
        }
      })

      if (!documento) {
        return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
      }

      // Verificar que el usuario tiene acceso (es dueño del trámite o es admin)
      const isOwner = documento.tramite.userId === session.user.id
      const isAdmin = session.user.rol === 'ADMIN'

      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }

      // Si es URL de Supabase, la URL pública funciona directamente
      if (isSupabaseUrl(documento.url)) {
        return NextResponse.json({ signedUrl: documento.url })
      }

      // Para URLs legacy (Cloudinary u otros), devolver la URL original
      return NextResponse.json({ signedUrl: documento.url })
    }

    // Si se proporciona URL directamente (para admins)
    if (url && session.user.rol === 'ADMIN') {
      // Si es URL de Supabase, funciona directamente
      if (isSupabaseUrl(url)) {
        return NextResponse.json({ signedUrl: url })
      }

      // Para otras URLs, devolverla tal cual
      return NextResponse.json({ signedUrl: url })
    }

    return NextResponse.json({ error: 'Se requiere documentoId o url' }, { status: 400 })
  } catch (error) {
    console.error('Error generando signed URL:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
