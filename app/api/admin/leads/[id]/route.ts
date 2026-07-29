import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

const ESTADOS_VALIDOS = ['NUEVO', 'CONTACTADO', 'EN_CONVERSACION', 'CONVERTIDO', 'DESCARTADO'] as const

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
      select: { id: true, formularioCompleto: true }
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })
    }

    if (lead.formularioCompleto) {
      return NextResponse.json(
        { error: 'Este trámite ya fue enviado, gestionalo desde Trámites' },
        { status: 400 }
      )
    }

    const data: Record<string, unknown> = {}

    if (body.leadEstado !== undefined) {
      if (!ESTADOS_VALIDOS.includes(body.leadEstado)) {
        return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
      }
      data.leadEstado = body.leadEstado
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
      select: { id: true, leadEstado: true, leadProximoContacto: true, leadUltimoContacto: true }
    })

    return NextResponse.json({ success: true, lead: actualizado })
  } catch (error) {
    console.error('Error al actualizar lead:', error)
    return NextResponse.json({ error: 'Error al actualizar el lead' }, { status: 500 })
  }
}
