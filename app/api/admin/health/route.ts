import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { runHealthChecks } from '@/lib/health/checks'

// Nunca cachear: es un chequeo en vivo.
export const dynamic = 'force-dynamic'
export const maxDuration = 20

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const report = await runHealthChecks()
  return NextResponse.json(report, { headers: { 'Cache-Control': 'no-store' } })
}
