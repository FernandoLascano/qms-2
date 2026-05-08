import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener un post por slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user?.rol === 'ADMIN'
    const { slug } = await params

    const post = await prisma.post.findUnique({
      where: { slug },
    })

    if (!post || (!isAdmin && !post.publicado)) {
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
  } catch {
    return NextResponse.json(
      { error: 'Error al obtener post' },
      { status: 500 }
    )
  }
}
