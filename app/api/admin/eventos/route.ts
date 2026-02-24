import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    const where: any = {}
    
    if (fechaInicio && fechaFin) {
      where.fechaInicio = {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin)
      }
    }

    const eventos = await prisma.evento.findMany({
      where,
      include: {
        tramite: {
          select: {
            id: true,
            denominacionSocial1: true,
            denominacionAprobada: true,
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

