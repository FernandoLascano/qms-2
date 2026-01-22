import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const body = await request.json()
    const {
      denominacionSocial1,
      denominacionSocial2,
      denominacionSocial3,
      objetoSocial,
      domicilioLegal,
      capitalSocial
    } = body

    // Validaciones
    if (!denominacionSocial1 || !denominacionSocial1.trim()) {
      return NextResponse.json(
        { error: 'La denominación 1 es obligatoria' },
        { status: 400 }
      )
    }

    if (!objetoSocial || !objetoSocial.trim()) {
      return NextResponse.json(
        { error: 'El objeto social es obligatorio' },
        { status: 400 }
      )
    }

    if (!domicilioLegal || !domicilioLegal.trim()) {
      return NextResponse.json(
        { error: 'El domicilio legal es obligatorio' },
        { status: 400 }
      )
    }

    if (!capitalSocial || isNaN(capitalSocial) || capitalSocial <= 0) {
      return NextResponse.json(
        { error: 'El capital social debe ser un número válido mayor a 0' },
        { status: 400 }
      )
    }

    // Verificar que el trámite existe
    const tramite = await prisma.tramite.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!tramite) {
      return NextResponse.json(
        { error: 'Trámite no encontrado' },
        { status: 404 }
      )
    }

    // Actualizar el trámite
    await prisma.tramite.update({
      where: { id },
      data: {
        denominacionSocial1: denominacionSocial1.trim(),
        denominacionSocial2: denominacionSocial2?.trim() || null,
        denominacionSocial3: denominacionSocial3?.trim() || null,
        objetoSocial: objetoSocial.trim(),
        domicilioLegal: domicilioLegal.trim(),
        capitalSocial: parseFloat(String(capitalSocial))
      }
    })

    // Crear notificación para el cliente informando del cambio
    await prisma.notificacion.create({
      data: {
        userId: tramite.userId,
        tramiteId: id,
        tipo: 'INFO',
        titulo: 'Información del Formulario Actualizada',
        mensaje: 'El administrador ha actualizado información de tu formulario. Revisa los cambios en tu panel.',
        link: `/dashboard/tramites/${id}`
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al editar formulario:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la información del formulario' },
      { status: 500 }
    )
  }
}


