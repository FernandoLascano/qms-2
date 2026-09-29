import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { diaParaGuardar, sumarPeriodo, type Modalidad } from '@/lib/cartera'

interface RouteParams {
  params: Promise<{ id: string }>
}

const ESTADOS = ['INTERESADO', 'ACTIVO', 'FINALIZADO'] as const
const DIA = /^\d{4}-\d{2}-\d{2}$/

// POST - Agrega un servicio a la cartera de una sociedad (o lo anota como interés).
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const { id: tramiteId } = await params
    const body = await request.json()

    const [tramite, servicio] = await Promise.all([
      prisma.tramite.findUnique({ where: { id: tramiteId }, select: { id: true } }),
      prisma.servicioCatalogo.findUnique({ where: { id: String(body.servicioId || '') } }),
    ])
    if (!tramite) return NextResponse.json({ error: 'Sociedad no encontrada' }, { status: 404 })
    if (!servicio) return NextResponse.json({ error: 'Elegí un servicio' }, { status: 400 })
    if (servicio.slug === 'domicilio-sede') {
      return NextResponse.json({ error: 'El domicilio en sede se gestiona en Domicilios' }, { status: 400 })
    }

    const estado = ESTADOS.includes(body.estado) ? body.estado : 'ACTIVO'
    const monto = body.monto === '' || body.monto == null ? null : Number(body.monto)
    if (monto !== null && (!Number.isFinite(monto) || monto < 0)) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })
    }
    if (body.fechaInicio && !DIA.test(body.fechaInicio)) {
      return NextResponse.json({ error: 'Fecha de inicio inválida' }, { status: 400 })
    }

    const fechaInicio = body.fechaInicio ? diaParaGuardar(body.fechaInicio) : estado === 'ACTIVO' ? new Date() : null
    // Si no se indica, el primer vencimiento es un período después del inicio.
    const proximoVencimiento = body.proximoVencimiento && DIA.test(body.proximoVencimiento)
      ? diaParaGuardar(body.proximoVencimiento)
      : estado === 'ACTIVO' && fechaInicio
        ? sumarPeriodo(fechaInicio, servicio.modalidad as Modalidad)
        : null

    const creado = await prisma.servicioContratado.create({
      data: {
        tramiteId,
        servicioId: servicio.id,
        estado,
        monto: monto ?? servicio.precioDesde ?? null,
        fechaInicio,
        proximoVencimiento,
        notas: typeof body.notas === 'string' && body.notas.trim() ? body.notas.trim().slice(0, 2000) : null,
      },
    })
    return NextResponse.json(creado, { status: 201 })
  } catch (error) {
    console.error('Error al agregar el servicio:', error)
    return NextResponse.json({ error: 'No se pudo agregar el servicio' }, { status: 500 })
  }
}
