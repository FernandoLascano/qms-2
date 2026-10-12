import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { rateLimit, rateLimitLong } from '@/lib/rate-limit'
import { cargarTramiteParaIA, respuestaErrorIA } from '@/lib/ai/rutas'
import { responderAsistenteTramite } from '@/lib/ai/tramite'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface RouteParams {
  params: Promise<{ id: string }>
}

// Asistente del cliente con el estado de SU trámite. Sólo responde: no cambia nada.
export async function POST(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const limite =
    (await rateLimit(request, 'asistente_tramite', 15, '1 m', session.user.id)) ??
    (await rateLimitLong(request, 'asistente_tramite_diario', 100, '1 d', session.user.id))
  if (limite) return limite

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const messages = (Array.isArray(body?.messages) ? body.messages : [])
    .filter(
      (m: { role?: string; content?: unknown }) =>
        (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string' && m.content.trim(),
    )
    .slice(-10)
    .map((m: { role: 'user' | 'assistant'; content: string }) => ({
      role: m.role,
      content: m.content.slice(0, 2000),
    }))

  // La conversación que se manda al modelo tiene que arrancar con el cliente.
  while (messages.length > 0 && messages[0].role !== 'user') messages.shift()
  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    return NextResponse.json({ error: 'Escribí tu consulta.' }, { status: 400 })
  }

  try {
    // Siempre por dueño: acá un admin tampoco ve trámites ajenos.
    const datos = await cargarTramiteParaIA({ id, userId: session.user.id })
    if (!datos) return NextResponse.json({ error: 'Trámite no encontrado' }, { status: 404 })

    return NextResponse.json({ message: await responderAsistenteTramite(datos, messages) })
  } catch (error) {
    return respuestaErrorIA(error, `tramites/${id}/asistente`)
  }
}
