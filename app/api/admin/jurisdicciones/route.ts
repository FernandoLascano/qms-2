import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Crear nueva jurisdicción
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { jurisdiccion, nombre } = body

    if (!jurisdiccion?.trim() || !nombre?.trim()) {
      return NextResponse.json({ error: 'Código y nombre son obligatorios' }, { status: 400 })
    }

    // Verificar que no exista
    const existing = await prisma.gastoJurisdiccion.findUnique({
      where: { jurisdiccion: jurisdiccion.trim().toUpperCase() }
    })
    if (existing) {
      return NextResponse.json({ error: 'Ya existe una jurisdicción con ese código' }, { status: 400 })
    }

    // Obtener el orden máximo actual
    const maxOrden = await prisma.gastoJurisdiccion.aggregate({ _max: { orden: true } })

    const nueva = await prisma.gastoJurisdiccion.create({
      data: {
        jurisdiccion: jurisdiccion.trim().toUpperCase(),
        nombre: nombre.trim(),
        habilitada: false,
        orden: (maxOrden._max.orden || 0) + 1,
        gastos: [],
        totalEstimado: null,
      }
    })

    return NextResponse.json(nueva, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error al crear jurisdicción' }, { status: 500 })
  }
}
