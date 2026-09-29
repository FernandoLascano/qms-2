import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPorcentajes } from '@/lib/comisiones-server'

/**
 * PUT - Bono comercial de Fernando en un mes (acuerdo aparte con MW, fuera
 * del contrato QMS). Sale de la parte de MW, así que no puede superarla.
 * Porcentaje vacío o 0 = ese mes no hubo bono.
 */
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const { periodo, porcentaje } = await request.json()
    if (!/^\d{4}-\d{2}$/.test(String(periodo))) {
      return NextResponse.json({ error: 'Período inválido' }, { status: 400 })
    }

    const pct = porcentaje === '' || porcentaje == null ? 0 : Number(porcentaje)
    const { mw } = await getPorcentajes()
    if (!Number.isFinite(pct) || pct < 0 || pct > mw) {
      return NextResponse.json({ error: `El bono sale de la parte de MW: entre 0 y ${mw}%` }, { status: 400 })
    }

    if (pct === 0) {
      await prisma.bonoComercialMes.deleteMany({ where: { periodo } })
      return NextResponse.json({ periodo, porcentaje: 0 })
    }
    const bono = await prisma.bonoComercialMes.upsert({
      where: { periodo },
      create: { periodo, porcentaje: pct },
      update: { porcentaje: pct },
    })
    return NextResponse.json(bono)
  } catch {
    return NextResponse.json({ error: 'No se pudo guardar el bono' }, { status: 500 })
  }
}
