import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.rol !== 'ADMIN') return null
  return session
}

function masUnAnio(desde: Date): Date {
  const d = new Date(desde)
  d.setFullYear(d.getFullYear() + 1)
  return d
}

// PUT - Acciones sobre el servicio: activar | renovar | pagar | cancelar | editar
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const { id } = await params
    const body = await request.json()
    const accion = body.accion as string

    const actual = await prisma.domicilioSede.findUnique({ where: { id } })
    if (!actual) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
    }

    const config = await prisma.config.findFirst()
    const data: any = {}

    if (accion === 'activar') {
      const inicio = body.fechaInicio ? new Date(body.fechaInicio) : new Date()
      const monto = body.montoAnual != null ? Number(body.montoAnual) : config?.domicilioSedePrecioAnual ?? 0
      data.estado = 'ACTIVO'
      data.fechaInicio = inicio
      data.fechaVencimiento = masUnAnio(inicio)
      data.montoAnual = monto
      data.ultimoCobro = inicio
      if (body.notas !== undefined) data.notas = body.notas ? String(body.notas).trim() : null

      // Cierra el círculo: el domicilio legal del trámite pasa a ser la sede.
      if (config?.domicilioSedeDireccion) {
        await prisma.tramite.update({
          where: { id: actual.tramiteId },
          data: { domicilioLegal: config.domicilioSedeDireccion },
        }).catch(() => {})
      }
    } else if (accion === 'renovar') {
      const base = actual.fechaVencimiento && actual.fechaVencimiento > new Date() ? actual.fechaVencimiento : new Date()
      data.estado = 'ACTIVO'
      data.fechaVencimiento = masUnAnio(base)
      data.ultimoCobro = new Date()
    } else if (accion === 'pagar') {
      data.ultimoCobro = new Date()
    } else if (accion === 'cancelar') {
      data.estado = 'CANCELADO'
    } else if (accion === 'editar') {
      if (body.montoAnual !== undefined) data.montoAnual = body.montoAnual != null ? Number(body.montoAnual) : null
      if (body.fechaVencimiento !== undefined) data.fechaVencimiento = body.fechaVencimiento ? new Date(body.fechaVencimiento) : null
      if (body.notas !== undefined) data.notas = body.notas ? String(body.notas).trim() : null
      if (body.estado !== undefined && ['PENDIENTE_CONTACTO', 'ACTIVO', 'CANCELADO'].includes(body.estado)) data.estado = body.estado
    } else {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
    }

    const actualizado = await prisma.domicilioSede.update({ where: { id }, data })
    return NextResponse.json(actualizado)
  } catch {
    return NextResponse.json({ error: 'Error al actualizar el servicio' }, { status: 500 })
  }
}

// DELETE - Elimina el registro (p. ej. creado por error)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const { id } = await params
    await prisma.domicilioSede.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
