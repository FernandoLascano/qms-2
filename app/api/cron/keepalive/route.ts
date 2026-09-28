import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Latido diario (cron de Vercel) para que Supabase, en el plan gratis, no pause
 * la base tras 7 días sin actividad. El backup diario también escribe en
 * maintenance_runs, así que quedan dos latidos independientes.
 */

const DIAS_RETENCION = 90

function verificarAutorizacion(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || !authHeader) return false
  const token = authHeader.replace('Bearer ', '')
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(cronSecret))
  } catch {
    return false
  }
}

export async function GET(request: Request) {
  if (!verificarAutorizacion(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    await prisma.maintenanceRun.create({ data: { kind: 'keepalive', ok: true } })
    const { count: borrados } = await prisma.maintenanceRun.deleteMany({
      where: {
        kind: 'keepalive',
        createdAt: { lt: new Date(Date.now() - DIAS_RETENCION * 24 * 60 * 60 * 1000) },
      },
    })
    return NextResponse.json({ ok: true, borrados })
  } catch (error) {
    console.error('Error en keepalive:', error)
    return NextResponse.json({ ok: false, error: 'No se pudo registrar el latido' }, { status: 500 })
  }
}
