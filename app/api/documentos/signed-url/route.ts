import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSignedUrl, extractPublicIdFromUrl } from '@/lib/cloudinary'

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

      // Extraer public_id de la URL guardada
      const extracted = extractPublicIdFromUrl(documento.url)
      if (!extracted) {
        // Si no se puede extraer, devolver la URL original
        return NextResponse.json({ signedUrl: documento.url })
      }

      const signedUrl = getSignedUrl(extracted.publicId, extracted.resourceType)
      return NextResponse.json({ signedUrl: signedUrl || documento.url })
    }

    // Si se proporciona URL directamente (para admins)
    if (url && session.user.rol === 'ADMIN') {
      const extracted = extractPublicIdFromUrl(url)
      if (!extracted) {
        return NextResponse.json({ signedUrl: url })
      }

      const signedUrl = getSignedUrl(extracted.publicId, extracted.resourceType)
      return NextResponse.json({ signedUrl: signedUrl || url })
    }

    return NextResponse.json({ error: 'Se requiere documentoId o url' }, { status: 400 })
  } catch (error) {
    console.error('Error generando signed URL:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
