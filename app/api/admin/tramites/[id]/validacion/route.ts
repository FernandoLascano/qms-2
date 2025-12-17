import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { enviarEmailValidacionTramite } from '@/lib/emails/send'

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
    const { accion, observaciones } = await request.json()

    if (!accion || !['VALIDADO', 'REQUIERE_CORRECCIONES'].includes(accion)) {
      return NextResponse.json(
        { error: 'Acción inválida' },
        { status: 400 }
      )
    }

    // Obtener el trámite
    const tramite = await prisma.tramite.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!tramite) {
      return NextResponse.json(
        { error: 'Trámite no encontrado' },
        { status: 404 }
      )
    }

    // Preparar datos de actualización
    const updateData: any = {
      estadoValidacion: accion as 'VALIDADO' | 'REQUIERE_CORRECCIONES',
      observacionesValidacion: observaciones || null
    }

    // Si se valida, cambiar estado general a EN_PROCESO solo si no está ya completado
    if (accion === 'VALIDADO' && tramite.estadoGeneral !== 'COMPLETADO') {
      updateData.estadoGeneral = 'EN_PROCESO'
    }

    // Actualizar estado de validación
    const tramiteActualizado = await prisma.tramite.update({
      where: { id },
      data: updateData
    })

    // Crear notificación para el usuario
    await prisma.notificacion.create({
      data: {
        userId: tramite.userId,
        tramiteId: id,
        tipo: accion === 'VALIDADO' ? 'EXITO' : 'ALERTA',
        titulo: accion === 'VALIDADO' 
          ? 'Trámite validado exitosamente' 
          : 'Trámite requiere correcciones',
        mensaje: accion === 'VALIDADO'
          ? `Tu trámite "${tramite.denominacionSocial1}" ha sido validado por nuestro equipo. Procederemos con el siguiente paso del proceso.`
          : `Tu trámite "${tramite.denominacionSocial1}" requiere algunas correcciones.${observaciones ? `\n\nObservaciones: ${observaciones}` : ''}`,
        link: `/dashboard/tramites/${id}`
      }
    })

    // Enviar email al usuario
    await enviarEmailValidacionTramite(
      tramite.user.email,
      tramite.user.name,
      tramite.denominacionSocial1,
      accion === 'VALIDADO',
      observaciones || undefined,
      id
    )

    // Crear historial de estado
    await prisma.historialEstado.create({
      data: {
        tramiteId: id,
        estadoAnterior: tramite.estadoGeneral,
        estadoNuevo: tramiteActualizado.estadoGeneral,
        descripcion: accion === 'VALIDADO' 
          ? 'Trámite validado por administrador'
          : `Trámite requiere correcciones: ${observaciones || 'Sin observaciones'}`
      }
    })

    return NextResponse.json({ 
      success: true,
      tramite: tramiteActualizado
    })

  } catch (error) {
    console.error('Error al actualizar validación:', error)
    console.error('Error completo:', JSON.stringify(error, null, 2))
    
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }

    const message =
      error instanceof Error ? error.message : 'Error desconocido al actualizar validación'

    return NextResponse.json(
      { 
        error: 'Error al actualizar validación', 
        details: message,
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

