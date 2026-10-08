import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import * as templates from '@/lib/emails/templates'
import { EJEMPLOS_EMAIL } from '@/lib/emails/ejemplos'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Datos de ejemplo por template (los mismos del email de prueba).
const sampleData: Record<string, Record<string, unknown>> = Object.fromEntries(
  EJEMPLOS_EMAIL.map((e) => [e.template, e.datos]),
)

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
        // Un nombre vacío es válido: muestra el saludo genérico con el que
        // sale el mail cuando no se sabe quién es el destinatario.
        nombre: typeof body.nombre === 'string' ? body.nombre : 'Fernando',
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
