import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const maxDuration = 5 // Timeout de 5 segundos máximo (operación rápida)

// PATCH - Marcar mensajes como leídos
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const isAdmin = session.user.rol === 'ADMIN'

    // Marcar como leídos los mensajes que NO son del usuario actual
    await prisma.mensaje.updateMany({
      where: {
        tramiteId: id,
        leido: false,
        esAdmin: !isAdmin // Si soy admin, marco los del cliente. Si soy cliente, marco los del admin
      },
      data: {
        leido: true
      }
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Error al marcar mensajes como leídos' },
      { status: 500 }
    )
  }
}

