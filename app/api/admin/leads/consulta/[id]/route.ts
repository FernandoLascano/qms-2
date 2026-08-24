import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Estado y seguimiento de un lead que todavía no es un trámite.
 *
 * Es el gemelo de /api/admin/leads/[id], que trabaja sobre `Tramite`. Los dos
 * viven separados porque son dos tablas distintas y unificarlas habría exigido
 * tocar `LeadSeguimiento`, que ya funciona sobre trámites: no vale el riesgo
 * sobre una base en producción para ahorrar un archivo.
 */

interface RouteParams {
  params: Promise<{ id: string }>
}

const ESTADOS_VALIDOS = [
  'NUEVO',
  'CONTACTADO',
  'EN_CONVERSACION',
  'ESPERANDO_CLIENTE',
  'CONVERTIDO',
  'DESCARTADO',
] as const

const MOTIVOS_VALIDOS = [
  'NO_ENTENDIO',
  'SIN_DOMICILIO',
  'NO_DEFINIO',
  'PRECIO',
  'LO_HIZO_OTRO',
  'NO_CONTESTA',
  'OTRO',
] as const

const CANALES_VALIDOS = ['LLAMADA', 'WHATSAPP', 'EMAIL', 'OTRO'] as const

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const lead = await prisma.lead.findUnique({ where: { id }, select: { id: true } })
    if (!lead) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })

    const data: Record<string, unknown> = {}

    if (body.leadEstado !== undefined) {
      if (!ESTADOS_VALIDOS.includes(body.leadEstado)) {
        return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
      }
      data.estado = body.leadEstado

      if (body.leadEstado === 'DESCARTADO') {
        if (!MOTIVOS_VALIDOS.includes(body.leadMotivoPerdida)) {
          return NextResponse.json({ error: 'Elegí por qué se perdió el lead' }, { status: 400 })
        }
        data.motivoPerdida = body.leadMotivoPerdida
        data.motivoNota =
          typeof body.leadMotivoNota === 'string' && body.leadMotivoNota.trim()
            ? body.leadMotivoNota.trim().slice(0, 2000)
            : null
      } else {
        data.motivoPerdida = null
        data.motivoNota = null
      }

      if (body.leadEstado === 'CONVERTIDO') data.ganadoAt = new Date()
    }

    if (body.leadProximoContacto !== undefined) {
      if (!body.leadProximoContacto) {
        data.proximoContacto = null
      } else {
        const fecha = new Date(body.leadProximoContacto)
        if (isNaN(fecha.getTime())) {
          return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 })
        }
        data.proximoContacto = fecha
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 })
    }

    const actualizado = await prisma.lead.update({
      where: { id },
      data,
      select: { id: true, estado: true, motivoPerdida: true, proximoContacto: true },
    })

    return NextResponse.json({ success: true, lead: actualizado })
  } catch (error) {
    console.error('Error al actualizar la consulta:', error)
    return NextResponse.json({ error: 'Error al actualizar el lead' }, { status: 500 })
  }
}

/** Registra un contacto y, de paso, mueve el estado si todavía estaba en NUEVO. */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    if (!CANALES_VALIDOS.includes(body.canal)) {
      return NextResponse.json({ error: 'Canal inválido' }, { status: 400 })
    }
    const nota = typeof body.nota === 'string' ? body.nota.trim() : ''
    if (!nota) {
      return NextResponse.json({ error: 'Escribí qué pasó en el contacto' }, { status: 400 })
    }

    const lead = await prisma.lead.findUnique({ where: { id }, select: { estado: true } })
    if (!lead) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })

    let proximoContacto: Date | null = null
    if (body.leadProximoContacto) {
      const fecha = new Date(body.leadProximoContacto)
      if (isNaN(fecha.getTime())) {
        return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 })
      }
      proximoContacto = fecha
    }

    await prisma.$transaction([
      prisma.leadContacto.create({
        data: {
          leadId: id,
          adminId: session.user.id,
          canal: body.canal,
          nota: nota.slice(0, 5000),
        },
      }),
      prisma.lead.update({
        where: { id },
        data: {
          ultimoContacto: new Date(),
          proximoContacto,
          // Registrar un contacto sobre un lead nuevo lo saca de «nuevo» solo:
          // si se lo tocó, ya está contactado.
          estado: lead.estado === 'NUEVO' ? 'CONTACTADO' : lead.estado,
        },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al registrar el contacto:', error)
    return NextResponse.json({ error: 'Error al registrar el contacto' }, { status: 500 })
  }
}
