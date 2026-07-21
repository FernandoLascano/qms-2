import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { blogPostCreateSchema } from '@/lib/schemas/blog'
import DOMPurify from 'isomorphic-dompurify'
import { revalidatePath } from 'next/cache'

function emptyPublicListDevFallback(publicoSolo: boolean) {
  if (publicoSolo && process.env.NODE_ENV === 'development') {
    return NextResponse.json([])
  }
  return null
}

const publicListSelect = {
  id: true,
  titulo: true,
  descripcion: true,
  slug: true,
  categoria: true,
  tags: true,
  autor: true,
  lectura: true,
  imagenHero: true,
  imagenAlt: true,
  fechaPublicacion: true,
  destacado: true,
  publicado: true,
  vistas: true,
  createdAt: true,
  updatedAt: true,
} as const

// GET - Listar posts (público o admin)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  // Solo un admin puede listar borradores/columnas completas. Cualquier otro
  // usuario (incluido anónimo) queda forzado a modo público: solo posts
  // publicados y con el select whitelist.
  const session = await getServerSession(authOptions)
  const isAdmin = session?.user?.rol === 'ADMIN'
  const publicoSolo = !isAdmin || searchParams.get('publico') === 'true'

  if (publicoSolo && !process.env.DATABASE_URL) {
    console.warn(
      '[GET /api/blog] DATABASE_URL no está definida; devolviendo lista vacía.'
    )
    const fallback = emptyPublicListDevFallback(publicoSolo)
    if (fallback) return fallback
  }

  try {
    const destacados = searchParams.get('destacados') === 'true'
    const categoria = searchParams.get('categoria')
    const rawLimit = parseInt(searchParams.get('limit') || '10', 10)
    const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? rawLimit : 10, 1), 50)

    const where: Record<string, unknown> = {}

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
      take: limit,
      select: publicoSolo ? publicListSelect : undefined,
    })

    const res = NextResponse.json(posts)
    if (publicoSolo) {
      res.headers.set(
        'Cache-Control',
        'public, s-maxage=300, stale-while-revalidate=600'
      )
    }
    return res
  } catch (err) {
    console.error('[GET /api/blog]', err)
    const fallback = emptyPublicListDevFallback(publicoSolo)
    if (fallback) return fallback
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
    const parsed = blogPostCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const d = parsed.data
    const metaDescription =
      d.metaDescription != null
        ? DOMPurify.sanitize(d.metaDescription, { ALLOWED_TAGS: [] })
        : null

    const post = await prisma.post.create({
      data: {
        titulo: d.titulo,
        slug: d.slug,
        descripcion: d.descripcion,
        contenido: d.contenido as object,
        categoria: d.categoria,
        tags: d.tags ?? [],
        autor: d.autor ?? session.user.name,
        lectura: d.lectura ?? '5 min',
        imagenHero: d.imagenHero,
        imagenAlt: d.imagenAlt,
        metaTitle: d.metaTitle,
        metaDescription,
        keywords: d.keywords ?? [],
        canonical: d.canonical,
        publicado: d.publicado ?? false,
        destacado: d.destacado ?? false,
        fechaPublicacion: d.fechaPublicacion ?? new Date(),
      },
    })

    // Reflejar el nuevo post en las páginas públicas sin esperar al ISR
    revalidatePath('/')
    revalidatePath('/blog')
    revalidatePath(`/blog/${post.slug}`)

    return NextResponse.json(post)
  } catch {
    return NextResponse.json(
      { error: 'Error al crear post' },
      { status: 500 }
    )
  }
}
