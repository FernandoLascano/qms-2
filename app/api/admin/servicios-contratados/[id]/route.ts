import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { diaParaGuardar, renovar, sumarPeriodo, type Modalidad } from '@/lib/cartera'

interface RouteParams {
  params: Promise<{ id: string }>
}

const DIA = /^\d{4}-\d{2}-\d{2}$/

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  return session?.user?.id && session.user.rol === 'ADMIN'
}

/**
 * PATCH - Cambios sobre un servicio contratado.
 *  · accion 'activar'  → el interesado lo contrató: arranca hoy y vence en un período.
 *  · accion 'renovar'  → un período más (desde el vencimiento, o desde hoy si ya venció).
 *  · accion 'finalizar'
 *  · o campos sueltos: monto, fechaInicio, proximoVencimiento, notas.
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { id } = await params
    const body = await request.json()

    const actual = await prisma.servicioContratado.findUnique({ where: { id }, include: { servicio: true } })
    if (!actual) return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
    const modalidad = actual.servicio.modalidad as Modalidad

    const data: Record<string, unknown> = {}

    if (body.accion === 'activar') {
      const inicio = new Date()
      data.estado = 'ACTIVO'
      data.fechaInicio = inicio
      data.proximoVencimiento = sumarPeriodo(inicio, modalidad)
      if (actual.monto == null && actual.servicio.precioDesde != null) data.monto = actual.servicio.precioDesde
    } else if (body.accion === 'renovar') {
      const nuevo = renovar(actual.proximoVencimiento, modalidad)
      if (!nuevo) return NextResponse.json({ error: 'Este servicio no se renueva' }, { status: 400 })
      data.proximoVencimiento = nuevo
    } else if (body.accion === 'finalizar') {
      data.estado = 'FINALIZADO'
      data.proximoVencimiento = null
    }

    if (body.monto !== undefined) {
      const monto = body.monto === '' || body.monto === null ? null : Number(body.monto)
      if (monto !== null && (!Number.isFinite(monto) || monto < 0)) {
        return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })
      }
      data.monto = monto
    }
    for (const campo of ['fechaInicio', 'proximoVencimiento'] as const) {
      if (body[campo] === undefined) continue
      if (body[campo] === null || body[campo] === '') data[campo] = null
      else if (DIA.test(body[campo])) data[campo] = diaParaGuardar(body[campo])
      else return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 })
    }
    if (body.notas !== undefined) {
      data.notas = typeof body.notas === 'string' && body.notas.trim() ? body.notas.trim().slice(0, 2000) : null
    }

    if (Object.keys(data).length === 0) return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 })

    const actualizado = await prisma.servicioContratado.update({ where: { id }, data })
    return NextResponse.json(actualizado)
  } catch (error) {
    console.error('Error al actualizar el servicio:', error)
    return NextResponse.json({ error: 'No se pudo actualizar' }, { status: 500 })
  }
}

// DELETE - Quita un servicio cargado por error. Para uno que terminó, usar «finalizar».
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { id } = await params
    await prisma.servicioContratado.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'No se pudo eliminar' }, { status: 500 })
  }
}
