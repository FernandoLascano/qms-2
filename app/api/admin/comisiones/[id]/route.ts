import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.rol !== 'ADMIN') return null
  return session
}

// PUT - Editar un movimiento. Para los importados de un Pago (origen=PAGO) solo se
// permite cambiar el originador y las notas; el monto/cliente/asunto vienen del pago.
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const { id } = await params
    const body = await request.json()

    const actual = await prisma.movimientoComision.findUnique({ where: { id } })
    if (!actual) {
      return NextResponse.json({ error: 'Movimiento no encontrado' }, { status: 404 })
    }

    const originadoresValidos = ['NINGUNO', 'FERNANDO', 'JUSTINIANO', 'MW']
    const data: any = {}

    if (body.originador !== undefined) {
      if (!originadoresValidos.includes(body.originador)) {
        return NextResponse.json({ error: 'Originador inválido' }, { status: 400 })
      }
      data.originador = body.originador
    }
    if (body.notas !== undefined) data.notas = body.notas ? String(body.notas).trim() : null

    // Campos editables solo para movimientos manuales
    if (actual.origen === 'MANUAL') {
      if (body.cliente !== undefined) {
        if (!String(body.cliente).trim()) {
          return NextResponse.json({ error: 'El cliente no puede quedar vacío' }, { status: 400 })
        }
        data.cliente = String(body.cliente).trim()
      }
      if (body.asunto !== undefined) {
        if (!String(body.asunto).trim()) {
          return NextResponse.json({ error: 'El asunto no puede quedar vacío' }, { status: 400 })
        }
        data.asunto = String(body.asunto).trim()
      }
      if (body.monto !== undefined) {
        const monto = Number(body.monto)
        if (!Number.isFinite(monto) || monto <= 0) {
          return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })
        }
        data.monto = monto
      }
      if (body.fecha !== undefined) data.fecha = new Date(body.fecha)
    }

    const movimiento = await prisma.movimientoComision.update({ where: { id }, data })
    return NextResponse.json(movimiento)
  } catch {
    return NextResponse.json({ error: 'Error al actualizar el movimiento' }, { status: 500 })
  }
}

// DELETE - Eliminar un movimiento manual. Los importados de un Pago no se borran
// (se recrean al sincronizar); para excluirlos, cambiá el monto en el pago o el originador.
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const { id } = await params
    const actual = await prisma.movimientoComision.findUnique({ where: { id } })
    if (!actual) {
      return NextResponse.json({ error: 'Movimiento no encontrado' }, { status: 404 })
    }
    if (actual.origen === 'PAGO') {
      // No se borra (la sincronización lo recrearía): se excluye del reparto.
      await prisma.movimientoComision.update({ where: { id }, data: { excluido: true } })
      return NextResponse.json({ success: true, excluido: true })
    }
    await prisma.movimientoComision.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar el movimiento' }, { status: 500 })
  }
}
