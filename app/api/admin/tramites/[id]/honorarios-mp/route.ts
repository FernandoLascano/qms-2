import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { enviarEmailPagoPendiente } from '@/lib/emails/send'

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
    const { concepto, monto, montoTransferencia, datosBancarios } = await request.json()

    // Validar monto
    const montoNumero = parseFloat(monto)
    if (isNaN(montoNumero) || montoNumero <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser un número válido mayor a 0' },
        { status: 400 }
      )
    }

    // Obtener trámite
    const tramite = await prisma.tramite.findUnique({
      where: { id },
      include: {
        user: true
      }
    })

    if (!tramite) {
      return NextResponse.json(
        { error: 'Trámite no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que esté configurado Mercado Pago
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Mercado Pago no está configurado. Contacta al administrador del sistema.' },
        { status: 500 }
      )
    }

    // Crear preferencia de pago en Mercado Pago
    const conceptoTexto = 'Honorarios Profesionales'

    // Verificar que NEXTAUTH_URL esté configurado
    const baseUrl = process.env.NEXTAUTH_URL
    if (!baseUrl) {
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      )
    }

    // Construir URLs de retorno (asegurarse de que sean URLs válidas)
    const successUrl = `${baseUrl}/dashboard/tramites/${id}?payment=success`
    const failureUrl = `${baseUrl}/dashboard/tramites/${id}?payment=failure`
    const pendingUrl = `${baseUrl}/dashboard/tramites/${id}?payment=pending`
    const notificationUrl = `${baseUrl}/api/webhooks/mercadopago`

    // Validar que las URLs sean válidas
    if (!successUrl || !failureUrl || !pendingUrl) {
      console.error('Error construyendo URLs:', { successUrl, failureUrl, pendingUrl })
      return NextResponse.json(
        { error: 'Error construyendo URLs de retorno' },
        { status: 500 }
      )
    }

    // Construir el objeto de preferencia asegurando que back_urls.success esté definido
    const preference: any = {
      items: [
        {
          title: `${conceptoTexto} - Trámite #${tramite.id.substring(0, 8)}`,
          quantity: 1,
          unit_price: montoNumero,
          currency_id: 'ARS'
        }
      ],
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl
      },
      notification_url: notificationUrl,
      external_reference: `${id}|${concepto}`,
      payer: {
        name: tramite.user.name,
        email: tramite.user.email
      }
    }

    // NOTA: Mercado Pago puede rechazar auto_return con URLs localhost
    // Comentamos auto_return temporalmente para evitar el error
    // if (preference.back_urls?.success && preference.back_urls.success.trim() !== '') {
    //   preference.auto_return = 'approved'
    // }
    
    // Alternativa: Solo agregar auto_return si la URL no es localhost
    if (preference.back_urls?.success && 
        preference.back_urls.success.trim() !== '' &&
        !preference.back_urls.success.includes('localhost')) {
      preference.auto_return = 'approved'
    }

    const jsonBody = JSON.stringify(preference)

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: jsonBody
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { error: 'Error al crear preferencia de pago en Mercado Pago' },
        { status: 500 }
      )
    }

    const mpData = await response.json()

    // Determinar el concepto según el plan del trámite
    let conceptoPago: 'HONORARIOS_BASICO' | 'HONORARIOS_EMPRENDEDOR' | 'HONORARIOS_PREMIUM' = 'HONORARIOS_BASICO'
    if (tramite.plan === 'EMPRENDEDOR') {
      conceptoPago = 'HONORARIOS_EMPRENDEDOR'
    } else if (tramite.plan === 'PREMIUM') {
      conceptoPago = 'HONORARIOS_PREMIUM'
    }

    // Crear registro de pago en la base de datos
    await prisma.pago.create({
      data: {
        tramiteId: id,
        userId: tramite.userId,
        concepto: conceptoPago,
        monto: parseFloat(monto),
        estado: 'PENDIENTE',
        metodoPago: 'MERCADO_PAGO',
        mercadoPagoId: mpData.id,
        mercadoPagoLink: mpData.init_point,
        montoTransferencia: montoTransferencia ? parseFloat(montoTransferencia) : null,
        datosBancarios: datosBancarios ? datosBancarios : null
      }
    })

    // Notificar al usuario
    const mensajeNotificacion = montoTransferencia 
      ? `Ya puedes abonar ${conceptoTexto}. Tienes dos opciones:\n- Mercado Pago: $${parseFloat(monto).toLocaleString('es-AR')}\n- Transferencia: $${parseFloat(montoTransferencia).toLocaleString('es-AR')} (precio diferencial)\n\nIngresa a tu panel para ver los detalles.`
      : `Ya puedes abonar ${conceptoTexto} por $${parseFloat(monto).toLocaleString('es-AR')}. Ingresa a tu panel para ver el link de pago de Mercado Pago.`

    await prisma.notificacion.create({
      data: {
        userId: tramite.userId,
        tramiteId: id,
        tipo: 'ACCION_REQUERIDA',
        titulo: 'Link de Pago de Honorarios Disponible',
        mensaje: mensajeNotificacion,
        link: `/dashboard/tramites/${id}#pago-honorarios`
      }
    })

    // Enviar email de pago pendiente (no fallar si hay error)
    if (tramite.user) {
      try {
        await enviarEmailPagoPendiente(
          tramite.user.email,
          tramite.user.name,
          conceptoTexto,
          parseFloat(monto),
          id
        )
      } catch {
        // Email no crítico, continuar silenciosamente
      }
    }

    return NextResponse.json({ 
      success: true,
      link: mpData.init_point 
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Error al generar link de pago' },
      { status: 500 }
    )
  }
}

