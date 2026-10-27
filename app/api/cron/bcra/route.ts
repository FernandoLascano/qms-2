import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { consultarTramite, SITUACIONES, type Empeoro } from '@/lib/bcra'
import { enviarAlertaBcra } from '@/lib/emails/send'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * Seguimiento mensual en la Central de Deudores del BCRA de los clientes con
 * domicilio en sede activo. Corre todos los días pero sólo consulta a quien
 * lleva 28 días o más sin consultar (el BCRA actualiza una vez por mes), y de
 * a tandas, para no pasarse del tiempo de la función.
 * Si alguien empeoró, manda un solo mail a cada admin con todos los casos.
 */

const DIAS_ENTRE_CONSULTAS = 28
const POR_CORRIDA = 15

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

  const activos = await prisma.domicilioSede.findMany({
    where: { estado: 'ACTIVO' },
    select: {
      tramiteId: true,
      tramite: {
        select: {
          denominacionAprobada: true,
          denominacionSocial1: true,
          consultasBcra: { select: { consultadoEl: true }, orderBy: { consultadoEl: 'desc' }, take: 1 },
        },
      },
    },
  })

  const limite = Date.now() - DIAS_ENTRE_CONSULTAS * 86_400_000
  const vencidos = activos
    .map((a) => ({ ...a, ultima: a.tramite.consultasBcra[0]?.consultadoEl ?? null }))
    .filter((a) => !a.ultima || a.ultima.getTime() < limite)
    // Los que nunca se consultaron, primero; después los más viejos.
    .sort((a, b) => (a.ultima?.getTime() ?? 0) - (b.ultima?.getTime() ?? 0))
  const pendientes = vencidos.slice(0, POR_CORRIDA)

  const alertas: { denominacion: string; tramiteId: string; personas: Empeoro[] }[] = []
  const errores: string[] = []
  for (const p of pendientes) {
    try {
      const { empeoraron } = await consultarTramite(p.tramiteId)
      if (empeoraron.length > 0) {
        alertas.push({ denominacion: p.tramite.denominacionAprobada || p.tramite.denominacionSocial1, tramiteId: p.tramiteId, personas: empeoraron })
      }
    } catch {
      errores.push(p.tramiteId)
    }
  }

  if (alertas.length > 0) {
    const admins = await prisma.user.findMany({ where: { rol: 'ADMIN' }, select: { email: true, name: true } })
    const paraMail = alertas.map((a) => ({
      ...a,
      personas: a.personas.map((x) => ({
        nombre: x.nombre,
        rol: x.rol,
        nivel: x.ahora === 'RIESGO' ? ('RIESGO' as const) : ('ATENCION' as const),
        situacion: x.peorSituacion > 1 ? `Situación ${x.peorSituacion} · ${SITUACIONES[x.peorSituacion]}` : '',
        chequesNuevos: x.chequesNuevos,
      })),
    }))
    await Promise.all(admins.map((a) => enviarAlertaBcra(a.email, a.name || '', paraMail).catch(() => {})))
  }

  return NextResponse.json({ consultados: pendientes.length, quedan: vencidos.length - pendientes.length, alertas: alertas.length, errores })
}
