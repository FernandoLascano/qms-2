import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { estadoContrato, serializarFirmado, type ResumenContrato } from '@/lib/contrato-domicilio-firmado'

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

    // Estado del contrato de cada domicilio. Va aparte y con catch: si la tabla
    // de firmados todavía no existe (migración sin correr), la pantalla sigue
    // andando y sólo se oculta la columna de contrato.
    const tramiteIds = items.map((i) => i.tramiteId)
    const contratos = await Promise.all([
      prisma.contratoDomicilioFirmado.findMany({
        where: { tramiteId: { in: tramiteIds } },
        include: { contratoVersion: { select: { version: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.contratoDomicilioVersion.findMany({
        where: { tramiteId: { in: tramiteIds } },
        select: { tramiteId: true, version: true, createdAt: true },
        orderBy: { version: 'desc' },
      }),
    ]).catch((e) => {
      console.error('No se pudo leer el estado de los contratos de domicilio:', e)
      return null
    })
    // Las listas vienen de la más nueva a la más vieja: la primera de cada trámite es la vigente.
    const firmadoPorTramite = new Map<string, NonNullable<typeof contratos>[0][number]>()
    const versionPorTramite = new Map<string, NonNullable<typeof contratos>[1][number]>()
    for (const f of contratos?.[0] ?? []) if (!firmadoPorTramite.has(f.tramiteId)) firmadoPorTramite.set(f.tramiteId, f)
    for (const v of contratos?.[1] ?? []) if (!versionPorTramite.has(v.tramiteId)) versionPorTramite.set(v.tramiteId, v)

    const resumenContrato = (tramiteId: string): ResumenContrato | null => {
      if (!contratos) return null
      const firmado = firmadoPorTramite.get(tramiteId)
      const version = versionPorTramite.get(tramiteId)
      return {
        estado: estadoContrato(firmado, version),
        firmado: firmado ? serializarFirmado(firmado) : null,
        ultimaVersion: version ? { version: version.version, fecha: version.createdAt.toISOString() } : null,
      }
    }

    return NextResponse.json({
      contratosDisponibles: contratos !== null,
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
        contrato: resumenContrato(i.tramiteId),
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
