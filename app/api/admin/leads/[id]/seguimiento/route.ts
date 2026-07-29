import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

const CANALES_VALIDOS = ['LLAMADA', 'WHATSAPP', 'EMAIL', 'OTRO'] as const

// POST - Registrar un contacto con el lead
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const nota = typeof body.nota === 'string' ? body.nota.trim() : ''
    if (!nota) {
      return NextResponse.json({ error: 'La nota es obligatoria' }, { status: 400 })
    }

    const canal = CANALES_VALIDOS.includes(body.canal) ? body.canal : 'OTRO'

    const lead = await prisma.tramite.findUnique({
      where: { id },
      select: { id: true, leadEstado: true }
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })
    }

    let proximoContacto: Date | undefined
    if (body.leadProximoContacto) {
      const fecha = new Date(body.leadProximoContacto)
      if (isNaN(fecha.getTime())) {
        return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 })
      }
      proximoContacto = fecha
    }

    const ahora = new Date()

    // El contacto y el estado del lead se actualizan juntos: si quedara a medias,
    // el lead figuraría como contactado sin la nota que explica qué se habló.
    const [seguimiento] = await prisma.$transaction([
      prisma.leadSeguimiento.create({
        data: {
          tramiteId: id,
          adminId: session.user.id,
          canal,
          nota
        },
        include: { admin: { select: { name: true } } }
      }),
      prisma.tramite.update({
        where: { id },
        data: {
          leadUltimoContacto: ahora,
          // Solo avanza NUEVO -> CONTACTADO. Si ya está más adelante (en conversación,
          // convertido, descartado) registrar un contacto no lo hace retroceder.
          ...(lead.leadEstado === 'NUEVO' ? { leadEstado: 'CONTACTADO' as const } : {}),
          ...(proximoContacto ? { leadProximoContacto: proximoContacto } : {})
        }
      })
    ])

    return NextResponse.json({ success: true, seguimiento })
  } catch (error) {
    console.error('Error al registrar seguimiento:', error)
    return NextResponse.json({ error: 'Error al registrar el contacto' }, { status: 500 })
  }
}
