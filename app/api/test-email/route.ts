import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendEmail, verifyEmailConnection, emailTemplates } from '@/lib/email'

// POST - Enviar email de prueba
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { email, tipo } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email requerido' },
        { status: 400 }
      )
    }

    let template
    switch (tipo) {
      case 'welcome':
        template = emailTemplates.welcome('Usuario de Prueba')
        break
      case 'nuevoTramite':
        template = emailTemplates.nuevoTramite('Usuario de Prueba', 'Mi Empresa SAS', 'test-123')
        break
      case 'cambioEstado':
        template = emailTemplates.cambioEstado(
          'Usuario de Prueba',
          'Mi Empresa SAS',
          'RESERVA APROBADA',
          'Tu denominación ha sido reservada exitosamente en la Inspección General de Justicia. Ahora podés continuar con el siguiente paso del proceso.',
          { color: 'success', pasoActual: 2 }
        )
        break
      case 'accionRequerida':
        template = emailTemplates.accionRequerida(
          'Usuario de Prueba',
          'Mi Empresa SAS',
          'Subir comprobante de depósito',
          'Necesitamos que subas el comprobante del depósito del 25% del capital social para continuar con el trámite.',
          'http://localhost:3000/dashboard/tramites',
          '25/12/2024'
        )
        break
      case 'tramiteCompletado':
        template = emailTemplates.tramiteCompletado(
          'Usuario de Prueba',
          'Mi Empresa SAS',
          '30-12123456-7'
        )
        break
      case 'recordatorioPago':
        template = emailTemplates.recordatorioPago(
          'Usuario de Prueba',
          'Mi Empresa SAS',
          '$120.000',
          '30/12/2024',
          'http://localhost:3000/pago/abc123'
        )
        break
      default:
        template = emailTemplates.welcome('Usuario de Prueba')
    }

    const result = await sendEmail({
      to: email,
      subject: `[TEST] ${template.subject}`,
      html: template.html
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Email de prueba enviado correctamente',
        messageId: result.messageId
      })
    } else {
      return NextResponse.json(
        { error: 'Error al enviar email', detalles: result.error },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error en test-email:', error)
    return NextResponse.json(
      { error: 'Error al enviar email de prueba', detalles: error.message },
      { status: 500 }
    )
  }
}

// GET - Verificar conexión SMTP
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const result = await verifyEmailConnection()

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Conexión SMTP verificada correctamente'
      })
    } else {
      return NextResponse.json(
        { error: 'Error en conexión SMTP', detalles: result.error },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error verificando SMTP:', error)
    return NextResponse.json(
      { error: 'Error al verificar conexión SMTP', detalles: error.message },
      { status: 500 }
    )
  }
}
