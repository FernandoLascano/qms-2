import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ipDesdeHeaders, rateLimit } from '@/lib/rate-limit'
import { enSegundoPlano } from '@/lib/en-segundo-plano'
import type { DatosContrato } from '@/lib/contrato-domicilio'
import {
  anexoValido,
  CODIGO_INTENTOS,
  evento,
  finalizarFirma,
  firmantesCliente,
  hashCodigo,
  imagenFirma,
  listaEventos,
  type Firma,
} from '@/lib/contrato-domicilio-firma'

// Al firmar se arma el PDF final en segundo plano (Gotenberg puede tardar).
export const maxDuration = 60

interface RouteParams {
  params: Promise<{ id: string }>
}

/** La solicitud vigente (la última no anulada) de un trámite del cliente. */
async function solicitudDelCliente(tramiteId: string, userId: string) {
  return prisma.contratoDomicilioFirma.findFirst({
    where: { tramiteId, estado: { not: 'ANULADA' }, tramite: { userId } },
    orderBy: { createdAt: 'desc' },
    include: {
      contratoVersion: { select: { datos: true } },
      firmado: { select: { fechaFirma: true } },
      tramite: { select: { user: { select: { email: true } } } },
    },
  })
}

// GET - Contrato de domicilio para firmar (o ya firmado) del trámite
export async function GET(_request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const { id } = await params
  const s = await solicitudDelCliente(id, session.user.id)
  if (!s) return NextResponse.json({ firma: null })

  const prestador = s.firmaPrestador as unknown as Firma
  return NextResponse.json({
    firma: {
      estado: s.estado,
      firmantes: firmantesCliente(s.contratoVersion.datos as DatosContrato).map(({ clave, nombre, dni, roles }) => ({
        clave,
        nombre,
        dni,
        roles,
      })),
      prestador: prestador.nombre,
      email: s.tramite.user.email,
      codigoEnviado: !!s.codigoHash && !!s.codigoVence && s.codigoVence > new Date(),
      firmadoEl: s.firmado?.fechaFirma.toISOString() ?? null,
    },
  })
}

// POST - El cliente firma. Body: { codigo, consentimiento, anexo, firmas: { sociedad, coobligado? } }
// con cada firma como { imagen: dataURL PNG, modo: 'dibujada' | 'escrita' }.
export async function POST(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const limitado = await rateLimit(request, 'firma-contrato', 10, '10 m', session.user.id)
  if (limitado) return limitado

  const { id } = await params
  const s = await solicitudDelCliente(id, session.user.id)
  if (!s || s.estado !== 'PENDIENTE') {
    return NextResponse.json({ error: 'No hay un contrato esperando tu firma' }, { status: 404 })
  }

  const body = ((await request.json().catch(() => null)) ?? {}) as {
    codigo?: string
    consentimiento?: boolean
    anexo?: unknown
    firmas?: Record<string, { imagen?: string; modo?: string } | undefined>
  }
  if (body.consentimiento !== true) {
    return NextResponse.json({ error: 'Para firmar tenés que aceptar la firma electrónica.' }, { status: 400 })
  }
  const anexo = anexoValido(body.anexo)
  if (!anexo) {
    return NextResponse.json({ error: 'Completá el Anexo I (declaración jurada).' }, { status: 400 })
  }

  const ip = ipDesdeHeaders(request.headers)
  const navegador = (request.headers.get('user-agent') || '').slice(0, 300)
  const email = s.tramite.user.email
  const firmantes = firmantesCliente(s.contratoVersion.datos as DatosContrato)
  const firmas: Firma[] = []
  for (const f of firmantes) {
    const imagen = imagenFirma(body.firmas?.[f.clave]?.imagen)
    if (!imagen) {
      return NextResponse.json({ error: `Falta la firma de ${f.nombre}.` }, { status: 400 })
    }
    firmas.push({
      roles: f.roles,
      nombre: f.nombre,
      dni: f.dni,
      imagen,
      modo: body.firmas?.[f.clave]?.modo === 'escrita' ? 'escrita' : 'dibujada',
      fecha: new Date().toISOString(),
      ip,
      navegador,
      verificacion: `Cuenta de QuieroMiSAS (${email}) y código de un solo uso enviado a ese email`,
    })
  }

  // Código por email: vigente, con intentos disponibles y correcto.
  const eventos = listaEventos(s.eventos)
  if (!s.codigoHash || !s.codigoVence || s.codigoVence < new Date() || s.codigoIntentos >= CODIGO_INTENTOS) {
    return NextResponse.json({ error: 'El código venció. Pedí uno nuevo.' }, { status: 400 })
  }
  if (hashCodigo(s.id, String(body.codigo ?? '')) !== s.codigoHash) {
    await prisma.contratoDomicilioFirma.update({
      where: { id: s.id },
      data: {
        codigoIntentos: { increment: 1 },
        eventos: [...eventos, evento('Código incorrecto', { ip })] as unknown as Prisma.InputJsonValue,
      },
    })
    const quedan = CODIGO_INTENTOS - s.codigoIntentos - 1
    return NextResponse.json(
      { error: quedan > 0 ? `El código no coincide. Te quedan ${quedan} intentos.` : 'El código no coincide. Pedí uno nuevo.' },
      { status: 400 },
    )
  }

  // Sólo pasa si sigue PENDIENTE: dos envíos a la vez no firman dos veces.
  const { count } = await prisma.contratoDomicilioFirma.updateMany({
    where: { id: s.id, estado: 'PENDIENTE' },
    data: {
      estado: 'PROCESANDO',
      firmasCliente: firmas as unknown as Prisma.InputJsonValue,
      anexo: anexo as unknown as Prisma.InputJsonValue,
      codigoHash: null,
      eventos: [
        ...eventos,
        evento(`Código verificado (${email})`, { ip }),
        evento('Anexo I completado'),
        ...firmas.map((f) =>
          evento(`Firmado por ${f.roles.includes('SOCIEDAD') ? 'LA SOCIEDAD' : 'EL COOBLIGADO'}${f.roles.length > 1 ? ' y EL COOBLIGADO' : ''} (${f.nombre})`, { ip }),
        ),
      ] as unknown as Prisma.InputJsonValue,
    },
  })
  if (count === 0) {
    return NextResponse.json({ error: 'Este contrato ya se firmó.' }, { status: 409 })
  }

  enSegundoPlano('firma-contrato-final', () => finalizarFirma(s.id))
  return NextResponse.json({ ok: true })
}
