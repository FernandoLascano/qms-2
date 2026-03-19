import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { verifyEmailConnection, sendEmail, emailTemplates } from '@/lib/email'

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

    let emailData: { subject: string; html: string }

    switch (tipo) {
      case 'bienvenida':
        emailData = emailTemplates.welcome('Usuario de Prueba')
        break
      case 'nuevoTramite':
        emailData = emailTemplates.nuevoTramite('Usuario de Prueba', 'EMPRESA TEST SAS')
        break
      case 'completado':
        emailData = emailTemplates.tramiteCompletado('Usuario de Prueba', 'EMPRESA TEST SAS', '30-12345678-9')
        break
      case 'pago':
        emailData = emailTemplates.recordatorioPago('Usuario de Prueba', 'EMPRESA TEST SAS', '$285.000', '25/03/2026', 'https://www.quieromisas.com')
        break
      default:
        emailData = emailTemplates.welcome('Usuario de Prueba')
    }

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
