import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const { concepto, monto } = await request.json()

    // Obtener trámite
    const tramite = await prisma.tramite.findUnique({
      where: { id }
    })

    if (!tramite) {
      return NextResponse.json(
        { error: 'Trámite no encontrado' },
        { status: 404 }
      )
    }

    // Registrar pago
    await prisma.pago.create({
      data: {
        tramiteId: id,
        userId: tramite.userId,
        concepto: concepto,
        monto: monto,
        moneda: 'ARS',
        estado: 'APROBADO',
        metodoPago: 'TRANSFERENCIA',
        fechaPago: new Date()
      }
    })

    // Notificar al usuario
    await prisma.notificacion.create({
      data: {
        userId: tramite.userId,
        tramiteId: id,
        tipo: 'EXITO',
        titulo: 'Pago Registrado',
        mensaje: `Se ha registrado tu pago de $${monto.toLocaleString('es-AR')} por concepto: ${concepto}`
      }
    })

    return NextResponse.json({ success: true })

  } catch {
    return NextResponse.json(
      { error: 'Error al registrar pago' },
      { status: 500 }
    )
  }
}

