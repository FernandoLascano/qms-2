import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH - Actualizar jurisdicción (gastos, habilitada, nombre, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const updateData: any = {}
    if (body.nombre !== undefined) updateData.nombre = body.nombre
    if (body.habilitada !== undefined) updateData.habilitada = body.habilitada
    if (body.gastos !== undefined) updateData.gastos = body.gastos
    if (body.totalEstimado !== undefined) updateData.totalEstimado = body.totalEstimado
    if (body.orden !== undefined) updateData.orden = body.orden
    if (body.observaciones !== undefined) updateData.observaciones = body.observaciones

    const jurisdiccion = await prisma.gastoJurisdiccion.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(jurisdiccion)
  } catch {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}
