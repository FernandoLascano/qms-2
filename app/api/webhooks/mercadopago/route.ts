import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { rateLimit } from '@/lib/rate-limit'
import { registerPartnerConversion } from '@/lib/partners'

// Verificar firma del webhook de Mercado Pago.
// El manifest debe construirse con el id del RECURSO (data.id), no con el x-request-id.
// Ref: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
function verificarFirma(request: Request, dataId: string): boolean {
  const xSignature = request.headers.get('x-signature')
  const xRequestId = request.headers.get('x-request-id')
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET

  if (!webhookSecret) {
    return process.env.NODE_ENV !== 'production'
  }

  if (!xSignature || !xRequestId || !dataId) {
    return false
  }

  // Parsear x-signature (formato: ts=xxx,v1=xxx)
  const parts = xSignature.split(',')
  const tsEntry = parts.find(p => p.trim().startsWith('ts='))
  const v1Entry = parts.find(p => p.trim().startsWith('v1='))

  if (!tsEntry || !v1Entry) {
    return false
  }

  const ts = tsEntry.split('=')[1]
  const hash = v1Entry.split('=')[1]

  // El id alfanumérico debe ir en minúsculas según la spec de MP
  const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${ts};`
  const computedHash = crypto
    .createHmac('sha256', webhookSecret)
    .update(manifest)
    .digest('hex')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(hash),
      Buffer.from(computedHash)
    )
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  try {
    if (process.env.NODE_ENV === 'production' && !process.env.MERCADOPAGO_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'MERCADOPAGO_WEBHOOK_SECRET requerido en producción' },
        { status: 503 }
      )
    }

    const rateLimitResponse = await rateLimit(request, 'webhook', 30, '1 m')
    if (rateLimitResponse) return rateLimitResponse

    const rawBody = await request.text()
    const body = JSON.parse(rawBody)

    const paymentId = body?.data?.id ? String(body.data.id) : ''

    // Verificar firma si está configurada (usando el id del recurso)
    if (process.env.MERCADOPAGO_WEBHOOK_SECRET && !verificarFirma(request, paymentId)) {
      return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
    }

    // Mercado Pago envía notificaciones de tipo "payment"
    if (body.type === 'payment') {
      if (!paymentId) {
        return NextResponse.json({ error: 'ID de pago no encontrado' }, { status: 400 })
      }

      // Obtener información del pago desde Mercado Pago (doble verificación)
      const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN

      if (!accessToken) {
        return NextResponse.json({ error: 'Configuración faltante' }, { status: 500 })
      }

      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        return NextResponse.json({ error: 'Error al obtener pago' }, { status: 500 })
      }

      const payment = await response.json()

      // Verificar si el pago fue aprobado
      if (payment.status === 'approved') {
        // Extraer tramiteId y concepto del external_reference
        const externalReference = payment.external_reference
        if (!externalReference) {
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
          // No hay pago PENDIENTE que coincida: probablemente ya fue procesado
          // (reintento de MP) o la referencia no corresponde. Confirmamos recepción
          // para que Mercado Pago no reintente en bucle.
          return NextResponse.json({ received: true })
        }

        // CRÍTICO: validar que el monto y la moneda realmente pagados coincidan con
        // lo esperado. Sin esto, un pago real por un monto mínimo aprobaría el cobro.
        const montoPagado = Number(payment.transaction_amount)
        const monedaPagada = payment.currency_id
        const montoCoincide = Number.isFinite(montoPagado) && Math.abs(montoPagado - pago.monto) <= 0.01
        const monedaCoincide = monedaPagada === pago.moneda

        if (!montoCoincide || !monedaCoincide) {
          // Posible manipulación: no aprobamos y alertamos a los administradores.
          const admins = await prisma.user.findMany({ where: { rol: 'ADMIN' }, select: { id: true } })
          await prisma.notificacion.createMany({
            data: admins.map(admin => ({
              userId: admin.id,
              tramiteId: tramiteId,
              tipo: 'ALERTA' as const,
              titulo: '⚠️ Pago con monto inconsistente',
              mensaje: `Se recibió un pago de ${monedaPagada} ${montoPagado} que NO coincide con lo esperado (${pago.moneda} ${pago.monto}) para el trámite #${tramiteId.substring(0, 8)}. Revisar manualmente.`,
            })),
          })
          return NextResponse.json({ error: 'Monto del pago no coincide' }, { status: 400 })
        }

        // Aprobar de forma idempotente: solo actualiza si sigue PENDIENTE.
        // Si otro reintento de MP ya lo aprobó, count será 0 y no duplicamos notificaciones.
        const resultado = await prisma.pago.updateMany({
          where: { id: pago.id, estado: 'PENDIENTE' },
          data: {
            estado: 'APROBADO',
            mercadoPagoPaymentId: paymentId,
            fechaPago: new Date(),
          },
        })

        if (resultado.count === 0) {
          return NextResponse.json({ received: true })
        }

        // Texto amigable para las notificaciones (el concepto es un enum interno)
        const conceptoTexto = concepto?.startsWith('HONORARIOS')
          ? 'Honorarios Profesionales'
          : 'tu pago'

        await registerPartnerConversion({
          userId: pago.userId,
          montoCobrado: pago.monto,
          metodoPago: 'MERCADO_PAGO',
          sourceType: 'PAGO',
          sourceId: pago.id,
          pagoId: pago.id,
        })

        // Notificar al usuario
        if (pago.tramite) {
          await prisma.notificacion.create({
            data: {
              userId: pago.tramite.userId,
              tramiteId: tramiteId,
              tipo: 'EXITO',
              titulo: 'Pago de Honorarios Confirmado',
              mensaje: `Hemos recibido ${conceptoTexto} por $${pago.monto.toLocaleString('es-AR')}.`
            }
          })
        }

        // Notificar a los admins
        const admins = await prisma.user.findMany({
          where: { rol: 'ADMIN' }
        })

        await Promise.all(admins.map(admin =>
          prisma.notificacion.create({
            data: {
              userId: admin.id,
              tramiteId: tramiteId,
              tipo: 'EXITO',
              titulo: 'Pago de Honorarios Recibido',
              mensaje: `El cliente pagó ${conceptoTexto} por $${pago.monto.toLocaleString('es-AR')} (Trámite #${tramiteId.substring(0, 8)}).`
            }
          })
        ))
      }
    }

    return NextResponse.json({ success: true })

  } catch {
    return NextResponse.json(
      { error: 'Error procesando webhook' },
      { status: 500 }
    )
  }
}
