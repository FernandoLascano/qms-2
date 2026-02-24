import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await rateLimit(request, 'contact', 3, '1 m')
    if (rateLimitResponse) return rateLimitResponse
    const body = await request.json()
    const { nombre, email, asunto, mensaje } = body

    // Validaciones
    if (!nombre || !email || !asunto || !mensaje) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios' },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'El email no tiene un formato válido' },
        { status: 400 }
      )
    }

    // Crear el HTML del email
    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva consulta de contacto</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: white;">
                Nueva consulta de contacto
              </h1>
            </td>
          </tr>

          <!-- Contenido -->
          <tr>
            <td style="padding: 40px;">

              <!-- Badge -->
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="display: inline-block; background-color: #FEF2F2; color: #DC2626; padding: 8px 16px; border-radius: 9999px; font-size: 14px; font-weight: 600;">
                  Nuevo mensaje recibido
                </span>
              </div>

              <!-- Info del remitente -->
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                      <span style="color: #6b7280; font-size: 14px;">Nombre:</span>
                    </td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                      <strong style="color: #1f2937; font-size: 14px;">${nombre}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                      <span style="color: #6b7280; font-size: 14px;">Email:</span>
                    </td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                      <a href="mailto:${email}" style="color: #DC2626; font-size: 14px; text-decoration: none; font-weight: 600;">${email}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Asunto:</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                      <strong style="color: #1f2937; font-size: 14px;">${asunto}</strong>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Mensaje -->
              <div style="margin-bottom: 24px;">
                <h3 style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">
                  Mensaje:
                </h3>
                <div style="background-color: #f9fafb; border-left: 4px solid #DC2626; padding: 20px; border-radius: 0 12px 12px 0;">
                  <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0; white-space: pre-wrap;">${mensaje}</p>
                </div>
              </div>

              <!-- Botón responder -->
              <div style="text-align: center;">
                <a href="mailto:${email}?subject=Re: ${encodeURIComponent(asunto)}" style="display: inline-block; background-color: #DC2626; color: white; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; text-decoration: none;">
                  Responder al cliente →
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 24px 40px; text-align: center;">
              <p style="color: #9ca3af; font-size: 13px; margin: 0;">
                Este mensaje fue enviado desde el formulario de contacto de QuieroMiSAS
              </p>
              <p style="color: #6b7280; font-size: 12px; margin: 8px 0 0 0;">
                ${new Date().toLocaleDateString('es-AR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `

    // Enviar email a contacto@quieromisas.com
    const result = await sendEmail({
      to: 'contacto@quieromisas.com',
      subject: `Consulta web: ${asunto} - ${nombre}`,
      html: htmlContent,
      text: `Nueva consulta de contacto\n\nNombre: ${nombre}\nEmail: ${email}\nAsunto: ${asunto}\n\nMensaje:\n${mensaje}`
    })

    if (!result.success) {
      return NextResponse.json(
        { error: 'Error al enviar el mensaje. Intenta nuevamente.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Mensaje enviado correctamente'
    })

  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
