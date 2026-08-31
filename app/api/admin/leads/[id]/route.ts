import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface RouteParams {
  params: Promise<{
    id: string
  }>
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

// PATCH - Actualizar el estado de seguimiento de un lead
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const lead = await prisma.tramite.findUnique({
      where: { id },
      select: { id: true }
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}

    if (body.leadEstado !== undefined) {
      if (!ESTADOS_VALIDOS.includes(body.leadEstado)) {
        return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
      }
      data.leadEstado = body.leadEstado

      // Perder sin motivo deja el dato inservible: después no hay nada que
      // mirar para saber qué arreglar.
      if (body.leadEstado === 'DESCARTADO') {
        if (!MOTIVOS_VALIDOS.includes(body.leadMotivoPerdida)) {
          return NextResponse.json(
            { error: 'Elegí por qué se perdió el lead' },
            { status: 400 },
          )
        }
        data.leadMotivoPerdida = body.leadMotivoPerdida
        data.leadMotivoNota =
          typeof body.leadMotivoNota === 'string' && body.leadMotivoNota.trim()
            ? body.leadMotivoNota.trim().slice(0, 2000)
            : null
      }

      // Volver a abrir un lead limpia el motivo: si sigue en juego, no está
      // perdido por nada.
      if (body.leadEstado !== 'DESCARTADO') {
        data.leadMotivoPerdida = null
        data.leadMotivoNota = null
      }
    }

    if (body.leadProximoContacto !== undefined) {
      if (body.leadProximoContacto === null || body.leadProximoContacto === '') {
        data.leadProximoContacto = null
      } else {
        const fecha = new Date(body.leadProximoContacto)
        if (isNaN(fecha.getTime())) {
          return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 })
        }
        data.leadProximoContacto = fecha
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 })
    }

    const actualizado = await prisma.tramite.update({
      where: { id },
      data,
      select: { id: true, leadEstado: true, leadMotivoPerdida: true, leadProximoContacto: true, leadUltimoContacto: true }
    })

    return NextResponse.json({ success: true, lead: actualizado })
  } catch (error) {
    console.error('Error al actualizar lead:', error)
    return NextResponse.json({ error: 'Error al actualizar el lead' }, { status: 500 })
  }
}
