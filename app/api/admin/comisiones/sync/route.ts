import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sincronizarMovimientos } from '@/lib/comisiones-server'

// POST - Importa a movimientos los pagos de honorarios APROBADOS que aún no lo estén.
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const { creados } = await sincronizarMovimientos()
    return NextResponse.json({ creados })
  } catch {
    return NextResponse.json({ error: 'Error al sincronizar' }, { status: 500 })
  }
}
