import { prisma } from '@/lib/prisma'
import { ipDesdeHeaders } from '@/lib/rate-limit'
import { enSegundoPlano } from '@/lib/en-segundo-plano'

export type AccionSeguridad = 'REGISTRO' | 'REGISTRO_GOOGLE' | 'BORRADOR_CREADO' | 'TRAMITE_ENVIADO'

/**
 * Deja registro de IP, navegador y ubicación aproximada (headers de Vercel).
 * Corre después de responder y nunca rompe el request.
 */
export function registrarEventoSeguridad(
  headers: Headers,
  accion: AccionSeguridad,
  datos: { userId?: string | null; tramiteId?: string | null; email?: string | null }
) {
  const ip = ipDesdeHeaders(headers)
  const ciudad = headers.get('x-vercel-ip-city')
  const evento = {
    accion,
    userId: datos.userId ?? null,
    tramiteId: datos.tramiteId ?? null,
    email: datos.email ?? null,
    ip: ip === '127.0.0.1' ? null : ip,
    userAgent: headers.get('user-agent')?.slice(0, 500) ?? null,
    pais: headers.get('x-vercel-ip-country'),
    ciudad: ciudad ? decodeURIComponent(ciudad) : null,
  }
  enSegundoPlano(`seguridad:${accion}`, () => prisma.eventoSeguridad.create({ data: evento }))
}
