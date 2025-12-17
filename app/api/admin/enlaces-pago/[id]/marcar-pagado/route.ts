import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error al marcar como pagado:', error)
    return NextResponse.json(
      { error: 'Error al marcar como pagado' },
      { status: 500 }
    )
  }
}

