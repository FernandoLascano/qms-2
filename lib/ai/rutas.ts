/** Piezas comunes de las rutas de IA: permisos, límite de uso, carga del trámite y errores. */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { Prisma } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit, rateLimitLong } from '@/lib/rate-limit'
import { ErrorIA } from './anthropic'
import type { TramiteParaIA } from './contexto-tramite'

/** Sesión de admin con cupo disponible, o la respuesta de error para devolver. */
export async function adminConIA(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.rol !== 'ADMIN') {
    return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  }
  const limite =
    (await rateLimit(request, 'ia_admin', 20, '1 m', session.user.id)) ??
    (await rateLimitLong(request, 'ia_admin_diario', 300, '1 d', session.user.id))
  if (limite) return { error: limite }
  return { session }
}

export async function cargarTramiteParaIA(where: Prisma.TramiteWhereInput): Promise<TramiteParaIA | null> {
  const tramite = await prisma.tramite.findFirst({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      pagos: { orderBy: { createdAt: 'desc' } },
      enlacesPago: { orderBy: { createdAt: 'desc' } },
      documentos: { orderBy: { createdAt: 'desc' } },
      cuentasBancarias: true,
    },
  })
  if (!tramite) return null
  // Sólo las del dueño del trámite: los avisos a los admins llevan el mismo tramiteId
  const notificaciones = await prisma.notificacion.findMany({
    where: { tramiteId: tramite.id, userId: tramite.userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })
  const { pagos, enlacesPago, documentos, cuentasBancarias, ...resto } = tramite
  return { tramite: resto, pagos, enlacesPago, documentos, cuentasBancarias, notificaciones }
}

export function respuestaErrorIA(error: unknown, etiqueta: string) {
  if (error instanceof ErrorIA) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  console.error(`[ia] ${etiqueta}`, error)
  return NextResponse.json({ error: 'No se pudo completar el pedido a la IA.' }, { status: 500 })
}
