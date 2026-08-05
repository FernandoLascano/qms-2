import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Marca (o desmarca) como pagada la liquidación de un beneficiario en un período.
// Guarda un snapshot del monto liquidado. Upsert por (periodo, beneficiario).
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const periodo = String(body.periodo || '').trim()
    const beneficiario = body.beneficiario
    const pagado = Boolean(body.pagado)
    const monto = Number(body.monto)

    if (!/^\d{4}-\d{2}$/.test(periodo)) {
      return NextResponse.json({ error: 'Período inválido (formato YYYY-MM)' }, { status: 400 })
    }
    if (!['FERNANDO', 'JUSTINIANO', 'MW'].includes(beneficiario)) {
      return NextResponse.json({ error: 'Beneficiario inválido' }, { status: 400 })
    }
    if (!Number.isFinite(monto)) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })
    }

    const liquidacion = await prisma.liquidacionPago.upsert({
      where: { periodo_beneficiario: { periodo, beneficiario } },
      create: {
        periodo,
        beneficiario,
        monto,
        pagado,
        fechaPago: pagado ? new Date() : null,
      },
      update: {
        monto,
        pagado,
        fechaPago: pagado ? new Date() : null,
      },
    })

    return NextResponse.json(liquidacion)
  } catch {
    return NextResponse.json({ error: 'Error al registrar la liquidación' }, { status: 500 })
  }
}
