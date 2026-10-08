import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { verifyEmailConnection, sendEmail } from '@/lib/email'
import { renderizarEmail } from '@/lib/emails/send'
import { ejemploDe } from '@/lib/emails/ejemplos'

// GET - Verificar conexión SMTP
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const result = await verifyEmailConnection()

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Conexión SMTP verificada' })
    } else {
      return NextResponse.json({ success: false, error: result.error || 'Error de conexión SMTP' }, { status: 500 })
    }
  } catch {
    return NextResponse.json({ success: false, error: 'Error al verificar conexión' }, { status: 500 })
  }
}

// POST - Enviar email de prueba
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { email, tipo } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email de destino requerido' }, { status: 400 })
    }

    // El tipo es el nombre de la plantilla actual (lib/emails/templates.tsx).
    // Antes la pantalla mandaba claves que no coincidían con las del servidor y
    // siempre salía la Bienvenida, armada con una versión vieja del diseño.
    const ejemplo = ejemploDe(typeof tipo === 'string' ? tipo : '')
    if (!ejemplo) {
      return NextResponse.json({ error: `Tipo de email desconocido: ${tipo}` }, { status: 400 })
    }

    // Mismo armado que el envío real (incluida la plantilla editable de la
    // base), pero sin registrarlo en la bandeja ni en ningún trámite.
    const emailData = await renderizarEmail(
      ejemplo.template as Parameters<typeof renderizarEmail>[0],
      ejemplo.asunto,
      ejemplo.datos,
    )

    const result = await sendEmail({
      to: email,
      subject: `[TEST] ${emailData.subject}`,
      html: emailData.html,
    })

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Email de prueba enviado' })
    } else {
      return NextResponse.json({ success: false, error: result.error || 'Error al enviar' }, { status: 500 })
    }
  } catch {
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
