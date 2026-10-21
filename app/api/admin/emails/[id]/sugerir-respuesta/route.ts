import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminConIA, cargarTramiteParaIA, respuestaErrorIA } from '@/lib/ai/rutas'
import { sugerirRespuesta } from '@/lib/ai/tramite'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

interface RouteParams {
  params: Promise<{ id: string }>
}

const textoPlano = (html: string) =>
  html
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>|<\/p>|<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*/g, '\n\n')
    .trim()

const cuerpo = (email: { bodyText: string | null; bodyHtml: string | null }) =>
  (email.bodyText?.trim() || textoPlano(email.bodyHtml ?? '')).slice(0, 6000)

// Borrador de respuesta a un mail entrante. El admin lo edita y lo envía.
export async function POST(request: Request, { params }: RouteParams) {
  const acceso = await adminConIA(request)
  if (acceso.error) return acceso.error

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const indicacion = typeof body?.indicacion === 'string' ? body.indicacion.slice(0, 2000) : null

  try {
    const email = await prisma.email.findUnique({
      where: { id },
      include: { parentEmail: { select: { direction: true, bodyText: true, bodyHtml: true } } },
    })
    if (!email) return NextResponse.json({ error: 'Email no encontrado' }, { status: 404 })
    if (email.direction !== 'INBOUND') {
      return NextResponse.json({ error: 'Sólo se sugieren respuestas a mails recibidos.' }, { status: 400 })
    }

    // El mail puede no tener trámite asociado: se busca el más reciente del remitente.
    const remitente = (email.replyTo || email.from).toLowerCase()
    const datos = await cargarTramiteParaIA(
      email.tramiteId
        ? { id: email.tramiteId }
        : { user: { email: remitente }, formularioCompleto: true },
    )

    const partes: string[] = []
    if (email.parentEmail) {
      const quien = email.parentEmail.direction === 'INBOUND' ? 'Cliente' : 'QMS'
      partes.push(`${quien} (mensaje anterior):\n${cuerpo(email.parentEmail)}`)
    }
    partes.push(`Cliente — asunto «${email.subject}»:\n${cuerpo(email)}`)

    const texto = await sugerirRespuesta({
      canal: 'email',
      datos,
      conversacion: partes.join('\n\n'),
      nombreCliente: email.fromName?.split(' ')[0] ?? null,
      firma: acceso.session.user.name ?? null,
      indicacion,
    })

    return NextResponse.json({ texto, conTramite: Boolean(datos) })
  } catch (error) {
    return respuestaErrorIA(error, `emails/${id}/sugerir-respuesta`)
  }
}
