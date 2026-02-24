import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { enviarEmailDocumentoRechazado } from '@/lib/emails/send'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const { observaciones } = await request.json()

    // Actualizar documento
    const documento = await prisma.documento.update({
      where: { id },
      data: {
        estado: 'RECHAZADO',
        observaciones: observaciones
      }
    })

    // Si es un comprobante de pago, actualizar el enlace de pago relacionado
    // para que el cliente pueda volver a subir un comprobante
    const esComprobante = documento.tipo === 'COMPROBANTE_DEPOSITO' || documento.nombre.includes('Comprobante')

    if (esComprobante) {
      // Buscar el enlace de pago en estado PROCESANDO para este trámite
      const enlacePago = await prisma.enlacePago.findFirst({
        where: {
          tramiteId: documento.tramiteId,
          estado: 'PROCESANDO'
        },
        orderBy: {
          fechaPago: 'desc' // El más reciente
        }
      })

      if (enlacePago) {
        // Volver el enlace a estado PENDIENTE para que el cliente pueda subir otro comprobante
        await prisma.enlacePago.update({
          where: { id: enlacePago.id },
          data: {
            estado: 'PENDIENTE',
            fechaPago: null
          }
        })
      }
    }

    // Notificar al usuario con link específico a la sección de pagos si es comprobante
    const linkNotificacion = esComprobante
      ? `/dashboard/tramites/${documento.tramiteId}#enlaces-pago`
      : `/dashboard/tramites/${documento.tramiteId}`

    await prisma.notificacion.create({
      data: {
        userId: documento.userId,
        tramiteId: documento.tramiteId,
        tipo: 'ALERTA',
        titulo: 'Documento rechazado',
        mensaje: `Tu documento "${documento.nombre}" ha sido rechazado. Motivo: ${observaciones}`,
        link: linkNotificacion
      }
    })

    // Enviar email al usuario
    const usuario = await prisma.user.findUnique({
      where: { id: documento.userId }
    })

    if (usuario) {
      try {
        await enviarEmailDocumentoRechazado(
          usuario.email,
          usuario.name,
          documento.nombre,
          observaciones,
          documento.tramiteId
        )
      } catch {
        // Non-critical: email sending failed
      }
    }

    return NextResponse.json({ success: true })

  } catch {
    return NextResponse.json(
      { error: 'Error al rechazar documento' },
      { status: 500 }
    )
  }
}

