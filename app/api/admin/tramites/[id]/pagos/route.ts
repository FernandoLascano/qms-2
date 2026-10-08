import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { registerPartnerConversion } from '@/lib/partners'
import { registrarCobroDomicilio } from '@/lib/domicilio-sede'

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
    const { concepto, monto, fecha, metodoPago } = await request.json()

    // Fecha del cobro (AAAA-MM-DD, día argentino). Define en qué mes cae en
    // Comisiones y en la liquidación, así que un pago cargado tarde tiene que
    // llevar el día en que entró, no el de la carga. Sin fecha, hoy.
    let fechaPago = new Date()
    if (fecha) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(fecha))) {
        return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 })
      }
      // Mediodía argentino: el día no cambia al pasarlo a UTC.
      fechaPago = new Date(`${fecha}T12:00:00-03:00`)
      if (isNaN(fechaPago.getTime()) || fechaPago.getTime() > Date.now() + 86_400_000) {
        return NextResponse.json({ error: 'La fecha del pago no puede ser futura' }, { status: 400 })
      }
    }
    const metodos = ['TRANSFERENCIA', 'MERCADO_PAGO', 'EFECTIVO', 'TARJETA']
    const metodo = metodos.includes(metodoPago) ? metodoPago : 'TRANSFERENCIA'

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
    const pago = await prisma.pago.create({
      data: {
        tramiteId: id,
        userId: tramite.userId,
        concepto: concepto,
        monto: monto,
        moneda: 'ARS',
        estado: 'APROBADO',
        metodoPago: metodo,
        fechaPago
      }
    })

    if (concepto === 'DOMICILIO_SEDE') {
      await registrarCobroDomicilio(id, pago.monto, pago.fechaPago ?? new Date())
    }

    await registerPartnerConversion({
      userId: tramite.userId,
      montoCobrado: pago.monto,
      metodoPago: pago.metodoPago,
      sourceType: 'PAGO',
      sourceId: pago.id,
      pagoId: pago.id,
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

