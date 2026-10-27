import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { consultarYAvisar, personasAConsultar } from '@/lib/bcra'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * Seguimiento mensual en la Central de Deudores del BCRA de los clientes con
 * domicilio en sede activo. Corre todos los días pero sólo consulta a quien
 * lleva 28 días o más sin una consulta que haya salido bien (el BCRA actualiza
 * una vez por mes): si el BCRA estaba caído, se reintenta al día siguiente.
 *
 * El aviso sale apenas se consulta cada trámite y sólo si empeora la
 * sociedad: si la función se corta por tiempo, no se pierde ninguno.
 */

const DIAS_ENTRE_CONSULTAS = 28
/** Margen para cortar antes de los 300 s de la función. */
const PRESUPUESTO_MS = 220_000

function autorizado(request: Request) {
  const token = (request.headers.get('authorization') || '').replace('Bearer ', '')
  const secreto = process.env.CRON_SECRET
  if (!secreto || !token) return false
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(secreto))
  } catch {
    return false
  }
}

export async function GET(request: Request) {
  if (!autorizado(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const inicio = Date.now()

  const activos = await prisma.domicilioSede.findMany({
    where: { estado: 'ACTIVO' },
    select: {
      tramiteId: true,
      tramite: {
        select: {
          cuit: true,
          denominacionAprobada: true,
          denominacionSocial1: true,
          socios: true,
          administradores: true,
          consultasBcra: { where: { error: null }, select: { consultadoEl: true }, orderBy: { consultadoEl: 'desc' }, take: 1 },
        },
      },
    },
  })

  const limite = Date.now() - DIAS_ENTRE_CONSULTAS * 86_400_000
  const vencidos = activos
    // Sin ningún CUIT válido no hay nada que consultar: no ocupa lugar en la cola.
    .filter((a) => personasAConsultar(a.tramite).length > 0)
    .map((a) => ({ tramiteId: a.tramiteId, ultima: a.tramite.consultasBcra[0]?.consultadoEl ?? null }))
    .filter((a) => !a.ultima || a.ultima.getTime() < limite)
    // Los que nunca se consultaron, primero; después los más viejos.
    .sort((a, b) => (a.ultima?.getTime() ?? 0) - (b.ultima?.getTime() ?? 0))

  let consultados = 0
  let avisos = 0
  const errores: string[] = []
  for (const v of vencidos) {
    if (Date.now() - inicio > PRESUPUESTO_MS) break
    try {
      const r = await consultarYAvisar(v.tramiteId)
      consultados++
      if (r.aviso) avisos++
    } catch {
      errores.push(v.tramiteId)
    }
  }

  return NextResponse.json({ consultados, quedan: vencidos.length - consultados - errores.length, avisos, errores })
}
