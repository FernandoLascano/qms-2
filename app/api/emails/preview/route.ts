import { NextRequest, NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/seo/site'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import * as templates from '@/lib/emails/templates'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Datos de ejemplo por template
const sampleData: Record<string, Record<string, unknown>> = {
  emailBienvenida: { nombre: 'Fernando' },
  emailVerificarCuenta: { nombre: 'Fernando', verifyUrl: `${SITE_URL}/verificar-email?token=ejemplo` },
  emailTramiteEnviado: { nombre: 'Fernando', tramiteId: 'cltx123', denominacion: 'Mi Empresa S.A.S.' },
  emailPagoPendiente: { nombre: 'Fernando', concepto: 'Plan Emprendedor', monto: 320000, tramiteId: 'cltx123' },
  emailDocumentoRechazado: { nombre: 'Fernando', nombreDocumento: 'DNI', observaciones: 'La imagen está borrosa. Por favor subí una foto más nítida.', tramiteId: 'cltx123' },
  emailEtapaCompletada: { nombre: 'Fernando', etapa: 'Reserva de denominación aprobada', tramiteId: 'cltx123' },
  emailSociedadInscripta: { nombre: 'Fernando', plan: 'BASICO', denominacion: 'Mi Empresa S.A.S.', cuit: '30-71234567-8', matricula: '12345', tramiteId: 'cltx123' },
  emailNotificacion: { nombre: 'Fernando', titulo: 'Novedad en tu trámite', mensaje: 'Hemos actualizado el estado de tu solicitud. Ingresá al panel para ver los detalles.', tramiteId: 'cltx123' },
  emailRecordatorioPago: { nombre: 'Fernando', concepto: 'Plan Emprendedor', monto: 320000, diasPendientes: 3, tramiteId: 'cltx123' },
  emailRecordatorioDocumento: { nombre: 'Fernando', nombreDocumento: 'DNI', observaciones: 'Subir documento de identidad', diasPendientes: 2, tramiteId: 'cltx123' },
  emailLeadSecuencia: {
    nombre: 'Fernando',
    cuerpo:
      'Te frenaste justo en el paso del domicilio, que es donde se traba casi todo el mundo.\n\n' +
      'La sede social de tu S.A.S. tiene que estar en Córdoba o en CABA, pero eso no significa que tengas que vivir ahí ni alquilar una oficina. Si no tenés dónde fijarla, te la damos nosotros y queda resuelto.\n\n' +
      'Tu empresa después puede operar en todo el país, sin importar dónde se constituyó.',
    tramiteId: 'cltx123',
    ultimo: false,
  },
  emailRecordatorioTramiteEstancado: { nombre: 'Fernando', etapaActual: 'Pago pendiente', diasEstancado: 7, tramiteId: 'cltx123' },
  emailAlertaDenominacion: { nombre: 'Fernando', denominacion: 'Mi Empresa S.A.S.', diasParaVencer: 5, tramiteId: 'cltx123' },
  emailValidacionTramite: { nombre: 'Fernando', denominacion: 'Mi Empresa S.A.S.', validado: true, observaciones: undefined, tramiteId: 'cltx123' },
}

/**
 * Las plantillas apuntan las imágenes a NEXTAUTH_URL, que en desarrollo suele
 * ser un puerto distinto del que está sirviendo. Para la vista previa se
 * vuelven relativas, así el logo y los iconos se ven siempre.
 */
function aRutasRelativas(html: string): string {
  return html.replace(/src="[^"]*?(\/assets\/)/g, 'src="$1')
}

async function esAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions)
  return session?.user?.rol === 'ADMIN'
}

export async function GET(request: NextRequest) {
  // Solo administradores: este endpoint expone plantillas internas y refleja
  // parámetros del usuario en HTML servido desde nuestro propio dominio.
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const template = searchParams.get('template') || 'emailBienvenida'

  const templateFn = (templates as Record<string, (data: any) => string>)[template]
  if (!templateFn) {
    return NextResponse.json({ error: `Template "${template}" no encontrado` }, { status: 404 })
  }

  const data = { ...(sampleData[template] || sampleData.emailBienvenida) }
  const nombreParam = searchParams.get('nombre')
  if (nombreParam) data.nombre = escapeHtml(nombreParam)

  // El mail de sociedad inscripta dice cosas distintas según el plan (el alta
  // en ARCA corre por cuenta del cliente sólo en Básico, los libros digitales
  // sólo vienen en Premium), así que se puede elegir cuál mirar.
  const planParam = searchParams.get('plan')
  if (planParam && ['BASICO', 'EMPRENDEDOR', 'PREMIUM'].includes(planParam)) {
    data.plan = planParam
  }

  // Las plantillas apuntan las imágenes a NEXTAUTH_URL, que en desarrollo suele
  const html = aRutasRelativas(templateFn(data))

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

/**
 * Vista previa de una plantilla de la base: recibe el fragmento que se está
 * editando y lo devuelve dentro del mismo sobre que usan los mails
 * automáticos, para que el editor muestre cómo se va a ver de verdad y no el
 * fragmento suelto.
 */
export async function POST(request: NextRequest) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  // Mensaje escrito a mano desde la bandeja: se previsualiza con la misma
  // función que lo va a enviar, así lo que se ve es lo que sale.
  if (typeof body.texto === 'string') {
    const html = aRutasRelativas(
      templates.emailManual({
        texto: body.texto,
        nombre: typeof body.nombre === 'string' && body.nombre ? body.nombre : 'Fernando',
      }),
    )
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  if (typeof body.bodyHtml !== 'string') {
    return NextResponse.json({ error: 'Falta bodyHtml o texto' }, { status: 400 })
  }

  // Las variables de la plantilla ({{nombre}}) se rellenan con un ejemplo para
  // que el previsualizado no muestre las llaves crudas.
  const ejemplos: Record<string, string> = {
    nombre: typeof body.nombre === 'string' && body.nombre ? escapeHtml(body.nombre) : 'Fernando',
    denominacion: 'Mi Empresa S.A.S.',
    monto: '$320.000',
    concepto: 'Plan Emprendedor',
  }
  const fragmento = body.bodyHtml.replace(
    /\{\{\s*(\w+)\s*\}\}/g,
    (crudo: string, clave: string) => ejemplos[clave] ?? crudo,
  )

  const html = aRutasRelativas(
    templates.EmailLayout({ children: fragmento, nombre: ejemplos.nombre }),
  )

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
