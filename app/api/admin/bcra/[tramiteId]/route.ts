import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { consultarTramite, ultimasConsultas, personasAConsultar } from '@/lib/bcra'
import { prisma } from '@/lib/prisma'

export const maxDuration = 120

interface RouteParams {
  params: Promise<{ tramiteId: string }>
}

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  return session && session.user.rol === 'ADMIN' ? session : null
}

async function informe(tramiteId: string) {
  const [tramite, ultimas] = await Promise.all([
    prisma.tramite.findUnique({
      where: { id: tramiteId },
      select: { cuit: true, denominacionAprobada: true, denominacionSocial1: true, socios: true, administradores: true },
    }),
    ultimasConsultas([tramiteId]),
  ])
  if (!tramite) return null
  return {
    denominacion: tramite.denominacionAprobada || tramite.denominacionSocial1,
    // Cuántas personas tienen un CUIT válido para consultar (antes de la primera consulta).
    aConsultar: personasAConsultar(tramite).length,
    personas: ultimas.get(tramiteId) ?? [],
  }
}

// GET - Último informe del BCRA de cada persona del trámite
export async function GET(_request: Request, { params }: RouteParams) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { tramiteId } = await params
  const datos = await informe(tramiteId)
  if (!datos) return NextResponse.json({ error: 'Trámite no encontrado' }, { status: 404 })
  return NextResponse.json(datos)
}

// POST - Consultar ahora (antes de aceptar a un cliente, o para actualizar)
export async function POST(_request: Request, { params }: RouteParams) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { tramiteId } = await params
  try {
    await consultarTramite(tramiteId)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'No se pudo consultar el BCRA' }, { status: 502 })
  }
  return NextResponse.json(await informe(tramiteId))
}
