import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.rol !== 'ADMIN') return null
  return session
}

/**
 * Gastos pagados con plata del Fondo de Desarrollo.
 *
 * Se separan de las distribuciones a propósito: las dos bajan el saldo, pero
 * una distribución es plata que cobró alguien y un gasto es plata que se
 * consumió. Mezclarlas haría parecer repartido lo que en realidad se gastó.
 */

// POST - Registra un gasto del fondo.
export async function POST(request: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const body = await request.json()

    const monto = Number(body.monto)
    if (!Number.isFinite(monto) || monto <= 0) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })
    }

    const concepto = String(body.concepto ?? '').trim()
    if (!concepto) {
      return NextResponse.json({ error: 'Escribí en qué se gastó' }, { status: 400 })
    }

    // Vacío = gasto común, se reparte en la proporción del fondo.
    const imputadoA = body.imputadoA || null
    if (imputadoA && !['FERNANDO', 'JUSTINIANO'].includes(imputadoA)) {
      return NextResponse.json({ error: 'Imputación inválida' }, { status: 400 })
    }

    const gasto = await prisma.gastoFondo.create({
      data: {
        fecha: body.fecha ? new Date(body.fecha) : new Date(),
        concepto: concepto.slice(0, 300),
        monto,
        imputadoA,
        notas: body.notas ? String(body.notas).trim().slice(0, 2000) : null,
      },
    })
    return NextResponse.json(gasto, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error al registrar el gasto' }, { status: 500 })
  }
}

// DELETE - Elimina un gasto del fondo (?id=...)
export async function DELETE(request: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Falta el id' }, { status: 400 })
    await prisma.gastoFondo.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar el gasto' }, { status: 500 })
  }
}
