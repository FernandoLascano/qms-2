import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** Contador ligero para badge en sidebar (solo admin). */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const unreadCount = await prisma.email.count({
      where: { status: 'UNREAD', direction: 'INBOUND' },
    })

    return NextResponse.json({ unreadCount })
  } catch {
    return NextResponse.json({ unreadCount: 0 }, { status: 200 })
  }
}
