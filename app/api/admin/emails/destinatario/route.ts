import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { datosDelDestinatario } from '@/lib/emails/destinatario'

/**
 * GET ?email=… — nombre y datos del trámite de un destinatario, para que el
 * editor salude por el nombre y rellene las {{variables}} de las plantillas.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const email = (request.nextUrl.searchParams.get('email') || '').trim()
  if (!email) {
    return NextResponse.json({ error: 'Falta el email' }, { status: 400 })
  }

  return NextResponse.json(await datosDelDestinatario(email))
}
