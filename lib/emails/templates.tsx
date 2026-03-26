// Plantillas de emails HTML profesionales - Diseño 2024
// Matches QuieroMiSAS website design system

// URL base para los enlaces en emails
const BASE_URL = process.env.NEXTAUTH_URL || 'https://quieromisas.com'

// Logo URL (hosted on the website)
const LOGO_URL = `${BASE_URL}/assets/img/qms-logo-white.png`
const ILLUSTRATION_WELCOME = `${BASE_URL}/assets/img/img_ppal.png`

interface EmailTemplateProps {
  nombre: string
  [key: string]: any
}

// Colores del sistema de diseño
const colors = {
  // Usar mismos valores que --brand-* en globals.css para consistencia
  primary: '#991D23',      // brand-700 (logo)
  primaryDark: '#7a181d', // brand-800
  primaryLight: '#fef2f2', // brand-50
  accent: '#b0242b',       // brand-600
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
  error: '#dc3d42',        // brand-500
  errorBg: '#fde2e3',      // brand-100
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
                      style="height: auto; margin: 0 auto;"
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
                      © ${new Date().getFullYear()} QuieroMiSAS<br/>
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
    <!-- Hero con ilustración -->
    <table cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 15px; line-height: 1.7;">
            Gracias por confiar en nosotros para la constitución de tu sociedad.
            Estamos listos para ayudarte a dar el primer paso hacia tu nueva empresa.
          </p>
          <div style="background-color: ${colors.primaryLight}; border-radius: 16px; padding: 28px; margin: 0 auto 24px auto; max-width: 100%; border: 1px solid ${colors.border};">
            <img
              src="${ILLUSTRATION_WELCOME}"
              alt="Constituí tu empresa"
              width="220"
              style="height: auto; margin: 0 auto 16px auto; display: block;"
            />
            <div style="text-align: center;">
              <h1 style="margin: 0 0 8px 0; color: ${colors.dark}; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                ¡Bienvenido a QuieroMiSAS!
              </h1>
              <p style="margin: 0; color: ${colors.textMuted}; font-size: 14px; font-weight: 500;">
                Tu cuenta ha sido creada exitosamente
              </p>
            </div>
          </div>
        </td>
      </tr>
    </table>

    <!-- Features Grid - diseño mejorado -->
    <table cellpadding="0" cellspacing="0" width="100%" style="margin: 32px 0;">
      <tr>
        <td width="50%" style="padding: 4px; vertical-align: top;">
          <table cellpadding="0" cellspacing="0" width="100%" style="background-color: ${colors.white}; border-radius: 12px; border: 1px solid ${colors.border}; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.04);">
            <tr>
              <td style="padding: 20px;">
                <div style="width: 44px; height: 44px; background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%); border-radius: 12px; text-align: center; line-height: 44px; margin-bottom: 12px;">
                  <span style="font-size: 22px;">⚡</span>
                </div>
                <p style="margin: 0 0 4px 0; color: ${colors.dark}; font-size: 15px; font-weight: 700;">Rápido</p>
                <p style="margin: 0; color: ${colors.textMuted}; font-size: 13px; line-height: 1.5;">Tu S.A.S. lista en solo 5 días hábiles</p>
              </td>
            </tr>
          </table>
        </td>
        <td width="50%" style="padding: 4px; vertical-align: top;">
          <table cellpadding="0" cellspacing="0" width="100%" style="background-color: ${colors.white}; border-radius: 12px; border: 1px solid ${colors.border}; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.04);">
            <tr>
              <td style="padding: 20px;">
                <div style="width: 44px; height: 44px; background: linear-gradient(135deg, ${colors.success} 0%, #059669 100%); border-radius: 12px; text-align: center; line-height: 44px; margin-bottom: 12px;">
                  <span style="font-size: 22px;">🔒</span>
                </div>
                <p style="margin: 0 0 4px 0; color: ${colors.dark}; font-size: 15px; font-weight: 700;">Seguro</p>
                <p style="margin: 0; color: ${colors.textMuted}; font-size: 13px; line-height: 1.5;">Proceso 100% online y documentos protegidos</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td colspan="2" style="height: 16px;"></td>
      </tr>
      <tr>
        <td width="50%" style="padding: 4px; vertical-align: top;">
          <table cellpadding="0" cellspacing="0" width="100%" style="background-color: ${colors.white}; border-radius: 12px; border: 1px solid ${colors.border}; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.04);">
            <tr>
              <td style="padding: 20px;">
                <div style="width: 44px; height: 44px; background: linear-gradient(135deg, ${colors.info} 0%, #2563eb 100%); border-radius: 12px; text-align: center; line-height: 44px; margin-bottom: 12px;">
                  <span style="font-size: 22px;">📊</span>
                </div>
                <p style="margin: 0 0 4px 0; color: ${colors.dark}; font-size: 15px; font-weight: 700;">Seguimiento</p>
                <p style="margin: 0; color: ${colors.textMuted}; font-size: 13px; line-height: 1.5;">Panel online para ver tu progreso 24/7</p>
              </td>
            </tr>
          </table>
        </td>
        <td width="50%" style="padding: 4px; vertical-align: top;">
          <table cellpadding="0" cellspacing="0" width="100%" style="background-color: ${colors.white}; border-radius: 12px; border: 1px solid ${colors.border}; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.04);">
            <tr>
              <td style="padding: 20px;">
                <div style="width: 44px; height: 44px; background: linear-gradient(135deg, ${colors.warning} 0%, #d97706 100%); border-radius: 12px; text-align: center; line-height: 44px; margin-bottom: 12px;">
                  <span style="font-size: 22px;">💬</span>
                </div>
                <p style="margin: 0 0 4px 0; color: ${colors.dark}; font-size: 15px; font-weight: 700;">Soporte</p>
                <p style="margin: 0; color: ${colors.textMuted}; font-size: 13px; line-height: 1.5;">Equipo experto disponible para ayudarte</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA destacado -->
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

// 1b. Verificación de email (activar cuenta)
export const emailVerificarCuenta = ({ nombre, verifyUrl }: EmailTemplateProps) => {
  const content = `
    <h2 style="margin: 0 0 12px 0; color: ${colors.dark}; font-size: 22px; font-weight: 800;">
      Confirmá tu email
    </h2>
    <p style="margin: 0 0 16px 0; color: ${colors.textMuted}; font-size: 15px; line-height: 1.7;">
      Para activar tu cuenta y poder completar tu trámite, necesitamos que confirmes tu dirección de email.
    </p>

    <div style="text-align: center; margin: 24px 0;">
      <a
        href="${verifyUrl}"
        class="button"
        style="display: inline-block; background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%); color: ${colors.white}; padding: 14px 28px; border-radius: 12px; font-size: 16px; font-weight: 800; box-shadow: 0 8px 20px rgba(153, 29, 35, 0.25);"
      >
        Verificar email →
      </a>
    </div>

    <div style="background-color: ${colors.background}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 16px; margin-top: 16px;">
      <p style="margin: 0; color: ${colors.textMuted}; font-size: 13px; line-height: 1.6;">
        Si el botón no funciona, copiá y pegá este link en tu navegador:
        <br />
        <span style="word-break: break-all; color: ${colors.primary}; font-weight: 600;">${verifyUrl}</span>
      </p>
    </div>

    <p style="margin: 16px 0 0 0; color: ${colors.textLight}; font-size: 12px; line-height: 1.6;">
      Este link expira en 24 horas.
    </p>
  `

  return EmailLayout({
    children: content,
    nombre,
    preheader: 'Confirmá tu email para activar tu cuenta en QuieroMiSAS.'
  })
}

// 2. Email cuando se envía un trámite
export const emailTramiteEnviado = ({ nombre, tramiteId, denominacion }: EmailTemplateProps) => {
  const content = `
    <!-- Intro -->
    <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 15px; line-height: 1.7;">
      Hemos recibido tu solicitud de constitución. Te mantendremos informado en cada etapa del proceso.
    </p>

    <!-- Hero con ilustración y denominación -->
    <table cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <div style="background-color: ${colors.successBg}; border-radius: 16px; padding: 28px; margin: 0 auto 24px auto; max-width: 100%; border: 1px solid ${colors.border};">
            <div style="width: 56px; height: 56px; background: linear-gradient(135deg, ${colors.success} 0%, #059669 100%); border-radius: 16px; text-align: center; line-height: 56px; margin: 0 auto 16px auto;">
              <span style="font-size: 28px;">✅</span>
            </div>
            <div style="text-align: center;">
              <h1 style="margin: 0 0 8px 0; color: ${colors.dark}; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                ¡Trámite Recibido!
              </h1>
              <p style="margin: 0 0 20px 0; color: ${colors.textMuted}; font-size: 14px; font-weight: 500;">
                Hemos recibido tu solicitud de constitución
              </p>
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto; background-color: ${colors.white}; border-radius: 12px; padding: 20px; border: 1px solid ${colors.border};">
                <tr>
                  <td style="text-align: center; padding: 16px 24px;">
                    <p style="margin: 0 0 4px 0; color: ${colors.textMuted}; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Tu Sociedad</p>
                    <p style="margin: 0; color: ${colors.dark}; font-size: 22px; font-weight: 800;">${denominacion}</p>
                  </td>
                </tr>
              </table>
            </div>
          </div>
        </td>
      </tr>
    </table>

    <!-- Próximos pasos - cards estilo Bienvenida -->
    <p style="margin: 0 0 16px 0; color: ${colors.text}; font-size: 15px; font-weight: 600;">
      Próximos pasos:
    </p>

    <table cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 24px 0;">
      <tr>
        <td width="50%" style="padding: 4px; vertical-align: top;">
          <table cellpadding="0" cellspacing="0" width="100%" style="background-color: ${colors.white}; border-radius: 12px; border: 2px solid ${colors.success}; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.04);">
            <tr>
              <td style="padding: 20px;">
                <div style="width: 44px; height: 44px; background: linear-gradient(135deg, ${colors.success} 0%, #059669 100%); border-radius: 12px; text-align: center; line-height: 44px; margin-bottom: 12px;">
                  <span style="font-size: 20px; color: white;">✓</span>
                </div>
                <p style="margin: 0 0 4px 0; color: ${colors.dark}; font-size: 15px; font-weight: 700;">1. Revisión</p>
                <p style="margin: 0; color: ${colors.textMuted}; font-size: 13px; line-height: 1.5;">Validamos tu documentación</p>
              </td>
            </tr>
          </table>
        </td>
        <td width="50%" style="padding: 4px; vertical-align: top;">
          <table cellpadding="0" cellspacing="0" width="100%" style="background-color: ${colors.white}; border-radius: 12px; border: 1px solid ${colors.border}; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.04);">
            <tr>
              <td style="padding: 20px;">
                <div style="width: 44px; height: 44px; background-color: ${colors.background}; border-radius: 12px; text-align: center; line-height: 44px; margin-bottom: 12px;">
                  <span style="font-size: 18px; font-weight: 700; color: ${colors.textMuted};">2</span>
                </div>
                <p style="margin: 0 0 4px 0; color: ${colors.dark}; font-size: 15px; font-weight: 700;">2. Pagos</p>
                <p style="margin: 0; color: ${colors.textMuted}; font-size: 13px; line-height: 1.5;">Te notificamos los montos</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td colspan="2" style="height: 8px;"></td>
      </tr>
      <tr>
        <td width="50%" style="padding: 4px; vertical-align: top;">
          <table cellpadding="0" cellspacing="0" width="100%" style="background-color: ${colors.white}; border-radius: 12px; border: 1px solid ${colors.border}; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.04);">
            <tr>
              <td style="padding: 20px;">
                <div style="width: 44px; height: 44px; background-color: ${colors.background}; border-radius: 12px; text-align: center; line-height: 44px; margin-bottom: 12px;">
                  <span style="font-size: 18px; font-weight: 700; color: ${colors.textMuted};">3</span>
                </div>
                <p style="margin: 0 0 4px 0; color: ${colors.dark}; font-size: 15px; font-weight: 700;">3. Documentos</p>
                <p style="margin: 0; color: ${colors.textMuted}; font-size: 13px; line-height: 1.5;">Firma y presentación</p>
              </td>
            </tr>
          </table>
        </td>
        <td width="50%" style="padding: 4px; vertical-align: top;">
          <table cellpadding="0" cellspacing="0" width="100%" style="background-color: ${colors.white}; border-radius: 12px; border: 1px solid ${colors.border}; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.04);">
            <tr>
              <td style="padding: 20px;">
                <div style="width: 44px; height: 44px; background-color: ${colors.background}; border-radius: 12px; text-align: center; line-height: 44px; margin-bottom: 12px;">
                  <span style="font-size: 18px; font-weight: 700; color: ${colors.textMuted};">4</span>
                </div>
                <p style="margin: 0 0 4px 0; color: ${colors.dark}; font-size: 15px; font-weight: 700;">4. Inscripción</p>
                <p style="margin: 0; color: ${colors.textMuted}; font-size: 13px; line-height: 1.5;">Tu S.A.S. lista</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- ¿Qué sigue? - card informativa -->
    <table cellpadding="0" cellspacing="0" width="100%" style="background-color: ${colors.infoBg}; border-radius: 12px; border: 1px solid ${colors.border}; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.04); margin: 24px 0;">
      <tr>
        <td style="padding: 20px;">
          <div style="width: 44px; height: 44px; background: linear-gradient(135deg, ${colors.info} 0%, #2563eb 100%); border-radius: 12px; text-align: center; line-height: 44px; margin-bottom: 12px;">
            <span style="font-size: 22px;">💡</span>
          </div>
          <p style="margin: 0 0 4px 0; color: ${colors.dark}; font-size: 15px; font-weight: 700;">¿Qué sigue?</p>
          <p style="margin: 0; color: ${colors.text}; font-size: 14px; line-height: 1.7;">
            Nuestro equipo revisará tu solicitud en las próximas horas y te notificaremos sobre los pagos necesarios para continuar.
          </p>
        </td>
      </tr>
    </table>

    <!-- CTA destacado -->
    <div style="text-align: center; margin: 40px 0 24px 0;">
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
    <!-- Intro -->
    <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 15px; line-height: 1.7;">
      Para avanzar con la constitución de tu sociedad, necesitamos que realices el siguiente pago:
    </p>

    <!-- Hero -->
    <table cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <div style="background-color: ${colors.warningBg}; border-radius: 16px; padding: 28px; margin: 0 auto 24px auto; max-width: 100%; border: 1px solid ${colors.border};">
            <div style="width: 56px; height: 56px; background: linear-gradient(135deg, ${colors.warning} 0%, #d97706 100%); border-radius: 16px; text-align: center; line-height: 56px; margin: 0 auto 16px auto;">
              <span style="font-size: 28px;">💳</span>
            </div>
            <div style="text-align: center;">
              <h1 style="margin: 0 0 8px 0; color: ${colors.dark}; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                Pago Requerido
              </h1>
              <p style="margin: 0 0 20px 0; color: ${colors.textMuted}; font-size: 14px; font-weight: 500;">
                Para continuar con tu trámite
              </p>
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto; background-color: ${colors.white}; border-radius: 12px; border: 1px solid ${colors.border};">
                <tr>
                  <td style="text-align: center; padding: 20px 28px;">
                    <p style="margin: 0 0 4px 0; color: ${colors.textMuted}; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Concepto</p>
                    <p style="margin: 0 0 16px 0; color: ${colors.dark}; font-size: 18px; font-weight: 700;">${concepto}</p>
                    <p style="margin: 0 0 4px 0; color: ${colors.textMuted}; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Monto</p>
                    <p style="margin: 0; color: ${colors.warning}; font-size: 36px; font-weight: 900;">$${Number(monto).toLocaleString('es-AR')}</p>
                  </td>
                </tr>
              </table>
            </div>
          </div>
        </td>
      </tr>
    </table>

    <!-- Tip card -->
    <table cellpadding="0" cellspacing="0" width="100%" style="background-color: ${colors.white}; border-radius: 12px; border: 1px solid ${colors.border}; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.04); margin: 24px 0;">
      <tr>
        <td style="padding: 20px;">
          <div style="width: 44px; height: 44px; background: linear-gradient(135deg, ${colors.info} 0%, #2563eb 100%); border-radius: 12px; text-align: center; line-height: 44px; margin-bottom: 12px;">
            <span style="font-size: 22px;">💡</span>
          </div>
          <p style="margin: 0 0 4px 0; color: ${colors.dark}; font-size: 15px; font-weight: 700;">Tip</p>
          <p style="margin: 0; color: ${colors.text}; font-size: 14px; line-height: 1.7;">
            Una vez realizado el pago, no olvides adjuntar tu comprobante en la plataforma para que podamos verificarlo rápidamente.
          </p>
        </td>
      </tr>
    </table>

    <!-- CTA destacado -->
    <div style="text-align: center; margin: 40px 0 24px 0;">
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
    <!-- Intro -->
    <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 15px; line-height: 1.7;">
      Hemos revisado el documento <strong>"${nombreDocumento}"</strong> y necesita algunas correcciones para poder continuar.
    </p>

    <!-- Hero -->
    <table cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <div style="background-color: ${colors.errorBg}; border-radius: 16px; padding: 28px; margin: 0 auto 24px auto; max-width: 100%; border: 1px solid ${colors.border};">
            <div style="width: 56px; height: 56px; background: linear-gradient(135deg, ${colors.error} 0%, ${colors.primaryDark} 100%); border-radius: 16px; text-align: center; line-height: 56px; margin: 0 auto 16px auto;">
              <span style="font-size: 28px;">📄</span>
            </div>
            <div style="text-align: center;">
              <h1 style="margin: 0 0 8px 0; color: ${colors.dark}; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                Documento Requiere Corrección
              </h1>
              <p style="margin: 0; color: ${colors.textMuted}; font-size: 14px; font-weight: 500;">
                Necesitamos que hagas algunos ajustes
              </p>
            </div>
          </div>
        </td>
      </tr>
    </table>

    <!-- Observaciones card -->
    <table cellpadding="0" cellspacing="0" width="100%" style="background-color: ${colors.white}; border-radius: 12px; border: 2px solid ${colors.error}; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.04); margin: 24px 0;">
      <tr>
        <td style="padding: 20px;">
          <div style="width: 44px; height: 44px; background: linear-gradient(135deg, ${colors.warning} 0%, #d97706 100%); border-radius: 12px; text-align: center; line-height: 44px; margin-bottom: 12px;">
            <span style="font-size: 22px;">⚠️</span>
          </div>
          <p style="margin: 0 0 8px 0; color: ${colors.dark}; font-size: 15px; font-weight: 700;">Observaciones</p>
          <p style="margin: 0; color: ${colors.text}; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${observaciones}</p>
        </td>
      </tr>
    </table>

    <!-- Ayuda card -->
    <table cellpadding="0" cellspacing="0" width="100%" style="background-color: ${colors.infoBg}; border-radius: 12px; border: 1px solid ${colors.border}; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.04); margin: 24px 0;">
      <tr>
        <td style="padding: 20px;">
          <div style="width: 44px; height: 44px; background: linear-gradient(135deg, ${colors.info} 0%, #2563eb 100%); border-radius: 12px; text-align: center; line-height: 44px; margin-bottom: 12px;">
            <span style="font-size: 22px;">💡</span>
          </div>
          <p style="margin: 0 0 4px 0; color: ${colors.dark}; font-size: 15px; font-weight: 700;">¿Necesitás ayuda?</p>
          <p style="margin: 0; color: ${colors.text}; font-size: 14px; line-height: 1.7;">
            Escribinos por WhatsApp y te guiamos con las correcciones necesarias.
          </p>
        </td>
      </tr>
    </table>

    <!-- CTA destacado -->
    <div style="text-align: center; margin: 40px 0 24px 0;">
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
    <!-- Intro -->
    <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 15px; line-height: 1.7;">
      ¡Buenas noticias! Hemos completado una etapa importante de tu trámite.
    </p>

    <!-- Hero -->
    <table cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <div style="background-color: ${colors.successBg}; border-radius: 16px; padding: 28px; margin: 0 auto 24px auto; max-width: 100%; border: 1px solid ${colors.border};">
            <div style="width: 56px; height: 56px; background: linear-gradient(135deg, ${colors.success} 0%, #059669 100%); border-radius: 16px; text-align: center; line-height: 56px; margin: 0 auto 16px auto;">
              <span style="font-size: 28px;">🎯</span>
            </div>
            <div style="text-align: center;">
              <h1 style="margin: 0 0 8px 0; color: ${colors.dark}; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                ¡Progreso en tu Trámite!
              </h1>
              <p style="margin: 0 0 20px 0; color: ${colors.textMuted}; font-size: 14px; font-weight: 500;">
                Una etapa importante ha sido completada
              </p>
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto; background-color: ${colors.white}; border-radius: 12px; border: 2px solid ${colors.success};">
                <tr>
                  <td style="text-align: center; padding: 20px 28px;">
                    <p style="margin: 0; color: ${colors.success}; font-size: 20px; font-weight: 800;">${etapa}</p>
                  </td>
                </tr>
              </table>
            </div>
          </div>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 24px 0; color: ${colors.textMuted}; font-size: 14px; line-height: 1.7; text-align: center;">
      Seguimos trabajando en tu trámite. Te mantendremos informado de cada avance. 🚀
    </p>

    <!-- CTA destacado -->
    <div style="text-align: center; margin: 40px 0 24px 0;">
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
    <!-- Intro -->
    <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 15px; line-height: 1.7; text-align: center;">
      ¡Excelentes noticias! Tu sociedad ha sido inscripta exitosamente y ya está oficialmente constituida.
      Ahora podés empezar a operar con tu nueva empresa.
    </p>

    <!-- Hero con celebración -->
    <table cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <div style="background-color: ${colors.successBg}; border-radius: 16px; padding: 28px; margin: 0 auto 24px auto; max-width: 100%; border: 1px solid ${colors.border};">
            <div style="width: 56px; height: 56px; background: linear-gradient(135deg, ${colors.success} 0%, #059669 100%); border-radius: 16px; text-align: center; line-height: 56px; margin: 0 auto 16px auto;">
              <span style="font-size: 28px;">🎉</span>
            </div>
            <div style="text-align: center;">
              <h1 style="margin: 0 0 8px 0; color: ${colors.dark}; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                ¡Felicitaciones!
              </h1>
              <p style="margin: 0 0 20px 0; color: ${colors.textMuted}; font-size: 14px; font-weight: 500;">
                Tu sociedad está oficialmente inscripta
              </p>
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto; background-color: ${colors.white}; border-radius: 12px; border: 1px solid ${colors.border};">
                <tr>
                  <td style="text-align: center; padding: 20px 28px;">
                    <p style="margin: 0 0 4px 0; color: ${colors.textMuted}; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Denominación Social</p>
                    <p style="margin: 0; color: ${colors.dark}; font-size: 22px; font-weight: 800;">${denominacion}</p>
                  </td>
                </tr>
              </table>
            </div>
          </div>
        </td>
      </tr>
    </table>

    ${(cuit || matricula) ? `
    <!-- Datos oficiales - cards -->
    <table cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
      <tr>
        ${cuit ? `
        <td width="${matricula ? '50' : '100'}%" style="padding: 4px; vertical-align: top;">
          <table cellpadding="0" cellspacing="0" width="100%" style="background-color: ${colors.white}; border-radius: 12px; border: 1px solid ${colors.border}; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.04);">
            <tr>
              <td style="padding: 20px; text-align: center;">
                <div style="width: 44px; height: 44px; background: linear-gradient(135deg, ${colors.success} 0%, #059669 100%); border-radius: 12px; text-align: center; line-height: 44px; margin: 0 auto 12px auto;">
                  <span style="font-size: 20px; color: white;">#</span>
                </div>
                <p style="margin: 0 0 4px 0; color: ${colors.textMuted}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">CUIT</p>
                <p style="margin: 0; color: ${colors.dark}; font-size: 18px; font-weight: 800;">${cuit}</p>
              </td>
            </tr>
          </table>
        </td>
        ` : ''}
        ${matricula ? `
        <td width="${cuit ? '50' : '100'}%" style="padding: 4px; vertical-align: top;">
          <table cellpadding="0" cellspacing="0" width="100%" style="background-color: ${colors.white}; border-radius: 12px; border: 1px solid ${colors.border}; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.04);">
            <tr>
              <td style="padding: 20px; text-align: center;">
                <div style="width: 44px; height: 44px; background: linear-gradient(135deg, ${colors.info} 0%, #2563eb 100%); border-radius: 12px; text-align: center; line-height: 44px; margin: 0 auto 12px auto;">
                  <span style="font-size: 20px; color: white;">📋</span>
                </div>
                <p style="margin: 0 0 4px 0; color: ${colors.textMuted}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Matrícula</p>
                <p style="margin: 0; color: ${colors.dark}; font-size: 18px; font-weight: 800;">${matricula}</p>
              </td>
            </tr>
          </table>
        </td>
        ` : ''}
      </tr>
    </table>
    ` : ''}

    <!-- ¿Qué sigue? - card -->
    <table cellpadding="0" cellspacing="0" width="100%" style="background-color: ${colors.white}; border-radius: 12px; border: 1px solid ${colors.border}; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.04); margin: 24px 0;">
      <tr>
        <td style="padding: 20px;">
          <div style="width: 44px; height: 44px; background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%); border-radius: 12px; text-align: center; line-height: 44px; margin-bottom: 12px;">
            <span style="font-size: 22px;">📌</span>
          </div>
          <p style="margin: 0 0 12px 0; color: ${colors.dark}; font-size: 15px; font-weight: 700;">¿Qué sigue ahora?</p>
          <ul style="margin: 0; padding-left: 20px; color: ${colors.text}; font-size: 14px; line-height: 2;">
            <li>Descargá la Resolución de Inscripción desde tu panel</li>
            <li>Tramitá la Constancia de CUIT en AFIP</li>
            <li>Abrí tu cuenta bancaria empresarial</li>
            <li>¡Comenzá a operar! 🚀</li>
          </ul>
        </td>
      </tr>
    </table>

    <!-- CTA destacado -->
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
    <!-- Hero -->
    <table cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <div style="background-color: ${colors.infoBg}; border-radius: 16px; padding: 28px; margin: 0 auto 24px auto; max-width: 100%; border: 1px solid ${colors.border};">
            <div style="width: 56px; height: 56px; background: linear-gradient(135deg, ${colors.info} 0%, #2563eb 100%); border-radius: 16px; text-align: center; line-height: 56px; margin: 0 auto 16px auto;">
              <span style="font-size: 28px;">📬</span>
            </div>
            <div style="text-align: center;">
              <h1 style="margin: 0 0 8px 0; color: ${colors.dark}; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                ${titulo}
              </h1>
            </div>
          </div>
        </td>
      </tr>
    </table>

    <!-- Mensaje -->
    <table cellpadding="0" cellspacing="0" width="100%" style="background-color: ${colors.white}; border-radius: 12px; border: 1px solid ${colors.border}; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.04); margin: 24px 0;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0; color: ${colors.text}; font-size: 15px; line-height: 1.7;">
            ${mensaje}
          </p>
        </td>
      </tr>
    </table>

    ${tramiteId ? `
    <!-- CTA destacado -->
    <div style="text-align: center; margin: 40px 0 24px 0;">
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
    <!-- Intro -->
    <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 15px; line-height: 1.7;">
      Este es un recordatorio amigable: tenés un pago pendiente que está deteniendo el avance de tu trámite.
    </p>

    <!-- Hero -->
    <table cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <div style="background-color: ${colors.warningBg}; border-radius: 16px; padding: 28px; margin: 0 auto 24px auto; max-width: 100%; border: 1px solid ${colors.border};">
            <div style="width: 56px; height: 56px; background: linear-gradient(135deg, ${colors.warning} 0%, #d97706 100%); border-radius: 16px; text-align: center; line-height: 56px; margin: 0 auto 16px auto;">
              <span style="font-size: 28px;">⏰</span>
            </div>
            <div style="text-align: center;">
              <h1 style="margin: 0 0 8px 0; color: ${colors.dark}; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                Recordatorio: Pago Pendiente
              </h1>
              <p style="margin: 0 0 20px 0; color: ${colors.textMuted}; font-size: 14px; font-weight: 500;">
                Hace ${diasPendientes} días que tenés un pago pendiente
              </p>
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto; background-color: ${colors.white}; border-radius: 12px; border: 1px solid ${colors.border};">
                <tr>
                  <td style="text-align: center; padding: 20px 28px;">
                    <p style="margin: 0 0 4px 0; color: ${colors.textMuted}; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Concepto</p>
                    <p style="margin: 0 0 16px 0; color: ${colors.dark}; font-size: 18px; font-weight: 700;">${concepto}</p>
                    <p style="margin: 0; color: ${colors.warning}; font-size: 36px; font-weight: 900;">$${Number(monto).toLocaleString('es-AR')}</p>
                  </td>
                </tr>
              </table>
            </div>
          </div>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 24px 0; color: ${colors.textMuted}; font-size: 14px; line-height: 1.7;">
      Para continuar con tu trámite, por favor realizá este pago a la brevedad.
      Si ya lo realizaste, no olvides subir el comprobante.
    </p>

    <!-- CTA destacado -->
    <div style="text-align: center; margin: 40px 0 24px 0;">
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
    <!-- Intro -->
    <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 15px; line-height: 1.7;">
      Te recordamos que hace <strong>${diasPendientes} días</strong> te solicitamos correcciones en el documento
      <strong>"${nombreDocumento}"</strong> y aún no lo hemos recibido.
    </p>

    <!-- Hero -->
    <table cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <div style="background-color: ${colors.errorBg}; border-radius: 16px; padding: 28px; margin: 0 auto 24px auto; max-width: 100%; border: 1px solid ${colors.border};">
            <div style="width: 56px; height: 56px; background: linear-gradient(135deg, ${colors.error} 0%, ${colors.primaryDark} 100%); border-radius: 16px; text-align: center; line-height: 56px; margin: 0 auto 16px auto;">
              <span style="font-size: 28px;">⏰</span>
            </div>
            <div style="text-align: center;">
              <h1 style="margin: 0 0 8px 0; color: ${colors.dark}; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                Documento Pendiente
              </h1>
              <p style="margin: 0; color: ${colors.textMuted}; font-size: 14px; font-weight: 500;">
                Hace ${diasPendientes} días que esperamos el documento corregido
              </p>
            </div>
          </div>
        </td>
      </tr>
    </table>

    <!-- Observaciones card -->
    <table cellpadding="0" cellspacing="0" width="100%" style="background-color: ${colors.white}; border-radius: 12px; border: 2px solid ${colors.error}; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.04); margin: 24px 0;">
      <tr>
        <td style="padding: 20px;">
          <div style="width: 44px; height: 44px; background: linear-gradient(135deg, ${colors.warning} 0%, #d97706 100%); border-radius: 12px; text-align: center; line-height: 44px; margin-bottom: 12px;">
            <span style="font-size: 22px;">📋</span>
          </div>
          <p style="margin: 0 0 8px 0; color: ${colors.dark}; font-size: 15px; font-weight: 700;">Observaciones originales</p>
          <p style="margin: 0; color: ${colors.text}; font-size: 14px; line-height: 1.7;">${observaciones}</p>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 24px 0; color: ${colors.textMuted}; font-size: 14px; line-height: 1.7;">
      Para que podamos avanzar con tu trámite, necesitamos que subas el documento corregido lo antes posible.
    </p>

    <!-- CTA destacado -->
    <div style="text-align: center; margin: 40px 0 24px 0;">
      ${CTAButton('Subir documento ahora', `${BASE_URL}/dashboard/tramites/${tramiteId}`, '📤')}
    </div>

    <!-- Ayuda card -->
    <table cellpadding="0" cellspacing="0" width="100%" style="background-color: ${colors.infoBg}; border-radius: 12px; border: 1px solid ${colors.border}; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.04); margin: 24px 0;">
      <tr>
        <td style="padding: 20px;">
          <div style="width: 44px; height: 44px; background: linear-gradient(135deg, ${colors.info} 0%, #2563eb 100%); border-radius: 12px; text-align: center; line-height: 44px; margin-bottom: 12px;">
            <span style="font-size: 22px;">💡</span>
          </div>
          <p style="margin: 0 0 4px 0; color: ${colors.dark}; font-size: 15px; font-weight: 700;">¿Necesitás ayuda?</p>
          <p style="margin: 0; color: ${colors.text}; font-size: 14px; line-height: 1.7;">
            Escribinos por WhatsApp y te guiamos con las correcciones.
          </p>
        </td>
      </tr>
    </table>
  `

  return EmailLayout({
    children: content,
    nombre,
    preheader: `Recordatorio: Tu documento "${nombreDocumento}" está pendiente hace ${diasPendientes} días`
  })
}

// 10. Recordatorio de trámite estancado
export const emailRecordatorioTramiteEstancado = ({ nombre, etapaActual, diasEstancado, tramiteId }: EmailTemplateProps) => {
  const actions = [
    { emoji: '💳', text: 'Verificar si hay pagos pendientes' },
    { emoji: '📄', text: 'Revisar si hay documentos por subir' },
    { emoji: '📊', text: 'Consultar el estado en tu panel' },
    { emoji: '💬', text: 'Contactar a nuestro equipo si tenés dudas' }
  ]
  const content = `
    <!-- Intro -->
    <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 15px; line-height: 1.7;">
      Notamos que tu trámite lleva <strong>${diasEstancado} días</strong> en la etapa
      <strong>"${etapaActual}"</strong>. ¿Hay algo en lo que podamos ayudarte?
    </p>

    <!-- Hero -->
    <table cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <div style="background-color: ${colors.infoBg}; border-radius: 16px; padding: 28px; margin: 0 auto 24px auto; max-width: 100%; border: 1px solid ${colors.border};">
            <div style="width: 56px; height: 56px; background: linear-gradient(135deg, ${colors.info} 0%, #2563eb 100%); border-radius: 16px; text-align: center; line-height: 56px; margin: 0 auto 16px auto;">
              <span style="font-size: 28px;">👋</span>
            </div>
            <div style="text-align: center;">
              <h1 style="margin: 0 0 8px 0; color: ${colors.dark}; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                ¿Necesitás ayuda?
              </h1>
              <p style="margin: 0; color: ${colors.textMuted}; font-size: 14px; font-weight: 500;">
                Tu trámite lleva ${diasEstancado} días sin avanzar
              </p>
            </div>
          </div>
        </td>
      </tr>
    </table>

    <!-- Posibles acciones - cards -->
    <table cellpadding="0" cellspacing="0" width="100%" style="background-color: ${colors.white}; border-radius: 12px; border: 1px solid ${colors.border}; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.04); margin: 24px 0;">
      <tr>
        <td style="padding: 20px;">
          <div style="width: 44px; height: 44px; background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%); border-radius: 12px; text-align: center; line-height: 44px; margin-bottom: 12px;">
            <span style="font-size: 22px;">📋</span>
          </div>
          <p style="margin: 0 0 16px 0; color: ${colors.dark}; font-size: 15px; font-weight: 700;">Posibles acciones pendientes</p>
          <table cellpadding="0" cellspacing="0" width="100%">
            ${actions.map(item => `
              <tr>
                <td style="padding: 8px 0;">
                  <span style="font-size: 16px; margin-right: 12px;">${item.emoji}</span>
                  <span style="color: ${colors.text}; font-size: 14px;">${item.text}</span>
                </td>
              </tr>
            `).join('')}
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA destacado -->
    <div style="text-align: center; margin: 40px 0 24px 0;">
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
    <!-- Intro -->
    <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 15px; line-height: 1.7;">
      La reserva de denominación está próxima a vencer. Es necesario completar las etapas pendientes o renovar la reserva.
    </p>

    <!-- Hero -->
    <table cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <div style="background-color: ${colors.warningBg}; border-radius: 16px; padding: 28px; margin: 0 auto 24px auto; max-width: 100%; border: 1px solid ${colors.border};">
            <div style="width: 56px; height: 56px; background: linear-gradient(135deg, ${colors.warning} 0%, #d97706 100%); border-radius: 16px; text-align: center; line-height: 56px; margin: 0 auto 16px auto;">
              <span style="font-size: 28px;">⚠️</span>
            </div>
            <div style="text-align: center;">
              <h1 style="margin: 0 0 8px 0; color: ${colors.dark}; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                Denominación Próxima a Vencer
              </h1>
              <p style="margin: 0 0 20px 0; color: ${colors.textMuted}; font-size: 14px; font-weight: 500;">
                Quedan ${diasParaVencer} días para que venza
              </p>
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto; background-color: ${colors.white}; border-radius: 12px; border: 1px solid ${colors.border};">
                <tr>
                  <td style="text-align: center; padding: 20px 28px;">
                    <p style="margin: 0 0 4px 0; color: ${colors.textMuted}; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Denominación</p>
                    <p style="margin: 0 0 12px 0; color: ${colors.dark}; font-size: 22px; font-weight: 800;">${denominacion}</p>
                    <span style="background-color: ${colors.warning}; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 700;">⏰ Vence en ${diasParaVencer} días</span>
                  </td>
                </tr>
              </table>
            </div>
          </div>
        </td>
      </tr>
    </table>

    <!-- CTA destacado -->
    <div style="text-align: center; margin: 40px 0 24px 0;">
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
    <!-- Intro -->
    <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 15px; line-height: 1.7;">
      Tu trámite de constitución de <strong>${denominacion}</strong> ha sido revisado y validado por nuestro equipo.
    </p>

    <!-- Hero validado -->
    <table cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <div style="background-color: ${colors.successBg}; border-radius: 16px; padding: 28px; margin: 0 auto 24px auto; max-width: 100%; border: 1px solid ${colors.border};">
            <div style="width: 56px; height: 56px; background: linear-gradient(135deg, ${colors.success} 0%, #059669 100%); border-radius: 16px; text-align: center; line-height: 56px; margin: 0 auto 16px auto;">
              <span style="font-size: 28px;">✅</span>
            </div>
            <div style="text-align: center;">
              <h1 style="margin: 0 0 8px 0; color: ${colors.dark}; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                Trámite Validado
              </h1>
              <p style="margin: 0 0 20px 0; color: ${colors.textMuted}; font-size: 14px; font-weight: 500;">
                Tu solicitud ha sido revisada y aprobada
              </p>
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto; background-color: ${colors.white}; border-radius: 12px; border: 1px solid ${colors.border};">
                <tr>
                  <td style="text-align: center; padding: 20px 28px;">
                    <p style="margin: 0; color: ${colors.success}; font-size: 16px; font-weight: 600;">Procederemos con el siguiente paso del proceso</p>
                  </td>
                </tr>
              </table>
            </div>
          </div>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 24px 0; color: ${colors.textMuted}; font-size: 14px; line-height: 1.7; text-align: center;">
      Te mantendremos informado sobre cada avance de tu trámite.
    </p>

    <!-- CTA destacado -->
    <div style="text-align: center; margin: 40px 0 24px 0;">
      ${CTAButton('Ver mi trámite', `${BASE_URL}/dashboard/tramites/${tramiteId || ''}`, '📊')}
    </div>
  ` : `
    <!-- Intro -->
    <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 15px; line-height: 1.7;">
      Hemos revisado tu trámite de constitución de <strong>${denominacion}</strong> y encontramos algunos puntos que requieren atención.
    </p>

    <!-- Hero requiere correcciones -->
    <table cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <div style="background-color: ${colors.errorBg}; border-radius: 16px; padding: 28px; margin: 0 auto 24px auto; max-width: 100%; border: 1px solid ${colors.border};">
            <div style="width: 56px; height: 56px; background: linear-gradient(135deg, ${colors.error} 0%, ${colors.primaryDark} 100%); border-radius: 16px; text-align: center; line-height: 56px; margin: 0 auto 16px auto;">
              <span style="font-size: 28px;">⚠️</span>
            </div>
            <div style="text-align: center;">
              <h1 style="margin: 0 0 8px 0; color: ${colors.dark}; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                Trámite Requiere Correcciones
              </h1>
              <p style="margin: 0; color: ${colors.textMuted}; font-size: 14px; font-weight: 500;">
                Encontramos algunos puntos que necesitan atención
              </p>
            </div>
          </div>
        </td>
      </tr>
    </table>

    ${observaciones ? `
    <!-- Observaciones card -->
    <table cellpadding="0" cellspacing="0" width="100%" style="background-color: ${colors.white}; border-radius: 12px; border: 2px solid ${colors.error}; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.04); margin: 24px 0;">
      <tr>
        <td style="padding: 20px;">
          <div style="width: 44px; height: 44px; background: linear-gradient(135deg, ${colors.warning} 0%, #d97706 100%); border-radius: 12px; text-align: center; line-height: 44px; margin-bottom: 12px;">
            <span style="font-size: 22px;">📋</span>
          </div>
          <p style="margin: 0 0 8px 0; color: ${colors.dark}; font-size: 15px; font-weight: 700;">Observaciones</p>
          <p style="margin: 0; color: ${colors.text}; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${observaciones}</p>
        </td>
      </tr>
    </table>
    ` : ''}

    <p style="margin: 0 0 24px 0; color: ${colors.textMuted}; font-size: 14px; line-height: 1.7;">
      Por favor, revisá la información y realizá las correcciones necesarias para continuar con el proceso.
    </p>

    <!-- CTA destacado -->
    <div style="text-align: center; margin: 40px 0 24px 0;">
      ${CTAButton('Corregir trámite', `${BASE_URL}/dashboard/tramites/${tramiteId || ''}`, '✏️')}
    </div>

    <!-- Ayuda card -->
    <table cellpadding="0" cellspacing="0" width="100%" style="background-color: ${colors.infoBg}; border-radius: 12px; border: 1px solid ${colors.border}; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.04); margin: 24px 0;">
      <tr>
        <td style="padding: 20px;">
          <div style="width: 44px; height: 44px; background: linear-gradient(135deg, ${colors.info} 0%, #2563eb 100%); border-radius: 12px; text-align: center; line-height: 44px; margin-bottom: 12px;">
            <span style="font-size: 22px;">💡</span>
          </div>
          <p style="margin: 0 0 4px 0; color: ${colors.dark}; font-size: 15px; font-weight: 700;">¿Necesitás ayuda?</p>
          <p style="margin: 0; color: ${colors.text}; font-size: 14px; line-height: 1.7;">
            Escribinos por WhatsApp o respondé este email.
          </p>
        </td>
      </tr>
    </table>
  `

  return EmailLayout({
    children: content,
    nombre,
    preheader: validado
      ? `✅ Tu trámite de ${denominacion} ha sido validado`
      : `⚠️ Tu trámite de ${denominacion} requiere correcciones`
  })
}
