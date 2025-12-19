import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener un post por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const post = await prisma.post.findUnique({
      where: { id }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post no encontrado' },
        { status: 404 }
      )
    }

    // Incrementar vistas
    await prisma.post.update({
      where: { id },
      data: { vistas: { increment: 1 } }
    })

    return NextResponse.json(post)
  } catch (error: any) {
    console.error('Error al obtener post:', error)
    return NextResponse.json(
      { error: 'Error al obtener post', detalles: error.message },
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

    const post = await prisma.post.update({
      where: { id },
      data: body
    })

    return NextResponse.json(post)
  } catch (error: any) {
    console.error('Error al actualizar post:', error)
    return NextResponse.json(
      { error: 'Error al actualizar post', detalles: error.message },
      { status: 500 }
    )
  }
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
  } catch (error: any) {
    console.error('Error al eliminar post:', error)
    return NextResponse.json(
      { error: 'Error al eliminar post', detalles: error.message },
      { status: 500 }
    )
  }
}
