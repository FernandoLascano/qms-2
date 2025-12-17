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
    
    if (!session?.user?.id) {
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
        reportadoVencido: true,
        estado: 'VENCIDO'
      },
      include: {
        tramite: true
      }
    })

    // Verificar que el usuario sea dueño del trámite
    if (enlace.tramite.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Notificar a los admins (buscar usuarios admin)
    const admins = await prisma.user.findMany({
      where: { rol: 'ADMIN' }
    })

    for (const admin of admins) {
      await prisma.notificacion.create({
        data: {
          userId: admin.id,
          tramiteId: enlace.tramiteId,
          tipo: 'ALERTA',
          titulo: '⚠️ Enlace de Pago Reportado como Vencido',
          mensaje: `El cliente reportó que el enlace de ${enlace.concepto} está vencido. Genera y envía uno nuevo.`
        }
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error al reportar enlace vencido:', error)
    return NextResponse.json(
      { error: 'Error al reportar enlace vencido' },
      { status: 500 }
    )
  }
}

