import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { renderizarEmail } from '@/lib/emails/send'
import { ipDesdeHeaders, rateLimit } from '@/lib/rate-limit'
import {
  CODIGO_MINUTOS,
  evento,
  generarCodigo,
  hashCodigo,
  listaEventos,
} from '@/lib/contrato-domicilio-firma'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST - Manda al email de la cuenta un código para firmar el contrato.
// El código no queda en el registro de emails: sólo se guarda su hash.
export async function POST(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const limitado = await rateLimit(request, 'firma-contrato-codigo', 3, '10 m', session.user.id)
  if (limitado) return limitado

  const { id } = await params
  const s = await prisma.contratoDomicilioFirma.findFirst({
    where: { tramiteId: id, estado: 'PENDIENTE', tramite: { userId: session.user.id } },
    orderBy: { createdAt: 'desc' },
    include: { tramite: { select: { user: { select: { email: true, name: true } } } } },
  })
  if (!s) {
    return NextResponse.json({ error: 'No hay un contrato esperando tu firma' }, { status: 404 })
  }

  const codigo = generarCodigo()
  const { email, name } = s.tramite.user
  const { html, subject } = await renderizarEmail('emailNotificacion', `Tu código para firmar el contrato: ${codigo}`, {
    nombre: name || '',
    titulo: 'Tu código para firmar el contrato',
    mensaje: `Ingresá este código en QuieroMiSAS para firmar el contrato de domicilio. Vence en ${CODIGO_MINUTOS} minutos. Si no lo pediste vos, no lo compartas con nadie y avisanos.`,
    opciones: { tono: 'accion', destacado: { etiqueta: 'Código', valor: codigo } },
  })
  const enviado = await sendEmail({ to: email, subject, html })
  if (!enviado.success) {
    return NextResponse.json({ error: 'No pudimos mandar el código. Probá de nuevo en un rato.' }, { status: 502 })
  }

  await prisma.contratoDomicilioFirma.update({
    where: { id: s.id },
    data: {
      codigoHash: hashCodigo(s.id, codigo),
      codigoVence: new Date(Date.now() + CODIGO_MINUTOS * 60_000),
      codigoIntentos: 0,
      eventos: [...listaEventos(s.eventos), evento(`Código enviado a ${email}`, { ip: ipDesdeHeaders(request.headers) })] as unknown as Prisma.InputJsonValue,
    },
  })
  return NextResponse.json({ ok: true, email })
}
