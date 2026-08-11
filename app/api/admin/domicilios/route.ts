import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Lista de servicios de domicilio en sede + parámetros de config
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const [config, items, disponibles] = await Promise.all([
      prisma.config.findFirst(),
      prisma.domicilioSede.findMany({
        include: {
          tramite: {
            select: {
              id: true,
              denominacionAprobada: true,
              denominacionSocial1: true,
              user: { select: { name: true, email: true } },
            },
          },
        },
        orderBy: [{ fechaVencimiento: 'asc' }, { createdAt: 'desc' }],
      }),
      // Trámites reales sin servicio de domicilio (para cargar uno a mano)
      prisma.tramite.findMany({
        where: { formularioCompleto: true, domicilioSede: { is: null } },
        select: {
          id: true,
          denominacionAprobada: true,
          denominacionSocial1: true,
          sociedadInscripta: true,
          user: { select: { name: true } },
        },
        orderBy: { denominacionSocial1: 'asc' },
      }),
    ])

    return NextResponse.json({
      config: {
        direcciones: config?.domicilioSedeDirecciones ?? [],
        precioAnual: config?.domicilioSedePrecioAnual ?? 0,
        diasAlerta: config?.domicilioSedeDiasAlerta ?? 30,
      },
      items: items.map((i) => ({
        id: i.id,
        estado: i.estado,
        direccion: i.direccion,
        montoAnual: i.montoAnual,
        fechaInicio: i.fechaInicio,
        fechaVencimiento: i.fechaVencimiento,
        ultimoCobro: i.ultimoCobro,
        notas: i.notas,
        createdAt: i.createdAt,
        tramite: {
          id: i.tramite.id,
          denominacion: i.tramite.denominacionAprobada || i.tramite.denominacionSocial1,
          cliente: i.tramite.user?.name || 'Cliente',
          email: i.tramite.user?.email || null,
        },
      })),
      disponibles: disponibles.map((t) => ({
        id: t.id,
        denominacion: t.denominacionAprobada || t.denominacionSocial1,
        cliente: t.user?.name || 'Cliente',
        inscripta: t.sociedadInscripta,
      })),
    })
  } catch {
    return NextResponse.json({ error: 'Error al cargar domicilios' }, { status: 500 })
  }
}

// POST - Cargar manualmente el servicio para una sociedad existente
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const body = await request.json()
    const tramiteId = String(body.tramiteId || '')
    if (!tramiteId) return NextResponse.json({ error: 'Elegí una sociedad' }, { status: 400 })

    const existente = await prisma.domicilioSede.findUnique({ where: { tramiteId } })
    if (existente) return NextResponse.json({ error: 'Esa sociedad ya tiene un servicio cargado' }, { status: 400 })

    const config = await prisma.config.findFirst()
    const inicio = body.fechaInicio ? new Date(body.fechaInicio) : new Date()
    const vencimiento = body.fechaVencimiento
      ? new Date(body.fechaVencimiento)
      : new Date(new Date(inicio).setFullYear(inicio.getFullYear() + 1))
    const monto = body.montoAnual != null ? Number(body.montoAnual) : config?.domicilioSedePrecioAnual ?? 0
    const direccion = body.direccion ? String(body.direccion) : config?.domicilioSedeDirecciones?.[0] ?? null

    const creado = await prisma.domicilioSede.create({
      data: {
        tramiteId,
        estado: 'ACTIVO',
        direccion,
        montoAnual: monto,
        fechaInicio: inicio,
        fechaVencimiento: vencimiento,
        ultimoCobro: inicio,
        notas: body.notas ? String(body.notas).trim() : null,
      },
    })

    // Cierra el círculo: el domicilio legal del trámite pasa a ser la dirección elegida.
    if (direccion) {
      await prisma.tramite.update({
        where: { id: tramiteId },
        data: { domicilioLegal: direccion },
      }).catch(() => {})
    }

    return NextResponse.json(creado, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error al cargar el servicio' }, { status: 500 })
  }
}
