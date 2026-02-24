import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Listar posts (público o admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const publicoSolo = searchParams.get('publico') === 'true'
    const destacados = searchParams.get('destacados') === 'true'
    const categoria = searchParams.get('categoria')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: any = {}

    if (publicoSolo) {
      where.publicado = true
    }

    if (destacados) {
      where.destacado = true
    }

    if (categoria) {
      where.categoria = categoria
    }

    const posts = await prisma.post.findMany({
      where,
      orderBy: { fechaPublicacion: 'desc' },
      take: limit
    })

    return NextResponse.json(posts)
  } catch {
    return NextResponse.json(
      { error: 'Error al obtener posts' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo post (solo admin)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const post = await prisma.post.create({
      data: {
        titulo: body.titulo,
        slug: body.slug,
        descripcion: body.descripcion,
        contenido: body.contenido,
        categoria: body.categoria,
        tags: body.tags || [],
        autor: body.autor || session.user.name,
        lectura: body.lectura || '5 min',
        imagenHero: body.imagenHero,
        imagenAlt: body.imagenAlt,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        keywords: body.keywords || [],
        canonical: body.canonical,
        publicado: body.publicado || false,
        destacado: body.destacado || false,
        fechaPublicacion: body.fechaPublicacion || new Date()
      }
    })

    return NextResponse.json(post)
  } catch {
    return NextResponse.json(
      { error: 'Error al crear post' },
      { status: 500 }
    )
  }
}
