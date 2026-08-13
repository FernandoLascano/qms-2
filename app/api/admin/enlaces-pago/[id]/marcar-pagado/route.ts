import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { registerPartnerConversion } from '@/lib/partners'
import { etapaPorConcepto, marcarEtapaPagada } from '@/lib/tramites-etapas'

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

    // Actualizar enlace
    const enlace = await prisma.enlacePago.update({
      where: { id },
      data: {
        estado: 'PAGADO',
        fechaPago: new Date(),
        reportadoVencido: false
      },
      include: {
        tramite: true
      }
    })

    // Notificar al usuario
    if (enlace.tramite) {
      await registerPartnerConversion({
        userId: enlace.tramite.userId,
        montoCobrado: enlace.monto,
        metodoPago: 'TRANSFERENCIA',
        sourceType: 'ENLACE_PAGO',
        sourceId: enlace.id,
      })

      // Si el pago corresponde a una etapa (tasa final, depósito, honorarios), marcarla.
      // Esa etapa dispara su propio email; para no duplicar, solo mandamos la notificación
      // genérica "Pago Confirmado" cuando el concepto no mueve una etapa (ej: tasa de reserva).
      const etapa = etapaPorConcepto(enlace.concepto)
      const etapaMarcada = etapa ? await marcarEtapaPagada(enlace.tramiteId, etapa) : false

      if (!etapaMarcada) {
        await prisma.notificacion.create({
          data: {
            userId: enlace.tramite.userId,
            tramiteId: enlace.tramiteId,
            tipo: 'EXITO',
            titulo: 'Pago Confirmado',
            mensaje: `Hemos confirmado tu pago de ${enlace.concepto} por $${enlace.monto.toLocaleString('es-AR')}.`
          }
        })
      }
    }

    return NextResponse.json({ success: true })

  } catch {
    return NextResponse.json(
      { error: 'Error al marcar como pagado' },
      { status: 500 }
    )
  }
}

