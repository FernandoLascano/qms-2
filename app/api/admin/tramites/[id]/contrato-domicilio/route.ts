import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { conversorPdfConfigurado, htmlAPdf } from '@/lib/pdf'
import {
  fechaDDMMAAAA,
  contratoDomicilioHtml,
  generarContratoDomicilio,
  PIE_CONTRATO_HTML,
  precioYCondiciones,
  sinTipoSocietario,
  type DatosContrato,
  type PersonaContrato,
} from '@/lib/contrato-domicilio'

// El conversor a PDF se apaga cuando no se usa: el primer pedido puede tardar.
export const maxDuration = 60

const MIME_DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

interface RouteParams {
  params: Promise<{ id: string }>
}

type PersonaJson = {
  nombre?: string
  apellido?: string
  dni?: string
  domicilio?: string
  ciudad?: string
  provincia?: string
  cargo?: string
}

const lista = (v: unknown): PersonaJson[] => (Array.isArray(v) ? (v as PersonaJson[]) : [])

function nombreCompleto(p: PersonaJson) {
  return [p.nombre, p.apellido].map((s) => (s || '').trim()).filter(Boolean).join(' ')
}

function domicilioCompleto(p: PersonaJson) {
  return [p.domicilio, p.ciudad, p.provincia].map((s) => (s || '').trim()).filter(Boolean).join(', ')
}

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  return session?.user?.id && session.user.rol === 'ADMIN' ? session : null
}

/** Hoy en AAAA-MM-DD según el día argentino (valor por defecto de la fecha de firma). */
function hoyArgentina() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
}

/** JSON con las claves ordenadas, para comparar dos juegos de datos. */
function canonico(d: DatosContrato) {
  return JSON.stringify(Object.fromEntries(Object.entries(d).sort(([a], [b]) => a.localeCompare(b))))
}

/**
 * Guarda los datos del contrato como una versión nueva del trámite. Si son
 * iguales a los de la última (p. ej. se bajó en Word y después en PDF), no
 * crea otra. Devuelve el número de versión.
 */
async function guardarVersion(tramiteId: string, datos: DatosContrato, formato: string, generadoPor: string | null) {
  for (let intento = 0; intento < 3; intento++) {
    const ultima = await prisma.contratoDomicilioVersion.findFirst({
      where: { tramiteId },
      orderBy: { version: 'desc' },
    })
    if (ultima && canonico(ultima.datos as DatosContrato) === canonico(datos)) return ultima.version
    try {
      const nueva = await prisma.contratoDomicilioVersion.create({
        data: { tramiteId, version: (ultima?.version ?? 0) + 1, datos, formato, generadoPor },
      })
      return nueva.version
    } catch (e) {
      // Dos descargas a la vez: la otra se quedó con el número; se reintenta.
      if ((e as { code?: string })?.code !== 'P2002') throw e
    }
  }
  throw new Error('No se pudo guardar la versión del contrato')
}

// GET - Datos precargados para el formulario del contrato
export async function GET(_request: Request, { params }: RouteParams) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const { id } = await params
  const [tramite, config, versiones] = await Promise.all([
    prisma.tramite.findUnique({
      where: { id },
      include: { user: { select: { email: true, phone: true } }, domicilioSede: true },
    }),
    prisma.config.findFirst(),
    prisma.contratoDomicilioVersion.findMany({ where: { tramiteId: id }, orderBy: { version: 'desc' } }),
  ])
  if (!tramite) {
    return NextResponse.json({ error: 'Trámite no encontrado' }, { status: 404 })
  }

  // Los administradores primero (el titular arriba): de ahí sale el representante.
  const administradores = lista(tramite.administradores)
    .slice()
    .sort((a, b) => Number(b.cargo === 'TITULAR') - Number(a.cargo === 'TITULAR'))
  const personas: PersonaContrato[] = [
    ...administradores.map((a, i) => ({
      clave: `adm-${i}`,
      rol: a.cargo === 'TITULAR' ? 'Administrador titular' : a.cargo === 'SUPLENTE' ? 'Administrador suplente' : 'Administrador',
      nombre: nombreCompleto(a),
      dni: (a.dni || '').trim(),
      domicilio: domicilioCompleto(a),
    })),
    ...lista(tramite.socios).map((s, i) => ({
      clave: `soc-${i}`,
      rol: 'Socio',
      nombre: nombreCompleto(s),
      dni: (s.dni || '').trim(),
      domicilio: domicilioCompleto(s),
    })),
  ].filter((p) => p.nombre)

  const representante = personas.find((p) => p.clave.startsWith('adm-'))
  const datosUsuario = (tramite.datosUsuario ?? {}) as { email?: string; telefono?: string }
  const domicilio = tramite.domicilioSede

  // Lo que sale del trámite y de la configuración, sin versiones anteriores.
  const datosDelTramite: DatosContrato = {
    sociedad_denominacion: sinTipoSocietario(tramite.denominacionAprobada || tramite.denominacionSocial1 || ''),
    sociedad_cuit: tramite.cuit || '',
    sociedad_matricula: tramite.matricula || '',
    administracion_real: '',
    representante_nombre: representante?.nombre || '',
    representante_dni: representante?.dni || '',
    representante_caracter: 'Administrador titular',
    coobligado_nombre: representante?.nombre || '',
    coobligado_dni: representante?.dni || '',
    coobligado_domicilio: representante?.domicilio || '',
    email: tramite.user.email || datosUsuario.email || '',
    email_alternativo: '',
    whatsapp: tramite.user.phone || datosUsuario.telefono || '',
    fiscal_arca: false,
    fiscal_rentas: false,
    precio_y_condiciones: precioYCondiciones(domicilio?.montoAnual),
    fecha_inicio: domicilio?.fechaInicio ? fechaDDMMAAAA(domicilio.fechaInicio) : '',
    fecha_firma: hoyArgentina(),
    multa_diaria: config?.contratoDomicilioMultaDiaria || '',
    fianza_monto_maximo: config?.contratoDomicilioFianzaMaxima || '',
    prestador_representante: config?.prestadorRepresentante || '',
    prestador_dni: config?.prestadorDni || '',
    prestador_caracter: config?.prestadorCaracter || '',
  }

  return NextResponse.json({
    datosDelTramite,
    // Cada versión guarda los datos con que se generó; los campos que no
    // existían cuando se guardó se completan con los del trámite.
    versiones: versiones.map((v) => ({
      version: v.version,
      fecha: v.createdAt,
      generadoPor: v.generadoPor,
      formato: v.formato,
      datos: { ...datosDelTramite, ...(v.datos as Partial<DatosContrato>) },
    })),
    personas,
    representanteClave: representante?.clave ?? null,
    // La dirección del contrato está fija en la plantilla (Pasaje Chagas 6043):
    // si el domicilio del trámite es otro, el formulario lo avisa.
    direccionDomicilio: domicilio?.direccion ?? null,
    pdfDisponible: conversorPdfConfigurado(),
  })
}

// POST - Genera el contrato y lo devuelve para descargar, en Word o en PDF.
// No lo guarda en el trámite ni avisa al cliente: la firma se hace afuera
// (Adobe Sign u otra plataforma).
export async function POST(request: Request, { params }: RouteParams) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const { id } = await params
  const tramite = await prisma.tramite.findUnique({ where: { id }, select: { id: true } })
  if (!tramite) {
    return NextResponse.json({ error: 'Trámite no encontrado' }, { status: 404 })
  }

  const body = (await request.json()) as { datos: DatosContrato; formato?: 'docx' | 'pdf' }
  const formato = body.formato === 'pdf' ? 'pdf' : 'docx'
  if (formato === 'pdf' && !conversorPdfConfigurado()) {
    return NextResponse.json({ error: 'Todavía no está configurado el conversor a PDF. Descargalo en Word.' }, { status: 501 })
  }

  const denominacion = sinTipoSocietario(body.datos.sociedad_denominacion) || 'Sociedad'
  const nombre = `Contrato de domicilio - ${denominacion}`

  let archivo: Buffer
  try {
    // El PDF sale de la versión HTML (con el diseño de QuieroMiSAS); el Word, de la plantilla .docx.
    archivo =
      formato === 'pdf'
        ? await htmlAPdf(await contratoDomicilioHtml(body.datos), PIE_CONTRATO_HTML)
        : await generarContratoDomicilio(body.datos)
  } catch (e) {
    console.error('Error al generar el contrato de domicilio:', e)
    return NextResponse.json(
      { error: formato === 'pdf' ? 'No se pudo convertir el contrato a PDF' : 'No se pudo generar el contrato' },
      { status: 500 },
    )
  }

  // El historial no frena la descarga: si falla, el contrato se entrega igual.
  const version = await guardarVersion(id, body.datos, formato, session.user.name ?? null).catch((e) => {
    console.error('No se pudo guardar la versión del contrato de domicilio:', e)
    return null
  })

  return new NextResponse(new Uint8Array(archivo), {
    headers: {
      ...(version ? { 'X-Contrato-Version': String(version) } : {}),
      'Content-Type': formato === 'pdf' ? 'application/pdf' : MIME_DOCX,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(`${nombre}.${formato}`)}`,
    },
  })
}
