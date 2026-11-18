import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { conversorPdfConfigurado } from '@/lib/pdf'
import { ipDesdeHeaders } from '@/lib/rate-limit'
import { uploadToSupabase } from '@/lib/supabase-storage'
import { enSegundoPlano } from '@/lib/en-segundo-plano'
import { sinTipoSocietario, type DatosContrato } from '@/lib/contrato-domicilio'
import {
  evento,
  faltantesParaFirmar,
  finalizarFirma,
  firmantesCliente,
  guardarVersion,
  imagenFirma,
  listaEventos,
  pdfParaFirmar,
  sha256,
  type Firma,
} from '@/lib/contrato-domicilio-firma'

// Generar el PDF puede despertar al conversor (Gotenberg), que tarda.
export const maxDuration = 60

interface RouteParams {
  params: Promise<{ id: string }>
}

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  return session?.user?.id && session.user.rol === 'ADMIN' ? session : null
}

/** La última solicitud de firma del trámite, para la ficha. */
async function resumen(tramiteId: string) {
  const s = await prisma.contratoDomicilioFirma.findFirst({
    where: { tramiteId },
    orderBy: { createdAt: 'desc' },
    include: { contratoVersion: { select: { version: true, datos: true } } },
  })
  if (!s) return null
  const prestador = s.firmaPrestador as unknown as Firma
  const cliente = (s.firmasCliente ?? []) as unknown as Firma[]
  return {
    id: s.id,
    estado: s.estado,
    version: s.contratoVersion.version,
    enviadoPor: s.enviadoPor,
    createdAt: s.createdAt.toISOString(),
    firmantes: firmantesCliente(s.contratoVersion.datos as DatosContrato).map(({ nombre, roles }) => ({ nombre, roles })),
    prestador: { nombre: prestador.nombre, fecha: prestador.fecha },
    cliente: cliente.map((f) => ({ nombre: f.nombre, roles: f.roles, fecha: f.fecha })),
    eventos: listaEventos(s.eventos),
    firmadoId: s.firmadoId,
  }
}

// GET - Estado de la firma electrónica del contrato
export async function GET(_request: Request, { params }: RouteParams) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const { id } = await params
  return NextResponse.json({ firma: await resumen(id), pdfDisponible: conversorPdfConfigurado() })
}

// POST - Firma por EL PRESTADOR y envía el contrato al cliente para que lo firme
// desde su panel. Si había una solicitud esperando al cliente, queda anulada.
// Body: { datos: DatosContrato, firma: { imagen: dataURL PNG, modo } }
export async function POST(request: Request, { params }: RouteParams) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const { id } = await params
  if (!conversorPdfConfigurado()) {
    return NextResponse.json({ error: 'El conversor a PDF no está configurado en este entorno.' }, { status: 501 })
  }

  const body = (await request.json().catch(() => null)) as {
    datos?: DatosContrato
    firma?: { imagen?: string; modo?: string }
  } | null
  const datos = body?.datos
  if (!datos) {
    return NextResponse.json({ error: 'Faltan los datos del contrato' }, { status: 400 })
  }
  const faltan = faltantesParaFirmar(datos)
  if (faltan.length) {
    return NextResponse.json({ error: `Para mandarlo a firmar falta: ${faltan.join(', ')}.` }, { status: 400 })
  }
  const imagen = imagenFirma(body?.firma?.imagen)
  if (!imagen) {
    return NextResponse.json({ error: 'Falta tu firma' }, { status: 400 })
  }

  const tramite = await prisma.tramite.findUnique({
    where: { id },
    select: { id: true, denominacionAprobada: true, denominacionSocial1: true, user: { select: { email: true, name: true } } },
  })
  if (!tramite) {
    return NextResponse.json({ error: 'Trámite no encontrado' }, { status: 404 })
  }
  const enCurso = await prisma.contratoDomicilioFirma.findFirst({
    where: { tramiteId: id, estado: 'PROCESANDO' },
    select: { id: true },
  })
  if (enCurso) {
    return NextResponse.json({ error: 'El cliente ya firmó y se está armando el PDF. Esperá a que termine.' }, { status: 409 })
  }

  const ip = ipDesdeHeaders(request.headers)
  const prestador: Firma = {
    roles: ['PRESTADOR'],
    nombre: datos.prestador_representante.trim(),
    dni: datos.prestador_dni.trim(),
    imagen,
    modo: body?.firma?.modo === 'escrita' ? 'escrita' : 'dibujada',
    fecha: new Date().toISOString(),
    ip,
    navegador: (request.headers.get('user-agent') || '').slice(0, 300),
    verificacion: `Sesión de administrador en QuieroMiSAS (${session.user.name || session.user.email})`,
  }

  let pdf: Buffer
  try {
    pdf = await pdfParaFirmar(datos, prestador)
  } catch (e) {
    console.error('No se pudo generar el contrato para firmar:', e)
    return NextResponse.json({ error: 'No se pudo generar el PDF del contrato. Probá de nuevo.' }, { status: 502 })
  }
  const subido = await uploadToSupabase(pdf, `contratos-domicilio/${id}/para-firmar`, 'contrato-para-firmar.pdf', 'application/pdf')
  if (!subido) {
    return NextResponse.json({ error: 'No se pudo guardar el PDF. Probá de nuevo.' }, { status: 500 })
  }

  const version = await guardarVersion(id, datos, 'pdf', session.user.name ?? null)
  const pdfHash = sha256(pdf)
  const [, creada] = await prisma.$transaction([
    prisma.contratoDomicilioFirma.updateMany({ where: { tramiteId: id, estado: 'PENDIENTE' }, data: { estado: 'ANULADA' } }),
    prisma.contratoDomicilioFirma.create({
      data: {
        tramiteId: id,
        contratoVersionId: version.id,
        pdfPath: subido.path,
        pdfHash,
        firmaPrestador: prestador as unknown as Prisma.InputJsonValue,
        enviadoPor: session.user.name ?? null,
        eventos: [
          evento(`Firmado por EL PRESTADOR (${prestador.nombre}) y enviado al cliente`, {
            detalle: `versión ${version.version} · SHA-256 ${pdfHash}`,
            ip,
          }),
        ] as unknown as Prisma.InputJsonValue,
      },
    }),
  ])

  const nombreSociedad = tramite.denominacionAprobada || tramite.denominacionSocial1 || sinTipoSocietario(datos.sociedad_denominacion)
  enSegundoPlano('firma-contrato-envio', async () => {
    const { enviarEmailNotificacion } = await import('@/lib/emails/send')
    await enviarEmailNotificacion(
      tramite.user.email,
      tramite.user.name || '',
      'Tenés el contrato de domicilio para firmar',
      `Ya está listo el contrato de servicio de domicilio de ${nombreSociedad}. Lo podés leer y firmar desde tu trámite: completás el Anexo I, te mandamos un código por email y firmás en la pantalla.`,
      id,
      { tono: 'accion', cta: { texto: 'Firmar el contrato', ancla: 'contrato-domicilio' } },
    )
  })

  return NextResponse.json({ firma: await resumen(id), creada: creada.id }, { status: 201 })
}

// PATCH - { accion: 'anular' } deja sin efecto la solicitud pendiente;
// { accion: 'reintentar' } vuelve a armar el PDF final si falló.
export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const { id } = await params
  const { accion } = ((await request.json().catch(() => null)) ?? {}) as { accion?: string }

  const s = await prisma.contratoDomicilioFirma.findFirst({ where: { tramiteId: id }, orderBy: { createdAt: 'desc' } })
  if (!s) {
    return NextResponse.json({ error: 'No hay contrato enviado a firmar' }, { status: 404 })
  }

  if (accion === 'anular') {
    if (s.estado !== 'PENDIENTE') {
      return NextResponse.json({ error: 'Sólo se puede anular mientras espera la firma del cliente' }, { status: 409 })
    }
    await prisma.contratoDomicilioFirma.update({
      where: { id: s.id },
      data: {
        estado: 'ANULADA',
        codigoHash: null,
        eventos: [...listaEventos(s.eventos), evento(`Anulado por ${session.user.name || 'un administrador'}`)] as unknown as Prisma.InputJsonValue,
      },
    })
  } else if (accion === 'reintentar') {
    if (s.estado !== 'PROCESANDO') {
      return NextResponse.json({ error: 'No hay nada para reintentar' }, { status: 409 })
    }
    try {
      await finalizarFirma(s.id)
    } catch (e) {
      console.error('Reintento de contrato firmado falló:', e)
      return NextResponse.json({ error: 'No se pudo armar el PDF final. Probá de nuevo en un rato.' }, { status: 502 })
    }
  } else {
    return NextResponse.json({ error: 'Acción desconocida' }, { status: 400 })
  }
  return NextResponse.json({ firma: await resumen(id) })
}
