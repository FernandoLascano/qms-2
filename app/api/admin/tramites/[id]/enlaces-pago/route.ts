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
    const { concepto, enlace, monto, fechaVencimiento } = await request.json()

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

    // Crear enlace de pago
    await prisma.enlacePago.create({
      data: {
        tramiteId: id,
        concepto: concepto,
        enlace: enlace,
        monto: parseFloat(monto),
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
        estado: 'PENDIENTE'
      }
    })

    // Notificar al usuario
    const conceptoTexto = concepto === 'TASA_RESERVA_NOMBRE' 
      ? 'Tasa de Reserva de Nombre'
      : concepto === 'TASA_RETRIBUTIVA'
      ? 'Tasa Retributiva'
      : concepto

    await prisma.notificacion.create({
      data: {
        userId: tramite.userId,
        tramiteId: id,
        tipo: 'ACCION_REQUERIDA',
        titulo: 'Enlace de Pago Disponible',
        mensaje: `Debes abonar ${conceptoTexto} por $${parseFloat(monto).toLocaleString('es-AR')}. Ingresa a tu panel para ver el enlace de pago.${fechaVencimiento ? ` Vence el ${new Date(fechaVencimiento).toLocaleDateString('es-AR')}.` : ''}`,
        link: `/dashboard/tramites/${id}#enlaces-pago`
      }
    })

    // Obtener datos del usuario para enviar email
    const usuario = await prisma.user.findUnique({
      where: { id: tramite.userId }
    })

    if (usuario) {
      try {
        await enviarEmailPagoPendiente(
          usuario.email,
          usuario.name,
          conceptoTexto,
          parseFloat(monto),
          id
        )
      } catch (emailError) {
        console.error("Error al enviar email de pago pendiente (no crítico):", emailError)
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error al enviar enlace:', error)
    return NextResponse.json(
      { error: 'Error al enviar enlace' },
      { status: 500 }
    )
  }
}

