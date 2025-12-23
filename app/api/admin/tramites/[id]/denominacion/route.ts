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
    const { denominacion } = await request.json()

    // Obtener el trámite actual para verificar si es una denominación alternativa
    const tramiteActual = await prisma.tramite.findUnique({
      where: { id },
      select: { denominacion1: true, denominacion2: true, denominacion3: true }
    })

    // Si la denominación no es ninguna de las 3 originales, es una alternativa
    // En ese caso también actualizamos denominacion1 para que se muestre el nombre final
    const esAlternativa = tramiteActual &&
      denominacion !== tramiteActual.denominacion1 &&
      denominacion !== tramiteActual.denominacion2 &&
      denominacion !== tramiteActual.denominacion3

    // Actualizar denominación aprobada (y denominacion1 si es alternativa)
    const tramite = await prisma.tramite.update({
      where: { id },
      data: {
        denominacionAprobada: denominacion,
        // Si es alternativa, actualizar también denominacion1 para mostrar el nombre final
        ...(esAlternativa && { denominacion1: denominacion })
      }
    })

    // Notificar al usuario
    await prisma.notificacion.create({
      data: {
        userId: tramite.userId,
        tramiteId: id,
        tipo: 'INFO',
        titulo: 'Denominación Sugerida',
        mensaje: `Después del examen de homonimia, sugerimos utilizar: "${denominacion}". Te contactaremos para coordinar el pago de la tasa de reserva.`
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error al aprobar denominación:', error)
    return NextResponse.json(
      { error: 'Error al aprobar denominación' },
      { status: 500 }
    )
  }
}

