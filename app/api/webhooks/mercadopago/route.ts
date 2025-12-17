import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Mercado Pago envía notificaciones de tipo "payment"
    if (body.type === 'payment') {
      const paymentId = body.data.id

      // Obtener información del pago desde Mercado Pago
      const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN

      if (!accessToken) {
        console.error('MERCADOPAGO_ACCESS_TOKEN no configurado')
        return NextResponse.json({ error: 'Configuración faltante' }, { status: 500 })
      }

      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        console.error('Error al obtener pago de Mercado Pago')
        return NextResponse.json({ error: 'Error al obtener pago' }, { status: 500 })
      }

      const payment = await response.json()

      // Verificar si el pago fue aprobado
      if (payment.status === 'approved') {
        // Extraer tramiteId y concepto del external_reference
        const externalReference = payment.external_reference
        if (!externalReference) {
          console.error('No se encontró external_reference')
          return NextResponse.json({ error: 'Referencia no encontrada' }, { status: 400 })
        }

        const [tramiteId, concepto] = externalReference.split('|')

        // Buscar el pago en la base de datos
        const pago = await prisma.pago.findFirst({
          where: {
            tramiteId: tramiteId,
            concepto: concepto,
            estado: 'PENDIENTE'
          },
          include: {
            tramite: true
          }
        })

        if (!pago) {
          console.error('Pago no encontrado en la base de datos')
          return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
        }

        // Actualizar el pago
        await prisma.pago.update({
          where: { id: pago.id },
          data: {
            estado: 'PAGADO',
            mercadoPagoPaymentId: payment.id.toString()
          }
        })

        // Notificar al usuario
        if (pago.tramite) {
          await prisma.notificacion.create({
            data: {
              userId: pago.tramite.userId,
              tramiteId: tramiteId,
              tipo: 'EXITO',
              titulo: '✅ Pago de Honorarios Confirmado',
              mensaje: `Hemos recibido tu pago de ${concepto} por $${pago.monto.toLocaleString('es-AR')}. ¡Gracias!`
            }
          })
        }

        // Notificar a los admins
        const admins = await prisma.user.findMany({
          where: { rol: 'ADMIN' }
        })

        for (const admin of admins) {
          await prisma.notificacion.create({
            data: {
              userId: admin.id,
              tramiteId: tramiteId,
              tipo: 'EXITO',
              titulo: '💰 Pago de Honorarios Recibido',
              mensaje: `El cliente pagó ${concepto} por $${pago.monto.toLocaleString('es-AR')} (Trámite #${tramiteId.substring(0, 8)}).`
            }
          })
        }

        console.log(`Pago confirmado: ${pago.id}`)
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error en webhook de Mercado Pago:', error)
    return NextResponse.json(
      { error: 'Error procesando webhook' },
      { status: 500 }
    )
  }
}

