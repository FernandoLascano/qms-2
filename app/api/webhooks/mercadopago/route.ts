import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// Verificar firma del webhook de Mercado Pago
function verificarFirma(request: Request, rawBody: string): boolean {
  const xSignature = request.headers.get('x-signature')
  const xRequestId = request.headers.get('x-request-id')
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET

  // Si no hay secret configurado, validar el pago contra la API de MP directamente
  if (!webhookSecret) {
    return true // Fallback: se valida abajo consultando la API de MP
  }

  if (!xSignature || !xRequestId) {
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

  // Construir el manifest para verificar
  const manifest = `id:${xRequestId};request-id:${xRequestId};ts:${ts};`
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
    const rawBody = await request.text()
    const body = JSON.parse(rawBody)

    // Verificar firma si está configurada
    if (process.env.MERCADOPAGO_WEBHOOK_SECRET && !verificarFirma(request, rawBody)) {
      console.error('Webhook MP: firma inválida')
      return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
    }

    // Mercado Pago envía notificaciones de tipo "payment"
    if (body.type === 'payment') {
      const paymentId = body.data.id

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
          return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
        }

        // Actualizar el pago
        await prisma.pago.update({
          where: { id: pago.id },
          data: {
            estado: 'APROBADO',
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
              titulo: 'Pago de Honorarios Confirmado',
              mensaje: `Hemos recibido tu pago de ${concepto} por $${pago.monto.toLocaleString('es-AR')}.`
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
              mensaje: `El cliente pagó ${concepto} por $${pago.monto.toLocaleString('es-AR')} (Trámite #${tramiteId.substring(0, 8)}).`
            }
          })
        ))
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
