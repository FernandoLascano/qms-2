import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    // Obtener el documento
    const documento = await prisma.documento.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id },
          { tramite: { userId: session.user.id } }
        ]
      },
      include: {
        tramite: true
      }
    })

    // Si es admin, puede ver cualquier documento
    if (!documento && session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
    }

    if (!documento) {
      const docAdmin = await prisma.documento.findUnique({
        where: { id }
      })
      
      if (!docAdmin) {
        return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
      }

      // Redirigir a la URL de Cloudinary
      return NextResponse.redirect(docAdmin.url)
    }

    // Redirigir a la URL de Cloudinary
    return NextResponse.redirect(documento.url)
  } catch (error) {
    console.error('Error al obtener documento:', error)
    return NextResponse.json(
      { error: 'Error al obtener documento' },
      { status: 500 }
    )
  }
}

