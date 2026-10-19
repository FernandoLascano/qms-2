import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

// El admin da de baja un enlace que ya no sirve (venció o se reemplazó por
// otro): deja de aparecerle al cliente para pagar y subir el comprobante.
export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await params
  const { count } = await prisma.enlacePago.updateMany({
    where: { id, estado: 'PENDIENTE' },
    data: { estado: 'VENCIDO' },
  })
  if (count === 0) {
    return NextResponse.json(
      { error: 'Sólo se puede marcar vencido un enlace pendiente de pago.' },
      { status: 409 },
    )
  }
  return NextResponse.json({ success: true })
}
