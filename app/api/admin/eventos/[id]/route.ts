import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// PATCH - Actualizar un evento
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const { id } = await params
    const data = await request.json()

    const evento = await prisma.evento.update({
      where: { id },
      data: {
        ...(data.titulo && { titulo: data.titulo }),
        ...(data.descripcion !== undefined && { descripcion: data.descripcion }),
        ...(data.tipo && { tipo: data.tipo }),
        ...(data.fechaInicio && { fechaInicio: new Date(data.fechaInicio) }),
        ...(data.fechaFin !== undefined && { fechaFin: data.fechaFin ? new Date(data.fechaFin) : null }),
        ...(data.ubicacion !== undefined && { ubicacion: data.ubicacion }),
        ...(data.linkReunion !== undefined && { linkReunion: data.linkReunion }),
        ...(data.completado !== undefined && { completado: data.completado })
      }
    })

    return NextResponse.json({ evento, success: true })

  } catch {
    return NextResponse.json(
      { error: 'Error al actualizar evento' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar un evento
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const { id } = await params

    await prisma.evento.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })

  } catch {
    return NextResponse.json(
      { error: 'Error al eliminar evento' },
      { status: 500 }
    )
  }
}

