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
    const { estado } = await request.json()

    // Validar que el estado sea un valor válido del enum
    const estadosValidos = [
      'INICIADO',
      'EN_PROCESO',
      'ESPERANDO_CLIENTE',
      'ESPERANDO_APROBACION',
      'COMPLETADO',
      'CANCELADO',
    ]
    if (!estado || !estadosValidos.includes(estado)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }

    // Leer el estado ANTERIOR antes de actualizar (de lo contrario el historial
    // registraría estadoAnterior === estadoNuevo).
    const tramiteActual = await prisma.tramite.findUnique({
      where: { id },
      select: { estadoGeneral: true },
    })

    if (!tramiteActual) {
      return NextResponse.json({ error: 'Trámite no encontrado' }, { status: 404 })
    }

    const estadoAnterior = tramiteActual.estadoGeneral

    // Actualizar estado
    const tramite = await prisma.tramite.update({
      where: { id },
      data: {
        estadoGeneral: estado
      }
    })

    // Crear registro en historial
    await prisma.historialEstado.create({
      data: {
        tramiteId: id,
        estadoAnterior,
        estadoNuevo: estado,
        descripcion: `Estado cambiado por administrador`
      }
    })

    // Notificar al usuario
    await prisma.notificacion.create({
      data: {
        userId: tramite.userId,
        tramiteId: id,
        tipo: 'INFO',
        titulo: 'Estado del trámite actualizado',
        mensaje: `El estado de tu trámite ha sido actualizado a: ${estado}`
      }
    })

    return NextResponse.json({ success: true })

  } catch {
    return NextResponse.json(
      { error: 'Error al actualizar estado' },
      { status: 500 }
    )
  }
}

