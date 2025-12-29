// Plantillas de emails HTML profesionales - Diseño 2024
// Matches QuieroMiSAS website design system

// URL base para los enlaces en emails
const BASE_URL = process.env.NEXTAUTH_URL || 'https://quieromisas.com'

// Logo URL (hosted on the website)
const LOGO_URL = `${BASE_URL}/assets/img/logo4.png`

interface EmailTemplateProps {
  nombre: string
  [key: string]: any
}

// Colores del sistema de diseño
const colors = {
  primary: '#b91c1c',      // red-700
  primaryDark: '#991b1b',  // red-800
  primaryLight: '#fef2f2', // red-50
  accent: '#dc2626',       // red-600
  dark: '#111827',         // gray-900
  text: '#1f2937',         // gray-800
  textMuted: '#6b7280',    // gray-500
  textLight: '#9ca3af',    // gray-400
  border: '#e5e7eb',       // gray-200
  background: '#f9fafb',   // gray-50
  white: '#ffffff',
  success: '#10b981',      // emerald-500
  successBg: '#d1fae5',    // emerald-100
  warning: '#f59e0b',      // amber-500
  warningBg: '#fef3c7',    // amber-100
  error: '#ef4444',        // red-500
  errorBg: '#fee2e2',      // red-100
  info: '#3b82f6',         // blue-500
  infoBg: '#dbeafe',       // blue-100
}

// Template base con estilos modernos
const EmailLayout = ({ children, nombre, preheader = '' }: { children: string; nombre: string; preheader?: string }) => {
  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="x-apple-disable-message-reformatting">
        <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
        <title>QuieroMiSAS</title>
        <!--[if mso]>
        <noscript>
          <xml>
            <o:OfficeDocumentSettings>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        </noscript>
        <![endif]-->
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: ${colors.background};
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          img {
            border: 0;
            display: block;
            max-width: 100%;
          }

          a {
            text-decoration: none;
          }

          .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px -5px rgba(185, 28, 28, 0.4);
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: ${colors.background};">
        <!-- Preheader text (hidden) -->
        <div style="display: none; font-size: 1px; color: ${colors.background}; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
          ${preheader}
        </div>

        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${colors.background}; padding: 40px 16px;">
          <tr>
            <td align="center">
              <!-- Main Container -->
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: ${colors.white}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);">

                <!-- Header con Logo -->
                <tr>
                  <td style="background: linear-gradient(135deg, ${colors.dark} 0%, ${colors.primaryDark} 100%); padding: 32px 40px; text-align: center;">
                    <!-- Logo -->
                    <img
                      src="${LOGO_URL}"
                      alt="QuieroMiSAS"
                      width="180"
                      style="height: auto; margin: 0 auto; filter: brightness(0) invert(1);"
                    />
                    <p style="margin: 12px 0 0 0; color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 500; letter-spacing: 0.5px;">
                      Tu empresa lista en 5 días
                    </p>
                  </td>
                </tr>

                <!-- Saludo -->
                <tr>
                  <td style="padding: 40px 40px 0 40px;">
                    <p style="margin: 0; color: ${colors.text}; font-size: 17px; line-height: 1.6;">
                      Hola <strong style="color: ${colors.dark}; font-weight: 700;">${nombre}</strong> 👋
                    </p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 24px 40px 40px 40px;">
                    ${children}
                  </td>
                </tr>

                <!-- Separator -->
                <tr>
                  <td style="padding: 0 40px;">
                    <div style="height: 1px; background: linear-gradient(to right, transparent, ${colors.border}, transparent);"></div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 32px 40px; text-align: center;">
                    <!-- Social/Contact Icons -->
                    <table cellpadding="0" cellspacing="0" style="margin: 0 auto 20px auto;">
                      <tr>
                        <td style="padding: 0 8px;">
                          <a href="https://wa.me/5493514284037" style="display: inline-block; width: 40px; height: 40px; background-color: ${colors.background}; border-radius: 10px; text-align: center; line-height: 40px;">
                            <span style="font-size: 18px;">💬</span>
                          </a>
                        </td>
                        <td style="padding: 0 8px;">
                          <a href="mailto:contacto@quieromisas.com" style="display: inline-block; width: 40px; height: 40px; background-color: ${colors.background}; border-radius: 10px; text-align: center; line-height: 40px;">
                            <span style="font-size: 18px;">✉️</span>
                          </a>
                        </td>
                        <td style="padding: 0 8px;">
                          <a href="${BASE_URL}" style="display: inline-block; width: 40px; height: 40px; background-color: ${colors.background}; border-radius: 10px; text-align: center; line-height: 40px;">
                            <span style="font-size: 18px;">🌐</span>
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 0 0 8px 0; color: ${colors.textMuted}; font-size: 13px;">
                      ¿Necesitás ayuda? Respondé este email o escribinos por WhatsApp
                    </p>
                    <p style="margin: 0 0 16px 0; color: ${colors.textLight}; font-size: 12px;">
                      <a href="tel:+5493514284037" style="color: ${colors.primary}; font-weight: 600;">+54 9 351 428 4037</a>
                    </p>

                    <p style="margin: 20px 0 0 0; color: ${colors.textLight}; font-size: 11px; line-height: 1.6;">
                      © ${new Date().getFullYear()} QuieroMiSAS by Martínez Wehbe & Asociados<br/>
                      Córdoba, Argentina
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Unsubscribe / Legal -->
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
                <tr>
                  <td style="padding: 24px 40px; text-align: center;">
                    <p style="margin: 0; color: ${colors.textLight}; font-size: 11px; line-height: 1.6;">
                      Recibís este email porque tenés una cuenta en QuieroMiSAS.<br/>
                      <a href="${BASE_URL}/dashboard/configuracion" style="color: ${colors.textMuted};">Gestionar preferencias de email</a>
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
}

// Helper: Botón CTA principal
const CTAButton = (text: string, url: string, emoji?: string) => `
  <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
    <tr>
      <td style="background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%); border-radius: 12px; box-shadow: 0 4px 14px 0 rgba(185, 28, 28, 0.3);">
        <a href="${url}" style="display: inline-block; padding: 16px 32px; color: ${colors.white}; font-size: 16px; font-weight: 700; text-decoration: none;">
          ${emoji ? `${emoji} ` : ''}${text}
        </a>
      </td>
    </tr>
  </table>
`

// Helper: Card informativa
const InfoCard = (content: string, bgColor: string, borderColor: string, iconEmoji: string) => `
  <div style="background-color: ${bgColor}; border-left: 4px solid ${borderColor}; border-radius: 12px; padding: 20px 24px; margin: 24px 0;">
    <table cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td width="40" valign="top">
          <span style="font-size: 24px;">${iconEmoji}</span>
        </td>
        <td style="padding-left: 12px;">
          ${content}
        </td>
      </tr>
    </table>
  </div>
`

// Helper: Stat box
const StatBox = (label: string, value: string, emoji?: string) => `
  <div style="background-color: ${colors.background}; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid ${colors.border};">
    ${emoji ? `<span style="font-size: 28px; display: block; margin-bottom: 8px;">${emoji}</span>` : ''}
    <p style="margin: 0 0 4px 0; color: ${colors.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">${label}</p>
    <p style="margin: 0; color: ${colors.dark}; font-size: 20px; font-weight: 800;">${value}</p>
  </div>
`

// Helper: Step indicator
const StepIndicator = (steps: { number: string; title: string; done?: boolean }[]) => `
  <table cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
    <tr>
      ${steps.map((step, i) => `
        <td style="text-align: center; padding: 0 ${i === 0 ? '0' : '8px'} 0 ${i === steps.length - 1 ? '0' : '8px'};">
          <div style="width: 36px; height: 36px; border-radius: 50%; background-color: ${step.done ? colors.success : colors.background}; border: 2px solid ${step.done ? colors.success : colors.border}; margin: 0 auto 8px auto; line-height: 32px; text-align: center;">
            <span style="color: ${step.done ? colors.white : colors.textMuted}; font-size: 14px; font-weight: 700;">${step.done ? '✓' : step.number}</span>
          </div>
          <p style="margin: 0; color: ${step.done ? colors.success : colors.textMuted}; font-size: 11px; font-weight: 500;">${step.title}</p>
        </td>
        ${i < steps.length - 1 ? `
          <td style="padding: 0 4px;">
            <div style="height: 2px; background-color: ${step.done ? colors.success : colors.border}; margin-top: -20px;"></div>
          </td>
        ` : ''}
      `).join('')}
    </tr>
  </table>
`

// ========================================
// TEMPLATES
// ========================================

// 1. Email de Bienvenida al Registrarse
export const emailBienvenida = ({ nombre }: EmailTemplateProps) => {
  const content = `
    <!-- Hero Message -->
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="font-size: 64px; display: block; margin-bottom: 16px;">🎉</span>
      <h1 style="margin: 0 0 8px 0; color: ${colors.dark}; font-size: 28px; font-weight: 800;">
        ¡Bienvenido a QuieroMiSAS!
      </h1>
      <p style="margin: 0; color: ${colors.textMuted}; font-size: 16px;">
        Tu cuenta ha sido creada exitosamente
      </p>
    </div>

    <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 15px; line-height: 1.7;">
      Gracias por confiar en nosotros para la constitución de tu sociedad.
      Estamos listos para ayudarte a dar el primer paso hacia tu nueva empresa.
    </p>

    <!-- Features Grid -->
    <table cellpadding="0" cellspacing="0" width="100%" style="margin: 32px 0;">
      <tr>
        <td width="50%" style="padding-right: 8px; vertical-align: top;">
          <div style="background-color: ${colors.background}; border-radius: 12px; padding: 20px; height: 100%;">
            <span style="font-size: 24px;">⚡</span>
            <p style="margin: 8px 0 4px 0; color: ${colors.dark}; font-size: 14px; font-weight: 700;">Rápido</p>
            <p style="margin: 0; color: ${colors.textMuted}; font-size: 13px; line-height: 1.5;">Tu S.A.S. lista en solo 5 días hábiles</p>
          </div>
        </td>
        <td width="50%" style="padding-left: 8px; vertical-align: top;">
          <div style="background-color: ${colors.background}; border-radius: 12px; padding: 20px; height: 100%;">
            <span style="font-size: 24px;">🔒</span>
            <p style="margin: 8px 0 4px 0; color: ${colors.dark}; font-size: 14px; font-weight: 700;">Seguro</p>
            <p style="margin: 0; color: ${colors.textMuted}; font-size: 13px; line-height: 1.5;">Proceso 100% online y documentos protegidos</p>
          </div>
        </td>
      </tr>
      <tr>
        <td colspan="2" style="height: 16px;"></td>
      </tr>
      <tr>
        <td width="50%" style="padding-right: 8px; vertical-align: top;">
          <div style="background-color: ${colors.background}; border-radius: 12px; padding: 20px; height: 100%;">
            <span style="font-size: 24px;">📊</span>
            <p style="margin: 8px 0 4px 0; color: ${colors.dark}; font-size: 14px; font-weight: 700;">Seguimiento</p>
            <p style="margin: 0; color: ${colors.textMuted}; font-size: 13px; line-height: 1.5;">Panel online para ver tu progreso 24/7</p>
          </div>
        </td>
        <td width="50%" style="padding-left: 8px; vertical-align: top;">
          <div style="background-color: ${colors.background}; border-radius: 12px; padding: 20px; height: 100%;">
            <span style="font-size: 24px;">💬</span>
            <p style="margin: 8px 0 4px 0; color: ${colors.dark}; font-size: 14px; font-weight: 700;">Soporte</p>
            <p style="margin: 0; color: ${colors.textMuted}; font-size: 13px; line-height: 1.5;">Equipo experto disponible para ayudarte</p>
          </div>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <div style="text-align: center; margin: 40px 0 24px 0;">
      ${CTAButton('Comenzar mi trámite', `${BASE_URL}/tramite/nuevo`, '🚀')}
    </div>

    <p style="margin: 0; color: ${colors.textMuted}; font-size: 13px; text-align: center; line-height: 1.6;">
      ¿Tenés dudas? Nuestro equipo está listo para ayudarte.<br/>
      Escribinos por WhatsApp o respondé este email.
    </p>
  `

  return EmailLayout({
    children: content,
    nombre,
    preheader: '¡Tu cuenta fue creada! Ya podés comenzar a constituir tu S.A.S.'
  })
}

// 2. Email cuando se envía un trámite
export const emailTramiteEnviado = ({ nombre, tramiteId, denominacion }: EmailTemplateProps) => {
  const content = `
    ${InfoCard(`
      <p style="margin: 0 0 4px 0; color: ${colors.success}; font-size: 18px; font-weight: 700;">
        ¡Trámite Recibido!
      </p>
      <p style="margin: 0; color: ${colors.text}; font-size: 14px;">
        Hemos recibido tu solicitud de constitución
      </p>
    `, colors.successBg, colors.success, '✅')}

    <!-- Denominación -->
    <div style="background: linear-gradient(135deg, ${colors.background} 0%, #fff 100%); border: 1px solid ${colors.border}; border-radius: 16px; padding: 24px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 8px 0; color: ${colors.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Tu Sociedad</p>
      <p style="margin: 0; color: ${colors.dark}; font-size: 24px; font-weight: 800;">${denominacion}</p>
    </div>

    <!-- Process Steps -->
    <p style="margin: 0 0 16px 0; color: ${colors.text}; font-size: 15px; font-weight: 600;">
      📋 Próximos pasos:
    </p>

    ${StepIndicator([
      { number: '1', title: 'Revisión', done: true },
      { number: '2', title: 'Pagos', done: false },
      { number: '3', title: 'Documentos', done: false },
      { number: '4', title: 'Inscripción', done: false }
    ])}

    <div style="background-color: ${colors.infoBg}; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0; color: ${colors.text}; font-size: 14px; line-height: 1.7;">
        <strong style="color: ${colors.info};">¿Qué sigue?</strong><br/>
        Nuestro equipo revisará tu solicitud en las próximas horas y te notificaremos sobre los pagos necesarios para continuar.
      </p>
    </div>

    <!-- CTA -->
    <div style="text-align: center; margin: 32px 0 24px 0;">
      ${CTAButton('Ver estado del trámite', `${BASE_URL}/dashboard/tramites/${tramiteId}`, '📊')}
    </div>
  `

  return EmailLayout({
    children: content,
    nombre,
    preheader: `Tu trámite de ${denominacion} ha sido recibido. Te mantendremos informado del progreso.`
  })
}

// 3. Email cuando hay un pago pendiente
export const emailPagoPendiente = ({ nombre, concepto, monto, tramiteId }: EmailTemplateProps) => {
  const content = `
    ${InfoCard(`
      <p style="margin: 0 0 4px 0; color: ${colors.warning}; font-size: 18px; font-weight: 700;">
        Pago Requerido
      </p>
      <p style="margin: 0; color: ${colors.text}; font-size: 14px;">
        Para continuar con tu trámite
      </p>
    `, colors.warningBg, colors.warning, '💳')}

    <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 15px; line-height: 1.7;">
      Para avanzar con la constitución de tu sociedad, necesitamos que realices el siguiente pago:
    </p>

    <!-- Payment Card -->
    <div style="background: linear-gradient(135deg, ${colors.warningBg} 0%, #fffbeb 100%); border: 2px solid ${colors.warning}; border-radius: 16px; padding: 32px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 8px 0; color: ${colors.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Concepto</p>
      <p style="margin: 0 0 20px 0; color: ${colors.dark}; font-size: 18px; font-weight: 700;">${concepto}</p>

      <p style="margin: 0 0 4px 0; color: ${colors.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Monto</p>
      <p style="margin: 0; color: ${colors.warning}; font-size: 42px; font-weight: 900;">$${Number(monto).toLocaleString('es-AR')}</p>
    </div>

    <div style="background-color: ${colors.background}; border-radius: 12px; padding: 16px 20px; margin: 24px 0;">
      <p style="margin: 0; color: ${colors.text}; font-size: 13px; line-height: 1.6;">
        💡 <strong>Tip:</strong> Una vez realizado el pago, no olvides adjuntar tu comprobante en la plataforma para que podamos verificarlo rápidamente.
      </p>
    </div>

    <!-- CTA -->
    <div style="text-align: center; margin: 32px 0 24px 0;">
      ${CTAButton('Realizar pago', `${BASE_URL}/dashboard/tramites/${tramiteId}`, '💳')}
    </div>
  `

  return EmailLayout({
    children: content,
    nombre,
    preheader: `Pago pendiente de $${Number(monto).toLocaleString('es-AR')} - ${concepto}`
  })
}

// 4. Email cuando un documento fue rechazado
export const emailDocumentoRechazado = ({ nombre, nombreDocumento, observaciones, tramiteId }: EmailTemplateProps) => {
  const content = `
    ${InfoCard(`
      <p style="margin: 0 0 4px 0; color: ${colors.error}; font-size: 18px; font-weight: 700;">
        Documento Requiere Corrección
      </p>
      <p style="margin: 0; color: ${colors.text}; font-size: 14px;">
        Necesitamos que hagas algunos ajustes
      </p>
    `, colors.errorBg, colors.error, '📄')}

    <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 15px; line-height: 1.7;">
      Hemos revisado el documento <strong>"${nombreDocumento}"</strong> y necesita algunas correcciones para poder continuar.
    </p>

    <!-- Observaciones -->
    <div style="background-color: ${colors.errorBg}; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #fca5a5;">
      <p style="margin: 0 0 12px 0; color: ${colors.error}; font-size: 14px; font-weight: 700; display: flex; align-items: center;">
        ⚠️ Observaciones:
      </p>
      <p style="margin: 0; color: ${colors.text}; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${observaciones}</p>
    </div>

    <div style="background-color: ${colors.infoBg}; border-radius: 12px; padding: 16px 20px; margin: 24px 0;">
      <p style="margin: 0; color: ${colors.text}; font-size: 13px; line-height: 1.6;">
        💡 <strong>¿Necesitás ayuda?</strong> Escribinos por WhatsApp y te guiamos con las correcciones necesarias.
      </p>
    </div>

    <!-- CTA -->
    <div style="text-align: center; margin: 32px 0 24px 0;">
      ${CTAButton('Subir documento corregido', `${BASE_URL}/dashboard/tramites/${tramiteId}`, '📤')}
    </div>
  `

  return EmailLayout({
    children: content,
    nombre,
    preheader: `Tu documento "${nombreDocumento}" necesita correcciones. Revisá las observaciones.`
  })
}

// 5. Email cuando una etapa se completa
export const emailEtapaCompletada = ({ nombre, etapa, tramiteId }: EmailTemplateProps) => {
  const content = `
    ${InfoCard(`
      <p style="margin: 0 0 4px 0; color: ${colors.info}; font-size: 18px; font-weight: 700;">
        ¡Progreso en tu Trámite!
      </p>
      <p style="margin: 0; color: ${colors.text}; font-size: 14px;">
        Una etapa importante ha sido completada
      </p>
    `, colors.infoBg, colors.info, '🎯')}

    <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 15px; line-height: 1.7;">
      ¡Buenas noticias! Hemos completado una etapa importante de tu trámite:
    </p>

    <!-- Stage Completed -->
    <div style="background: linear-gradient(135deg, ${colors.successBg} 0%, #ecfdf5 100%); border: 2px solid ${colors.success}; border-radius: 16px; padding: 28px; margin: 24px 0; text-align: center;">
      <span style="font-size: 40px; display: block; margin-bottom: 12px;">✅</span>
      <p style="margin: 0; color: ${colors.success}; font-size: 20px; font-weight: 800;">${etapa}</p>
    </div>

    <p style="margin: 0 0 24px 0; color: ${colors.textMuted}; font-size: 14px; line-height: 1.7; text-align: center;">
      Seguimos trabajando en tu trámite. Te mantendremos informado de cada avance. 🚀
    </p>

    <!-- CTA -->
    <div style="text-align: center; margin: 32px 0 24px 0;">
      ${CTAButton('Ver progreso completo', `${BASE_URL}/dashboard/tramites/${tramiteId}`, '📊')}
    </div>
  `

  return EmailLayout({
    children: content,
    nombre,
    preheader: `¡Avance en tu trámite! Etapa completada: ${etapa}`
  })
}

// 6. Email cuando la sociedad está inscripta (¡Trámite completo!)
export const emailSociedadInscripta = ({ nombre, denominacion, cuit, matricula, tramiteId }: EmailTemplateProps) => {
  const content = `
    <!-- Celebration Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="font-size: 72px; display: block; margin-bottom: 16px;">🎉</span>
      <h1 style="margin: 0 0 8px 0; color: ${colors.success}; font-size: 32px; font-weight: 900;">
        ¡Felicitaciones!
      </h1>
      <p style="margin: 0; color: ${colors.text}; font-size: 18px; font-weight: 600;">
        Tu sociedad está oficialmente inscripta
      </p>
    </div>

    <p style="margin: 0 0 32px 0; color: ${colors.text}; font-size: 15px; line-height: 1.7; text-align: center;">
      ¡Excelentes noticias! Tu sociedad ha sido inscripta exitosamente y ya está oficialmente constituida.
      Ahora podés empezar a operar con tu nueva empresa.
    </p>

    <!-- Society Details Card -->
    <div style="background: linear-gradient(135deg, ${colors.successBg} 0%, #ecfdf5 100%); border: 2px solid ${colors.success}; border-radius: 20px; padding: 32px; margin: 32px 0;">
      <p style="margin: 0 0 20px 0; color: ${colors.success}; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; text-align: center;">
        📋 Datos Oficiales de tu Sociedad
      </p>

      <!-- Denominación -->
      <div style="text-align: center; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid rgba(16, 185, 129, 0.2);">
        <p style="margin: 0 0 4px 0; color: ${colors.textMuted}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Denominación Social</p>
        <p style="margin: 0; color: ${colors.dark}; font-size: 22px; font-weight: 800;">${denominacion}</p>
      </div>

      <!-- CUIT y Matrícula -->
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr>
          ${cuit ? `
          <td width="50%" style="text-align: center; ${matricula ? 'border-right: 1px solid rgba(16, 185, 129, 0.2);' : ''} padding: 0 12px;">
            <p style="margin: 0 0 4px 0; color: ${colors.textMuted}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">CUIT</p>
            <p style="margin: 0; color: ${colors.dark}; font-size: 18px; font-weight: 800;">${cuit}</p>
          </td>
          ` : ''}
          ${matricula ? `
          <td width="50%" style="text-align: center; padding: 0 12px;">
            <p style="margin: 0 0 4px 0; color: ${colors.textMuted}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Matrícula</p>
            <p style="margin: 0; color: ${colors.dark}; font-size: 18px; font-weight: 800;">${matricula}</p>
          </td>
          ` : ''}
        </tr>
      </table>
    </div>

    <!-- What's Next -->
    <div style="background-color: ${colors.background}; border-radius: 16px; padding: 24px; margin: 24px 0;">
      <p style="margin: 0 0 16px 0; color: ${colors.dark}; font-size: 15px; font-weight: 700;">
        📌 ¿Qué sigue ahora?
      </p>
      <ul style="margin: 0; padding-left: 20px; color: ${colors.text}; font-size: 14px; line-height: 2;">
        <li>Descargá la Resolución de Inscripción desde tu panel</li>
        <li>Tramitá la Constancia de CUIT en AFIP</li>
        <li>Abrí tu cuenta bancaria empresarial</li>
        <li>¡Comenzá a operar! 🚀</li>
      </ul>
    </div>

    <!-- CTA -->
    <div style="text-align: center; margin: 40px 0 24px 0;">
      <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
        <tr>
          <td style="background: linear-gradient(135deg, ${colors.success} 0%, #059669 100%); border-radius: 12px; box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.4);">
            <a href="${BASE_URL}/dashboard/tramites/${tramiteId}" style="display: inline-block; padding: 16px 32px; color: ${colors.white}; font-size: 16px; font-weight: 700; text-decoration: none;">
              📥 Descargar documentos oficiales
            </a>
          </td>
        </tr>
      </table>
    </div>

    <p style="margin: 32px 0 0 0; color: ${colors.textMuted}; font-size: 14px; text-align: center; line-height: 1.6; font-style: italic;">
      ¡Gracias por confiar en QuieroMiSAS!<br/>
      Éxitos en tu nueva empresa 🌟
    </p>
  `

  return EmailLayout({
    children: content,
    nombre,
    preheader: `🎉 ¡Felicitaciones! Tu sociedad ${denominacion} está inscripta. CUIT: ${cuit || 'Pendiente'}`
  })
}

// 7. Email genérico para notificaciones
export const emailNotificacion = ({ nombre, titulo, mensaje, tramiteId }: EmailTemplateProps) => {
  const content = `
    <div style="background-color: ${colors.infoBg}; border-left: 4px solid ${colors.info}; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px;">
      <p style="margin: 0; color: ${colors.dark}; font-size: 18px; font-weight: 700;">
        ${titulo}
      </p>
    </div>

    <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 15px; line-height: 1.7;">
      ${mensaje}
    </p>

    ${tramiteId ? `
    <div style="text-align: center; margin: 32px 0 24px 0;">
      ${CTAButton('Ver trámite', `${BASE_URL}/dashboard/tramites/${tramiteId}`, '📋')}
    </div>
    ` : ''}
  `

  return EmailLayout({
    children: content,
    nombre,
    preheader: mensaje.substring(0, 100)
  })
}

// 8. Recordatorio de pago pendiente
export const emailRecordatorioPago = ({ nombre, concepto, monto, diasPendientes, tramiteId }: EmailTemplateProps) => {
  const content = `
    ${InfoCard(`
      <p style="margin: 0 0 4px 0; color: ${colors.warning}; font-size: 18px; font-weight: 700;">
        Recordatorio: Pago Pendiente
      </p>
      <p style="margin: 0; color: ${colors.text}; font-size: 14px;">
        Hace ${diasPendientes} días que tenés un pago pendiente
      </p>
    `, colors.warningBg, colors.warning, '⏰')}

    <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 15px; line-height: 1.7;">
      Este es un recordatorio amigable: tienes un pago pendiente que está deteniendo el avance de tu trámite.
    </p>

    <!-- Payment Card -->
    <div style="background: linear-gradient(135deg, ${colors.warningBg} 0%, #fffbeb 100%); border: 2px solid ${colors.warning}; border-radius: 16px; padding: 28px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 8px 0; color: ${colors.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Concepto</p>
      <p style="margin: 0 0 16px 0; color: ${colors.dark}; font-size: 18px; font-weight: 700;">${concepto}</p>

      <p style="margin: 0; color: ${colors.warning}; font-size: 38px; font-weight: 900;">$${Number(monto).toLocaleString('es-AR')}</p>
    </div>

    <p style="margin: 0 0 24px 0; color: ${colors.textMuted}; font-size: 14px; line-height: 1.7;">
      Para continuar con tu trámite, por favor realizá este pago a la brevedad.
      Si ya lo realizaste, no olvides subir el comprobante.
    </p>

    <!-- CTA -->
    <div style="text-align: center; margin: 32px 0 24px 0;">
      ${CTAButton('Realizar pago ahora', `${BASE_URL}/dashboard/tramites/${tramiteId}`, '💳')}
    </div>

    <p style="margin: 24px 0 0 0; color: ${colors.textLight}; font-size: 12px; text-align: center; line-height: 1.6;">
      Si tenés alguna duda sobre este pago, no dudes en contactarnos.
    </p>
  `

  return EmailLayout({
    children: content,
    nombre,
    preheader: `Recordatorio: Tenés un pago pendiente de $${Number(monto).toLocaleString('es-AR')} hace ${diasPendientes} días`
  })
}

// 9. Recordatorio de documento rechazado sin resubir
export const emailRecordatorioDocumento = ({ nombre, nombreDocumento, observaciones, diasPendientes, tramiteId }: EmailTemplateProps) => {
  const content = `
    ${InfoCard(`
      <p style="margin: 0 0 4px 0; color: ${colors.error}; font-size: 18px; font-weight: 700;">
        Documento Pendiente
      </p>
      <p style="margin: 0; color: ${colors.text}; font-size: 14px;">
        Hace ${diasPendientes} días que esperamos el documento corregido
      </p>
    `, colors.errorBg, colors.error, '⏰')}

    <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 15px; line-height: 1.7;">
      Te recordamos que hace <strong>${diasPendientes} días</strong> te solicitamos correcciones en el documento
      <strong>"${nombreDocumento}"</strong> y aún no lo hemos recibido.
    </p>

    <!-- Observaciones -->
    <div style="background-color: ${colors.errorBg}; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #fca5a5;">
      <p style="margin: 0 0 12px 0; color: ${colors.error}; font-size: 13px; font-weight: 700;">
        📋 Observaciones originales:
      </p>
      <p style="margin: 0; color: ${colors.text}; font-size: 14px; line-height: 1.7;">${observaciones}</p>
    </div>

    <p style="margin: 0 0 24px 0; color: ${colors.textMuted}; font-size: 14px; line-height: 1.7;">
      Para que podamos avanzar con tu trámite, necesitamos que subas el documento corregido lo antes posible.
    </p>

    <!-- CTA -->
    <div style="text-align: center; margin: 32px 0 24px 0;">
      ${CTAButton('Subir documento ahora', `${BASE_URL}/dashboard/tramites/${tramiteId}`, '📤')}
    </div>

    <div style="background-color: ${colors.infoBg}; border-radius: 12px; padding: 16px 20px; margin: 24px 0;">
      <p style="margin: 0; color: ${colors.text}; font-size: 13px; line-height: 1.6;">
        💡 <strong>¿Necesitás ayuda?</strong> Escribinos por WhatsApp y te guiamos con las correcciones.
      </p>
    </div>
  `

  return EmailLayout({
    children: content,
    nombre,
    preheader: `Recordatorio: Tu documento "${nombreDocumento}" está pendiente hace ${diasPendientes} días`
  })
}

// 10. Recordatorio de trámite estancado
export const emailRecordatorioTramiteEstancado = ({ nombre, etapaActual, diasEstancado, tramiteId }: EmailTemplateProps) => {
  const content = `
    ${InfoCard(`
      <p style="margin: 0 0 4px 0; color: ${colors.info}; font-size: 18px; font-weight: 700;">
        ¿Necesitás ayuda?
      </p>
      <p style="margin: 0; color: ${colors.text}; font-size: 14px;">
        Tu trámite lleva ${diasEstancado} días sin avanzar
      </p>
    `, colors.infoBg, colors.info, '👋')}

    <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 15px; line-height: 1.7;">
      Notamos que tu trámite lleva <strong>${diasEstancado} días</strong> en la etapa
      <strong>"${etapaActual}"</strong>.
    </p>

    <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 15px; line-height: 1.7;">
      ¿Hay algo en lo que podamos ayudarte? Estamos para asegurarnos de que tu trámite avance sin problemas.
    </p>

    <!-- Actions Checklist -->
    <div style="background-color: ${colors.background}; border-radius: 16px; padding: 24px; margin: 24px 0;">
      <p style="margin: 0 0 16px 0; color: ${colors.dark}; font-size: 14px; font-weight: 700;">
        📋 Posibles acciones pendientes:
      </p>
      <table cellpadding="0" cellspacing="0" width="100%">
        ${[
          { emoji: '💳', text: 'Verificar si hay pagos pendientes' },
          { emoji: '📄', text: 'Revisar si hay documentos por subir' },
          { emoji: '📊', text: 'Consultar el estado en tu panel' },
          { emoji: '💬', text: 'Contactar a nuestro equipo si tenés dudas' }
        ].map(item => `
          <tr>
            <td style="padding: 8px 0;">
              <span style="font-size: 16px; margin-right: 12px;">${item.emoji}</span>
              <span style="color: ${colors.text}; font-size: 14px;">${item.text}</span>
            </td>
          </tr>
        `).join('')}
      </table>
    </div>

    <!-- CTA -->
    <div style="text-align: center; margin: 32px 0 24px 0;">
      ${CTAButton('Ver estado del trámite', `${BASE_URL}/dashboard/tramites/${tramiteId}`, '📊')}
    </div>

    <p style="margin: 24px 0 0 0; color: ${colors.textMuted}; font-size: 14px; text-align: center; line-height: 1.6;">
      Estamos para ayudarte. Escribinos por WhatsApp o respondé este email. 💬
    </p>
  `

  return EmailLayout({
    children: content,
    nombre,
    preheader: `Tu trámite lleva ${diasEstancado} días sin avanzar. ¿Necesitás ayuda?`
  })
}

// 11. Alerta de denominación próxima a vencer (para admin)
export const emailAlertaDenominacion = ({ nombre, denominacion, diasParaVencer, tramiteId }: EmailTemplateProps) => {
  const content = `
    ${InfoCard(`
      <p style="margin: 0 0 4px 0; color: ${colors.warning}; font-size: 18px; font-weight: 700;">
        Denominación Próxima a Vencer
      </p>
      <p style="margin: 0; color: ${colors.text}; font-size: 14px;">
        Quedan ${diasParaVencer} días para que venza
      </p>
    `, colors.warningBg, colors.warning, '⚠️')}

    <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 15px; line-height: 1.7;">
      La reserva de denominación está próxima a vencer. Es necesario completar las etapas pendientes o renovar la reserva.
    </p>

    <!-- Denominación Card -->
    <div style="background: linear-gradient(135deg, ${colors.warningBg} 0%, #fffbeb 100%); border: 2px solid ${colors.warning}; border-radius: 16px; padding: 28px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 8px 0; color: ${colors.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Denominación</p>
      <p style="margin: 0 0 16px 0; color: ${colors.dark}; font-size: 22px; font-weight: 800;">${denominacion}</p>

      <div style="display: inline-block; background-color: ${colors.warning}; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 700;">
        ⏰ Vence en ${diasParaVencer} días
      </div>
    </div>

    <!-- CTA -->
    <div style="text-align: center; margin: 32px 0 24px 0;">
      ${CTAButton('Ver trámite', `${BASE_URL}/dashboard/admin/tramites/${tramiteId}`, '📋')}
    </div>
  `

  return EmailLayout({
    children: content,
    nombre,
    preheader: `⚠️ La denominación "${denominacion}" vence en ${diasParaVencer} días`
  })
}

// 12. Email de validación de trámite
export const emailValidacionTramite = ({ nombre, denominacion, validado, observaciones, tramiteId }: EmailTemplateProps) => {
  const content = validado ? `
    ${InfoCard(`
      <p style="margin: 0 0 4px 0; color: ${colors.success}; font-size: 18px; font-weight: 700;">
        Trámite Validado
      </p>
      <p style="margin: 0; color: ${colors.text}; font-size: 14px;">
        Tu solicitud ha sido revisada y aprobada
      </p>
    `, colors.successBg, colors.success, '✅')}

    <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 15px; line-height: 1.7;">
      Tu trámite de constitución de <strong>${denominacion}</strong> ha sido revisado y validado por nuestro equipo.
    </p>

    <div style="background-color: ${colors.successBg}; border-radius: 16px; padding: 24px; margin: 24px 0; text-align: center;">
      <span style="font-size: 48px; display: block; margin-bottom: 12px;">🎉</span>
      <p style="margin: 0; color: ${colors.success}; font-size: 16px; font-weight: 600;">
        Procederemos con el siguiente paso del proceso
      </p>
    </div>

    <p style="margin: 0 0 24px 0; color: ${colors.textMuted}; font-size: 14px; line-height: 1.7; text-align: center;">
      Te mantendremos informado sobre cada avance de tu trámite.
    </p>

    <!-- CTA -->
    <div style="text-align: center; margin: 32px 0 24px 0;">
      ${CTAButton('Ver mi trámite', `${BASE_URL}/dashboard/tramites/${tramiteId || ''}`, '📊')}
    </div>
  ` : `
    ${InfoCard(`
      <p style="margin: 0 0 4px 0; color: ${colors.error}; font-size: 18px; font-weight: 700;">
        Trámite Requiere Correcciones
      </p>
      <p style="margin: 0; color: ${colors.text}; font-size: 14px;">
        Encontramos algunos puntos que necesitan atención
      </p>
    `, colors.errorBg, colors.error, '⚠️')}

    <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 15px; line-height: 1.7;">
      Hemos revisado tu trámite de constitución de <strong>${denominacion}</strong> y encontramos algunos puntos que requieren atención.
    </p>

    ${observaciones ? `
    <div style="background-color: ${colors.errorBg}; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #fca5a5;">
      <p style="margin: 0 0 12px 0; color: ${colors.error}; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
        📋 Observaciones:
      </p>
      <p style="margin: 0; color: ${colors.text}; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${observaciones}</p>
    </div>
    ` : ''}

    <p style="margin: 0 0 24px 0; color: ${colors.textMuted}; font-size: 14px; line-height: 1.7;">
      Por favor, revisá la información y realizá las correcciones necesarias para continuar con el proceso.
    </p>

    <!-- CTA -->
    <div style="text-align: center; margin: 32px 0 24px 0;">
      ${CTAButton('Corregir trámite', `${BASE_URL}/dashboard/tramites/${tramiteId || ''}`, '✏️')}
    </div>

    <div style="background-color: ${colors.infoBg}; border-radius: 12px; padding: 16px 20px; margin: 24px 0;">
      <p style="margin: 0; color: ${colors.text}; font-size: 13px; line-height: 1.6;">
        💡 <strong>¿Necesitás ayuda?</strong> Escribinos por WhatsApp o respondé este email.
      </p>
    </div>
  `

  return EmailLayout({
    children: content,
    nombre,
    preheader: validado
      ? `✅ Tu trámite de ${denominacion} ha sido validado`
      : `⚠️ Tu trámite de ${denominacion} requiere correcciones`
  })
}
