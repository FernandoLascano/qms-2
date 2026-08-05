import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.rol !== 'ADMIN') return null
  return session
}

// POST - Registra una distribución efectiva del Fondo de Desarrollo (acuerdo escrito).
export async function POST(request: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const body = await request.json()
    const monto = Number(body.monto)
    const beneficiario = body.beneficiario
    if (!['FERNANDO', 'JUSTINIANO'].includes(beneficiario)) {
      return NextResponse.json({ error: 'El fondo solo se distribuye a Fernando o Justiniano' }, { status: 400 })
    }
    if (!Number.isFinite(monto) || monto <= 0) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })
    }
    const distribucion = await prisma.distribucionFondo.create({
      data: {
        fecha: body.fecha ? new Date(body.fecha) : new Date(),
        beneficiario,
        monto,
        notas: body.notas ? String(body.notas).trim() : null,
      },
    })
    return NextResponse.json(distribucion, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error al registrar la distribución' }, { status: 500 })
  }
}

// DELETE - Elimina una distribución del fondo (?id=...)
export async function DELETE(request: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Falta el id' }, { status: 400 })
    await prisma.distribucionFondo.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar la distribución' }, { status: 500 })
  }
}
