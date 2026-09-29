import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CONCEPTOS_HONORARIOS } from '@/lib/comisiones'

const ORIGINADORES = ['NINGUNO', 'FERNANDO', 'JUSTINIANO', 'MW'] as const

/**
 * PATCH - Registra quién trajo al cliente, en el trámite o en el lead.
 *
 * Cláusula 4.2 b: la originación sólo cuenta si se registró antes del primer
 * cobro. Se guarda la fecha y se avisa si ya había un cobro, para que se sepa
 * que ese no va a generar comisión.
 */
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const { tipo, id, originador } = await request.json()
    if (!ORIGINADORES.includes(originador)) {
      return NextResponse.json({ error: 'Originador inválido' }, { status: 400 })
    }
    if (tipo !== 'TRAMITE' && tipo !== 'LEAD') {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
    }

    const data = {
      originador,
      originadorRegistradoEn: originador === 'NINGUNO' ? null : new Date(),
    }

    let cobrosPrevios = 0
    if (tipo === 'TRAMITE') {
      await prisma.tramite.update({ where: { id: String(id) }, data })
      cobrosPrevios = await prisma.pago.count({
        where: { tramiteId: String(id), estado: 'APROBADO', concepto: { in: [...CONCEPTOS_HONORARIOS] as never } },
      })
    } else {
      const lead = await prisma.lead.update({ where: { id: String(id) }, data, select: { userId: true } })
      if (lead.userId) {
        cobrosPrevios = await prisma.pago.count({
          where: { tramite: { userId: lead.userId }, estado: 'APROBADO', concepto: { in: [...CONCEPTOS_HONORARIOS] as never } },
        })
      }
    }

    return NextResponse.json({ ...data, cobrosPrevios })
  } catch (error) {
    console.error('Error al registrar el originador:', error)
    return NextResponse.json({ error: 'No se pudo guardar' }, { status: 500 })
  }
}
