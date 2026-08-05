import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPorcentajes } from '@/lib/comisiones-server'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.rol !== 'ADMIN') return null
  return session
}

// GET - Todo lo que necesita el módulo de comisiones (movimientos + parámetros + liquidaciones + fondo)
export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const [porcentajes, movimientos, liquidaciones, distribucionesFondo] = await Promise.all([
      getPorcentajes(),
      prisma.movimientoComision.findMany({ where: { excluido: false }, orderBy: { fecha: 'desc' } }),
      prisma.liquidacionPago.findMany(),
      prisma.distribucionFondo.findMany({ orderBy: { fecha: 'desc' } }),
    ])

    return NextResponse.json({ porcentajes, movimientos, liquidaciones, distribucionesFondo })
  } catch {
    return NextResponse.json({ error: 'Error al cargar comisiones' }, { status: 500 })
  }
}

// POST - Crear un movimiento manual (ingreso que no pasa por el sistema de pagos)
export async function POST(request: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const monto = Number(body.monto)
    if (!body.cliente?.trim() || !body.asunto?.trim() || !Number.isFinite(monto) || monto <= 0) {
      return NextResponse.json(
        { error: 'Completá cliente, asunto y un monto válido mayor a 0' },
        { status: 400 }
      )
    }

    const originadoresValidos = ['NINGUNO', 'FERNANDO', 'JUSTINIANO', 'MW']
    const originador = originadoresValidos.includes(body.originador) ? body.originador : 'NINGUNO'

    const movimiento = await prisma.movimientoComision.create({
      data: {
        fecha: body.fecha ? new Date(body.fecha) : new Date(),
        cliente: String(body.cliente).trim(),
        asunto: String(body.asunto).trim(),
        monto,
        originador,
        origen: 'MANUAL',
        notas: body.notas ? String(body.notas).trim() : null,
      },
    })

    return NextResponse.json(movimiento, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error al crear el movimiento' }, { status: 500 })
  }
}
