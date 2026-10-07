import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadToSupabase } from '@/lib/supabase-storage'
import { enviarEmailNotificacion } from '@/lib/emails/send'
import {
  fechaDDMMAAAA,
  generarContratoDomicilio,
  precioYCondiciones,
  sinTipoSocietario,
  type DatosContrato,
  type PersonaContrato,
} from '@/lib/contrato-domicilio'

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

// GET - Datos precargados para el formulario del contrato
export async function GET(_request: Request, { params }: RouteParams) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const { id } = await params
  const [tramite, config] = await Promise.all([
    prisma.tramite.findUnique({
      where: { id },
      include: { user: { select: { email: true, phone: true } }, domicilioSede: true },
    }),
    prisma.config.findFirst(),
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

  const datos: DatosContrato = {
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
    multa_diaria: config?.contratoDomicilioMultaDiaria || '',
    fianza_monto_maximo: config?.contratoDomicilioFianzaMaxima || '',
    prestador_representante: config?.prestadorRepresentante || '',
    prestador_dni: config?.prestadorDni || '',
    prestador_caracter: config?.prestadorCaracter || '',
  }

  return NextResponse.json({
    datos,
    personas,
    representanteClave: representante?.clave ?? null,
    // La dirección del contrato está fija en la plantilla (Pasaje Chagas 6043):
    // si el domicilio del trámite es otro, el formulario lo avisa.
    direccionDomicilio: domicilio?.direccion ?? null,
  })
}

// POST - Genera el contrato, lo guarda en el trámite y avisa al cliente
export async function POST(request: Request, { params }: RouteParams) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const { id } = await params
  const tramite = await prisma.tramite.findUnique({
    where: { id },
    select: { id: true, userId: true, user: { select: { email: true, name: true } } },
  })
  if (!tramite) {
    return NextResponse.json({ error: 'Trámite no encontrado' }, { status: 404 })
  }

  const body = (await request.json()) as { datos: DatosContrato; enviar?: boolean }
  const datos = body.datos

  let buffer: Buffer
  try {
    buffer = await generarContratoDomicilio(datos)
  } catch (e) {
    console.error('Error al generar el contrato de domicilio:', e)
    return NextResponse.json({ error: 'No se pudo generar el contrato' }, { status: 500 })
  }

  const denominacion = sinTipoSocietario(datos.sociedad_denominacion) || 'Sociedad'
  const archivo = `Contrato de domicilio - ${denominacion}.docx`
  const mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

  // Sin enviar: sólo se descarga para revisarlo.
  if (!body.enviar) {
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': mime,
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(archivo)}`,
      },
    })
  }

  const subido = await uploadToSupabase(buffer, `documentos-admin/${id}`, archivo, mime)
  if (!subido?.url) {
    return NextResponse.json({ error: 'No se pudo guardar el contrato. Intentá de nuevo.' }, { status: 500 })
  }

  const nombre = 'Contrato de domicilio'
  await prisma.documento.create({
    data: {
      tramiteId: id,
      userId: tramite.userId,
      nombre,
      descripcion:
        'Leelo completo. Lo firman el representante de la sociedad y el coobligado: imprimilo, firmá donde corresponde, completá la declaración jurada del Anexo I y subilo escaneado (en PDF, no fotos).',
      url: subido.url,
      tamanio: buffer.length,
      mimeType: mime,
      tipo: 'DOCUMENTO_PARA_FIRMAR',
      estado: 'PENDIENTE',
    },
  })

  // Mismo aviso que el envío manual de documentos para firmar.
  const mensaje = `El contrato de domicilio de tu Sociedad ya está listo para firmar:\n• ${nombre}\n\nIngresá a tu panel: ahí tenés las instrucciones de firma.`
  try {
    await prisma.notificacion.create({
      data: {
        userId: tramite.userId,
        tramiteId: id,
        tipo: 'ACCION_REQUERIDA',
        titulo: 'Contrato de domicilio para firmar',
        mensaje,
        link: `/dashboard/tramites/${id}#documentos-para-firmar`,
      },
    })
    await enviarEmailNotificacion(
      tramite.user.email,
      tramite.user.name || 'Usuario',
      'Contrato de domicilio para firmar',
      mensaje,
      id,
      { tono: 'accion', cta: { texto: 'Ir a firmar', ancla: 'documentos-para-firmar' } },
    )
  } catch {
    // Aviso no crítico: el contrato ya quedó en el trámite.
  }

  return NextResponse.json({ success: true })
}
