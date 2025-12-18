import { NextResponse } from 'next/server'
import { enviarEmailBienvenida } from '@/lib/emails/send'
import { isResendConfigured } from '@/lib/resend'

export async function GET() {
  try {
    console.log('=== TEST EMAIL ===')
    console.log('Resend configurado:', isResendConfigured())
    console.log('RESEND_API_KEY presente:', !!process.env.RESEND_API_KEY)
    console.log('FROM_EMAIL:', process.env.RESEND_FROM_EMAIL)
    console.log('REPLY_TO:', process.env.RESEND_REPLY_TO)

    if (!isResendConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Resend no está configurado',
        config: {
          hasApiKey: !!process.env.RESEND_API_KEY,
          fromEmail: process.env.RESEND_FROM_EMAIL,
          replyTo: process.env.RESEND_REPLY_TO
        }
      })
    }

    // Intentar enviar email de prueba a tu email
    const testEmail = 'ab.fernandojlascano@gmail.com' // Cambiar por tu email

    console.log('Intentando enviar email de prueba a:', testEmail)

    const result = await enviarEmailBienvenida(testEmail, 'Usuario de Prueba')

    console.log('Resultado del envío:', result)

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? 'Email enviado correctamente'
        : 'Error al enviar email',
      result: result,
      config: {
        hasApiKey: !!process.env.RESEND_API_KEY,
        fromEmail: process.env.RESEND_FROM_EMAIL,
        replyTo: process.env.RESEND_REPLY_TO
      }
    })
  } catch (error: any) {
    console.error('Error en test de email:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
