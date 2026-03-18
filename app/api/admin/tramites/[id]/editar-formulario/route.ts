import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Verificar que el trámite existe
    const tramite = await prisma.tramite.findUnique({
      where: { id },
      select: { id: true, userId: true }
    })

    if (!tramite) {
      return NextResponse.json({ error: 'Trámite no encontrado' }, { status: 404 })
    }

    // Construir datos de actualización dinámicamente (solo campos enviados)
    const updateData: any = {}

    // Denominaciones
    if (body.denominacionSocial1 !== undefined) {
      if (!body.denominacionSocial1?.trim()) {
        return NextResponse.json({ error: 'La denominación 1 es obligatoria' }, { status: 400 })
      }
      updateData.denominacionSocial1 = body.denominacionSocial1.trim()
    }
    if (body.denominacionSocial2 !== undefined) updateData.denominacionSocial2 = body.denominacionSocial2?.trim() || null
    if (body.denominacionSocial3 !== undefined) updateData.denominacionSocial3 = body.denominacionSocial3?.trim() || null

    // Objeto social
    if (body.objetoSocial !== undefined) {
      if (!body.objetoSocial?.trim()) {
        return NextResponse.json({ error: 'El objeto social es obligatorio' }, { status: 400 })
      }
      updateData.objetoSocial = body.objetoSocial.trim()
    }

    // Domicilio legal
    if (body.domicilioLegal !== undefined) {
      if (!body.domicilioLegal?.trim()) {
        return NextResponse.json({ error: 'El domicilio legal es obligatorio' }, { status: 400 })
      }
      updateData.domicilioLegal = body.domicilioLegal.trim()
    }

    // Capital social
    if (body.capitalSocial !== undefined) {
      const capital = parseFloat(String(body.capitalSocial))
      if (isNaN(capital) || capital <= 0) {
        return NextResponse.json({ error: 'El capital social debe ser mayor a 0' }, { status: 400 })
      }
      updateData.capitalSocial = capital
    }

    // Socios (JSON)
    if (body.socios !== undefined) {
      if (!Array.isArray(body.socios) || body.socios.length === 0) {
        return NextResponse.json({ error: 'Debe haber al menos un socio' }, { status: 400 })
      }
      updateData.socios = body.socios
    }

    // Administradores (JSON)
    if (body.administradores !== undefined) {
      if (!Array.isArray(body.administradores) || body.administradores.length === 0) {
        return NextResponse.json({ error: 'Debe haber al menos un administrador' }, { status: 400 })
      }
      updateData.administradores = body.administradores
    }

    // Datos del usuario (JSON parcial merge)
    if (body.datosUsuario !== undefined) {
      const currentTramite = await prisma.tramite.findUnique({
        where: { id },
        select: { datosUsuario: true }
      })
      const currentDatos = (currentTramite?.datosUsuario as any) || {}
      updateData.datosUsuario = { ...currentDatos, ...body.datosUsuario }
    }

    // Si no hay nada que actualizar
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No se enviaron campos para actualizar' }, { status: 400 })
    }

    // Actualizar
    await prisma.tramite.update({
      where: { id },
      data: updateData
    })

    // Notificar al cliente
    await prisma.notificacion.create({
      data: {
        userId: tramite.userId,
        tramiteId: id,
        tipo: 'INFO',
        titulo: 'Información Actualizada',
        mensaje: 'El equipo de QuieroMiSAS actualizó información de tu trámite.',
        link: `/dashboard/tramites/${id}`
      }
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}
