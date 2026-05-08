import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { blogPostUpdateSchema } from '@/lib/schemas/blog'
import DOMPurify from 'isomorphic-dompurify'

// GET - Obtener un post por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    const post = await prisma.post.findUnique({
      where: { id },
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post no encontrado' },
        { status: 404 }
      )
    }

    const isAdmin = session?.user?.rol === 'ADMIN'
    if (!isAdmin && !post.publicado) {
      return NextResponse.json({ error: 'Post no encontrado' }, { status: 404 })
    }

    // No contar vista cuando un admin abre el editor (evita inflar métricas)
    if (isAdmin) {
      return NextResponse.json(post)
    }

    const updated = await prisma.post.update({
      where: { id },
      data: { vistas: { increment: 1 } },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json(
      { error: 'Error al obtener post' },
      { status: 500 }
    )
  }
}

// PATCH - Actualizar post (solo admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const parsed = blogPostUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const patch = { ...parsed.data } as Record<string, unknown>
    if (patch.metaDescription !== undefined && patch.metaDescription !== null) {
      patch.metaDescription = DOMPurify.sanitize(String(patch.metaDescription), {
        ALLOWED_TAGS: [],
      })
    }
    if (patch.contenido !== undefined) {
      patch.contenido = patch.contenido as object
    }

    const post = await prisma.post.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: patch as any,
    })

    return NextResponse.json(post)
  } catch {
    return NextResponse.json(
      { error: 'Error al actualizar post' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar post (alias de PATCH para compatibilidad)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PATCH(request, { params })
}

// DELETE - Eliminar post (solo admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params
    await prisma.post.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Error al eliminar post' },
      { status: 500 }
    )
  }
}
