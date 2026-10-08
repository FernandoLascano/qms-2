import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

// GET - Obtener todos los eventos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')
    const incluirCerrados = searchParams.get('incluirCerrados') === '1'

    const where: Prisma.EventoWhereInput = {}
    const condiciones: Prisma.EventoWhereInput[] = []

    if (fechaInicio && fechaFin) {
      const desde = new Date(fechaInicio)
      const hasta = new Date(fechaFin)
      // Un evento entra si se superpone con el rango visible: empieza antes de
      // que termine el rango y termina (o empieza, si no tiene fin) después
      // de que arranca.
      condiciones.push({
        fechaInicio: { lte: hasta },
        OR: [
          { fechaFin: { gte: desde } },
          { fechaFin: null, fechaInicio: { gte: desde } }
        ]
      })
    }

    // Los eventos automáticos de un trámite dejan de tener sentido cuando el
    // hito ya pasó: el vencimiento de la reserva no importa una vez ingresado
    // el trámite, y la fecha límite estimada no importa una vez inscripta la
    // sociedad (o cerrado el trámite). Se ocultan, no se borran.
    if (!incluirCerrados) {
      const cerrado: Prisma.TramiteWhereInput = {
        OR: [
          { estadoGeneral: { in: ['COMPLETADO', 'CANCELADO'] } },
          { sociedadInscripta: true }
        ]
      }
      condiciones.push({
        NOT: {
          tipo: 'VENCIMIENTO_DENOMINACION',
          tramite: { is: { OR: [cerrado, { tramiteIngresado: true }] } }
        }
      })
      condiciones.push({
        NOT: {
          tipo: 'FECHA_LIMITE_TRAMITE',
          tramite: { is: cerrado }
        }
      })
    }

    if (condiciones.length > 0) where.AND = condiciones

    const eventos = await prisma.evento.findMany({
      where,
      include: {
        tramite: {
          select: {
            id: true,
            denominacionSocial1: true,
            denominacionAprobada: true,
            estadoGeneral: true,
            sociedadInscripta: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        cliente: {
          select: {
            name: true,
            email: true
          }
        },
        admin: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        fechaInicio: 'asc'
      }
    })

    return NextResponse.json({ eventos })

  } catch {
    return NextResponse.json(
      { error: 'Error al obtener eventos' },
      { status: 500 }
    )
  }
}

// POST - Crear un nuevo evento
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const data = await request.json()
    const {
      tramiteId,
      titulo,
      descripcion,
      tipo,
      fechaInicio,
      fechaFin,
      relacionadoCon,
      clienteId,
      ubicacion,
      linkReunion
    } = data

    const evento = await prisma.evento.create({
      data: {
        tramiteId: tramiteId || null,
        titulo,
        descripcion: descripcion || null,
        tipo,
        fechaInicio: new Date(fechaInicio),
        fechaFin: fechaFin ? new Date(fechaFin) : null,
        relacionadoCon: relacionadoCon || null,
        clienteId: clienteId || null,
        adminId: session.user.id,
        ubicacion: ubicacion || null,
        linkReunion: linkReunion || null
      },
      include: {
        tramite: {
          select: {
            id: true,
            denominacionSocial1: true,
            denominacionAprobada: true
          }
        },
        cliente: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ evento, success: true })

  } catch {
    return NextResponse.json(
      { error: 'Error al crear evento' },
      { status: 500 }
    )
  }
}

