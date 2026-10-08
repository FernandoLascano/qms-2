import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { runHealthChecks, type HealthReport } from '@/lib/health/checks'

// Nunca cachear: es un chequeo en vivo.
export const dynamic = 'force-dynamic'
export const maxDuration = 20

// Si llegan dos pedidos juntos (dos pestañas, un doble montaje), comparten el
// mismo chequeo en vez de abrir dos veces cada conexión a SMTP, GA4, etc.
let chequeoEnCurso: Promise<HealthReport> | null = null

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (!chequeoEnCurso) {
    chequeoEnCurso = runHealthChecks().finally(() => {
      chequeoEnCurso = null
    })
  }
  const report = await chequeoEnCurso
  return NextResponse.json(report, { headers: { 'Cache-Control': 'no-store' } })
}
