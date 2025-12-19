import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Obtener un post por slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const post = await prisma.post.findUnique({
      where: { slug }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post no encontrado' },
        { status: 404 }
      )
    }

    // Solo incrementar vistas si está publicado
    if (post.publicado) {
      await prisma.post.update({
        where: { slug },
        data: { vistas: { increment: 1 } }
      })
    }

    return NextResponse.json(post)
  } catch (error: any) {
    console.error('Error al obtener post:', error)
    return NextResponse.json(
      { error: 'Error al obtener post', detalles: error.message },
      { status: 500 }
    )
  }
}
