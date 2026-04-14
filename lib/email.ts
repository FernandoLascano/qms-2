import nodemailer from 'nodemailer'

// Configuración del transporter SMTP (Amazon SES)
const smtpPort = parseInt(process.env.SMTP_PORT || '587')
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'email-smtp.us-east-1.amazonaws.com',
  port: smtpPort,
  secure: smtpPort === 465, // true para 465, false para 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
})

interface EmailOptions {
  to: string | string[]
  cc?: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
  attachments?: Array<{
    filename: string
    content: Buffer
    contentType?: string
  }>
}

export async function sendEmail({ to, cc, subject, html, text, replyTo, attachments }: EmailOptions) {
  try {
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'contacto@quieromisas.com'
    const fromName = process.env.SMTP_FROM_NAME || 'QuieroMiSAS'

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      cc: cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : undefined,
      replyTo,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
      attachments
    })

    return { success: true, messageId: info.messageId }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ============================================================
// SISTEMA DE TEMPLATES PROFESIONALES
// ============================================================

const BASE_URL = process.env.NEXTAUTH_URL || 'https://quieromisas.com'
const LOGO_URL = `${BASE_URL}/assets/img/qms-logo-white.png`

// Colores de la marca
const COLORS = {
  primary: '#DC2626',      // Rojo principal
  primaryDark: '#B91C1C',  // Rojo oscuro
  secondary: '#1F2937',    // Gris oscuro
  accent: '#F59E0B',       // Amarillo/dorado
  success: '#10B981',      // Verde éxito
  warning: '#F59E0B',      // Amarillo advertencia
  info: '#3B82F6',         // Azul info
  light: '#F9FAFB',        // Gris claro
  white: '#FFFFFF',
  text: '#374151',
  textLight: '#6B7280',
  border: '#E5E7EB'
}

// Template base wrapper
function baseTemplate(content: string, preheader?: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
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
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: ${COLORS.text};
      background-color: #F3F4F6;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .button:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
        padding: 0 16px !important;
      }
      .content {
        padding: 24px 20px !important;
      }
      .header {
        padding: 20px !important;
      }
      .step-number {
        width: 28px !important;
        height: 28px !important;
        font-size: 14px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F3F4F6;">
  ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>` : ''}

  <!-- Email Container -->
  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #F3F4F6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">

        <!-- Main Card -->
        <table role="presentation" cellpadding="0" cellspacing="0" class="container" style="width: 100%; max-width: 600px; background-color: ${COLORS.white}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">

          <!-- Header con Logo -->
          <tr>
            <td class="header" style="background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%); padding: 32px 40px; text-align: center;">
              <img src="${LOGO_URL}" alt="QuieroMiSAS" width="180" style="height: auto; margin: 0 auto; display: block;" />
              <p style="margin: 12px 0 0 0; color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 500; letter-spacing: 0.5px;">
                Tu empresa lista en 5 días
              </p>
            </td>
          </tr>

          <!-- Contenido Principal -->
          <tr>
            <td class="content" style="padding: 40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: ${COLORS.secondary}; padding: 32px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  <td align="center">
                    <!-- Social Links -->
                    <div style="margin-bottom: 20px;">
                      <a href="https://instagram.com/quieromisas" style="display: inline-block; margin: 0 12px; color: #9CA3AF; text-decoration: none; font-size: 14px;">
                        Instagram
                      </a>
                      <span style="color: #4B5563;">|</span>
                      <a href="https://linkedin.com/company/quieromisas" style="display: inline-block; margin: 0 12px; color: #9CA3AF; text-decoration: none; font-size: 14px;">
                        LinkedIn
                      </a>
                    </div>

                    <!-- Contact Info -->
                    <p style="color: #9CA3AF; font-size: 13px; margin-bottom: 8px;">
                      ¿Tenés dudas? Escribinos a
                      <a href="mailto:contacto@quieromisas.com" style="color: ${COLORS.primary}; text-decoration: none;">contacto@quieromisas.com</a>
                    </p>

                    <!-- Tagline -->
                    <p style="color: #6B7280; font-size: 14px; font-weight: 500; margin-bottom: 16px;">
                      QuieroMiSAS · Constituí tu empresa en 5 días
                    </p>

                    <!-- Legal -->
                    <p style="color: #6B7280; font-size: 11px; margin-top: 16px; border-top: 1px solid #374151; padding-top: 16px;">
                      © ${new Date().getFullYear()} QuieroMiSAS. Todos los derechos reservados.<br/>
                      Este email fue enviado porque tenés una cuenta en QuieroMiSAS.
                    </p>
                  </td>
                </tr>
              </table>
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

// Componente: Botón CTA
function ctaButton(text: string, url: string, variant: 'primary' | 'secondary' = 'primary'): string {
  const bgColor = variant === 'primary' ? COLORS.primary : COLORS.secondary
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 32px auto;">
      <tr>
        <td align="center" style="border-radius: 8px; background: ${bgColor};">
          <a href="${url}" target="_blank" class="button" style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: 600; color: ${COLORS.white}; text-decoration: none; border-radius: 8px; transition: all 0.2s;">
            ${text} →
          </a>
        </td>
      </tr>
    </table>
  `
}

// Componente: Card de Estado
function statusCard(status: string, color: string): string {
  const bgColor = color === 'success' ? '#DCFCE7' : color === 'warning' ? '#FEF3C7' : color === 'info' ? '#DBEAFE' : '#F3F4F6'
  const textColor = color === 'success' ? '#166534' : color === 'warning' ? '#92400E' : color === 'info' ? '#1E40AF' : '#374151'
  const borderColor = color === 'success' ? '#16A34A' : color === 'warning' ? '#F59E0B' : color === 'info' ? '#3B82F6' : '#D1D5DB'
  const emoji = color === 'success' ? '✅' : color === 'warning' ? '⏳' : color === 'info' ? '📋' : '📌'

  return `
    <div style="background-color: ${bgColor}; border: 2px solid ${borderColor}; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
      <div style="font-size: 32px; margin-bottom: 12px;">${emoji}</div>
      <p style="color: ${textColor}; font-size: 20px; font-weight: 700; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
        ${status}
      </p>
    </div>
  `
}

// Componente: Paso del Timeline
function timelineStep(number: number, title: string, description: string, isActive: boolean = false, isCompleted: boolean = false): string {
  const circleStyle = isCompleted
    ? `background: ${COLORS.success}; color: white;`
    : isActive
      ? `background: ${COLORS.primary}; color: white;`
      : `background: ${COLORS.light}; color: ${COLORS.textLight};`

  const textColor = isActive || isCompleted ? COLORS.text : COLORS.textLight

  return `
    <tr>
      <td style="padding: 12px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
          <tr>
            <td style="width: 44px; vertical-align: top;">
              <div class="step-number" style="${circleStyle} width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px;">
                ${isCompleted ? '✓' : number}
              </div>
            </td>
            <td style="vertical-align: top; padding-left: 12px;">
              <p style="margin: 0 0 4px 0; font-weight: 600; color: ${textColor}; font-size: 15px;">${title}</p>
              <p style="margin: 0; font-size: 13px; color: ${COLORS.textLight};">${description}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `
}

// Componente: Info Card
function infoCard(title: string, items: { label: string; value: string }[]): string {
  const rows = items.map(item => `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid ${COLORS.border}; color: ${COLORS.textLight}; font-size: 14px; width: 40%;">${item.label}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid ${COLORS.border}; color: ${COLORS.text}; font-weight: 600; font-size: 14px;">${item.value}</td>
    </tr>
  `).join('')

  return `
    <div style="background-color: ${COLORS.light}; border-radius: 12px; overflow: hidden; margin: 24px 0;">
      <div style="background: linear-gradient(135deg, ${COLORS.secondary} 0%, #374151 100%); padding: 16px 20px;">
        <p style="margin: 0; color: white; font-weight: 600; font-size: 16px;">${title}</p>
      </div>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
        ${rows}
      </table>
    </div>
  `
}

// ============================================================
// TEMPLATES DE EMAIL
// ============================================================

export const emailTemplates = {

  // ============================================================
  // 1. BIENVENIDA AL REGISTRARSE
  // ============================================================
  welcome: (nombre: string) => ({
    subject: '¡Bienvenido a QuieroMiSAS! Tu empresa te espera',
    html: baseTemplate(`
      <!-- Ilustración de bienvenida -->
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="background: linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%); border-radius: 50%; width: 80px; height: 80px; display: inline-block; line-height: 80px; font-size: 36px;">
          🚀
        </div>
      </div>

      <!-- Saludo -->
      <h1 style="color: ${COLORS.secondary}; font-size: 28px; font-weight: 700; margin: 0 0 8px 0; text-align: center;">
        ¡Hola, ${nombre}!
      </h1>
      <p style="color: ${COLORS.primary}; font-size: 18px; font-weight: 500; margin: 0 0 24px 0; text-align: center;">
        Bienvenido a QuieroMiSAS
      </p>

      <!-- Mensaje principal -->
      <p style="color: ${COLORS.text}; font-size: 16px; line-height: 1.7; margin-bottom: 16px;">
        Gracias por registrarte. Estás a un paso de constituir tu <strong>S.A.S. (Sociedad por Acciones Simplificada)</strong> de manera rápida, segura y 100% online.
      </p>

      <p style="color: ${COLORS.text}; font-size: 16px; line-height: 1.7; margin-bottom: 24px;">
        Nuestro equipo de expertos te acompañará en cada etapa del proceso.
      </p>

      <!-- Features -->
      <div style="background: ${COLORS.light}; border-radius: 12px; padding: 24px; margin: 24px 0;">
        <p style="color: ${COLORS.secondary}; font-weight: 600; margin: 0 0 16px 0; font-size: 15px;">
          ¿Por qué elegir QuieroMiSAS?
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
          <tr>
            <td style="padding: 8px 0; vertical-align: top; width: 28px; font-size: 16px;">
              ✅
            </td>
            <td style="padding: 8px 0 8px 12px; color: ${COLORS.text}; font-size: 14px;">
              <strong>Rápido:</strong> Constituí tu empresa en solo 5 días hábiles
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; vertical-align: top; width: 28px; font-size: 16px;">
              ✅
            </td>
            <td style="padding: 8px 0 8px 12px; color: ${COLORS.text}; font-size: 14px;">
              <strong>Simple:</strong> Proceso 100% online, sin trámites presenciales
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; vertical-align: top; width: 28px; font-size: 16px;">
              ✅
            </td>
            <td style="padding: 8px 0 8px 12px; color: ${COLORS.text}; font-size: 14px;">
              <strong>Seguro:</strong> Seguimiento en tiempo real de tu trámite
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; vertical-align: top; width: 28px; font-size: 16px;">
              ✅
            </td>
            <td style="padding: 8px 0 8px 12px; color: ${COLORS.text}; font-size: 14px;">
              <strong>Expertos:</strong> Equipo legal especializado a tu disposición
            </td>
          </tr>
        </table>
      </div>

      <!-- CTA -->
      ${ctaButton('Comenzar mi trámite', `${BASE_URL}/tramite/nuevo`)}

      <!-- Ayuda -->
      <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid ${COLORS.border};">
        <p style="color: ${COLORS.textLight}; font-size: 14px; margin: 0;">
          ¿Tenés dudas? Nuestro equipo está disponible para ayudarte.<br/>
          Escribinos a <a href="mailto:contacto@quieromisas.com" style="color: ${COLORS.primary}; text-decoration: none; font-weight: 500;">contacto@quieromisas.com</a>
        </p>
      </div>
    `, 'Gracias por registrarte en QuieroMiSAS. ¡Estamos listos para ayudarte a constituir tu empresa!')
  }),

  // ============================================================
  // 2. NUEVO TRÁMITE INICIADO
  // ============================================================
  nuevoTramite: (nombre: string, denominacion: string, tramiteId?: string) => ({
    subject: `¡Excelente! Tu trámite para ${denominacion} fue iniciado`,
    html: baseTemplate(`
      <!-- Icono de éxito -->
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="background: linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%); border-radius: 50%; width: 72px; height: 72px; display: inline-block; line-height: 72px; font-size: 32px;">
          🏢
        </div>
      </div>

      <!-- Título -->
      <h1 style="color: ${COLORS.secondary}; font-size: 24px; font-weight: 700; margin: 0 0 8px 0; text-align: center;">
        ¡Felicitaciones, ${nombre}!
      </h1>
      <p style="color: ${COLORS.text}; font-size: 16px; margin: 0 0 24px 0; text-align: center;">
        Tu trámite ha sido iniciado correctamente
      </p>

      <!-- Card con denominación -->
      <div style="background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
        <p style="color: rgba(255,255,255,0.8); font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">
          Denominación Social
        </p>
        <p style="color: white; font-size: 22px; font-weight: 700; margin: 0;">
          ${denominacion}
        </p>
      </div>

      <!-- Mensaje -->
      <p style="color: ${COLORS.text}; font-size: 15px; line-height: 1.7; margin-bottom: 24px;">
        Nuestro equipo ya está trabajando en tu solicitud. A continuación te mostramos los pasos que seguirá tu trámite:
      </p>

      <!-- Timeline de pasos -->
      <div style="background: ${COLORS.light}; border-radius: 12px; padding: 24px; margin: 24px 0;">
        <p style="color: ${COLORS.secondary}; font-weight: 600; margin: 0 0 20px 0; font-size: 15px;">
          Próximos pasos
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
          ${timelineStep(1, 'Validación de datos', 'Revisamos toda la información ingresada', true)}
          ${timelineStep(2, 'Reserva de denominación', 'Tramitamos la reserva del nombre en IGJ')}
          ${timelineStep(3, 'Depósito de capital', 'Te guiamos en el depósito del 25%')}
          ${timelineStep(4, 'Firma de documentos', 'Firma digital del estatuto')}
          ${timelineStep(5, 'Inscripción y CUIT', 'Inscripción final y obtención del CUIT')}
        </table>
      </div>

      <!-- CTA -->
      ${ctaButton('Ver estado de mi trámite', `${BASE_URL}/dashboard/tramites${tramiteId ? `/${tramiteId}` : ''}`)}

      <!-- Nota -->
      <div style="background: #FFFBEB; border: 1px solid #FCD34D; border-radius: 8px; padding: 16px; margin-top: 24px;">
        <p style="color: #92400E; font-size: 13px; margin: 0;">
          <strong>Importante:</strong> Te enviaremos un email cada vez que haya una actualización en tu trámite. También podés ver el estado en tiempo real desde tu panel.
        </p>
      </div>
    `, `Tu trámite para constituir ${denominacion} fue iniciado. Te acompañamos en cada paso.`)
  }),

  // ============================================================
  // 3. CAMBIO DE ESTADO DEL TRÁMITE
  // ============================================================
  cambioEstado: (
    nombre: string,
    denominacion: string,
    nuevoEstado: string,
    mensaje: string,
    estadoConfig?: {
      color?: 'success' | 'warning' | 'info' | 'default'
      accion?: { texto: string; url: string }
      pasoActual?: number
    }
  ) => {
    const config = estadoConfig || {}
    const color = config.color || 'success'

    // Mapeo de estados a pasos completados
    const pasosCompletados = config.pasoActual || 1

    return {
      subject: `Actualización: ${nuevoEstado} - ${denominacion}`,
      html: baseTemplate(`
        <!-- Título -->
        <h1 style="color: ${COLORS.secondary}; font-size: 24px; font-weight: 700; margin: 0 0 8px 0; text-align: center;">
          ¡Hola, ${nombre}!
        </h1>
        <p style="color: ${COLORS.textLight}; font-size: 15px; margin: 0 0 16px 0; text-align: center;">
          Tu trámite de <strong style="color: ${COLORS.text};">${denominacion}</strong> tiene novedades
        </p>

        <!-- Status Card -->
        ${statusCard(nuevoEstado, color)}

        <!-- Mensaje -->
        <div style="background: ${COLORS.light}; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <p style="color: ${COLORS.text}; font-size: 15px; line-height: 1.7; margin: 0;">
            ${mensaje}
          </p>
        </div>

        <!-- Timeline actualizado -->
        <div style="border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid ${COLORS.border};">
          <p style="color: ${COLORS.secondary}; font-weight: 600; margin: 0 0 20px 0; font-size: 15px;">
            Progreso de tu trámite
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
            ${timelineStep(1, 'Validación de datos', 'Información verificada', true, pasosCompletados >= 1)}
            ${timelineStep(2, 'Reserva de denominación', 'Nombre reservado en IGJ', pasosCompletados === 2, pasosCompletados > 2)}
            ${timelineStep(3, 'Depósito de capital', 'Depósito del 25% completado', pasosCompletados === 3, pasosCompletados > 3)}
            ${timelineStep(4, 'Firma de documentos', 'Estatuto firmado', pasosCompletados === 4, pasosCompletados > 4)}
            ${timelineStep(5, 'Inscripción y CUIT', 'Empresa constituida', pasosCompletados === 5, pasosCompletados > 5)}
          </table>
        </div>

        <!-- CTA -->
        ${config.accion
          ? ctaButton(config.accion.texto, config.accion.url)
          : ctaButton('Ver detalles del trámite', `${BASE_URL}/dashboard/tramites`)
        }

        <!-- Soporte -->
        <div style="text-align: center; margin-top: 24px;">
          <p style="color: ${COLORS.textLight}; font-size: 13px; margin: 0;">
            ¿Tenés alguna consulta sobre este paso?<br/>
            <a href="mailto:contacto@quieromisas.com" style="color: ${COLORS.primary}; text-decoration: none; font-weight: 500;">Contactá a nuestro equipo</a>
          </p>
        </div>
      `, `Actualización de tu trámite: ${nuevoEstado}`)
    }
  },

  // ============================================================
  // 4. ACCIÓN REQUERIDA
  // ============================================================
  accionRequerida: (
    nombre: string,
    denominacion: string,
    accion: string,
    descripcion: string,
    urlAccion: string,
    fechaLimite?: string
  ) => ({
    subject: `Acción requerida: ${accion} - ${denominacion}`,
    html: baseTemplate(`
      <!-- Alerta -->
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-radius: 50%; width: 72px; height: 72px; display: inline-block; line-height: 72px; font-size: 32px;">
          ⏰
        </div>
      </div>

      <!-- Título -->
      <h1 style="color: ${COLORS.secondary}; font-size: 24px; font-weight: 700; margin: 0 0 8px 0; text-align: center;">
        ¡Hola, ${nombre}!
      </h1>
      <p style="color: ${COLORS.text}; font-size: 16px; margin: 0 0 24px 0; text-align: center;">
        Necesitamos que realices una acción para continuar
      </p>

      <!-- Card de acción -->
      <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border: 2px solid ${COLORS.warning}; border-radius: 12px; padding: 24px; margin: 24px 0;">
        <p style="color: #92400E; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">
          Acción requerida
        </p>
        <p style="color: #78350F; font-size: 20px; font-weight: 700; margin: 0 0 12px 0;">
          ${accion}
        </p>
        <p style="color: #92400E; font-size: 14px; margin: 0;">
          ${descripcion}
        </p>
        ${fechaLimite ? `
          <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(146, 64, 14, 0.2);">
            <p style="color: #78350F; font-size: 13px; margin: 0; font-weight: 600;">
              Fecha límite: ${fechaLimite}
            </p>
          </div>
        ` : ''}
      </div>

      <!-- Trámite info -->
      <p style="color: ${COLORS.textLight}; font-size: 14px; text-align: center; margin-bottom: 24px;">
        Trámite: <strong style="color: ${COLORS.text};">${denominacion}</strong>
      </p>

      <!-- CTA -->
      ${ctaButton('Realizar acción ahora', urlAccion)}

      <!-- Ayuda -->
      <div style="background: ${COLORS.light}; border-radius: 8px; padding: 16px; margin-top: 24px; text-align: center;">
        <p style="color: ${COLORS.textLight}; font-size: 13px; margin: 0;">
          ¿Necesitás ayuda? Nuestro equipo puede guiarte paso a paso.<br/>
          <a href="mailto:contacto@quieromisas.com" style="color: ${COLORS.primary}; text-decoration: none; font-weight: 500;">Escribinos aquí</a>
        </p>
      </div>
    `, `Acción requerida para tu trámite ${denominacion}: ${accion}`)
  }),

  // ============================================================
  // 5. TRÁMITE COMPLETADO
  // ============================================================
  tramiteCompletado: (nombre: string, denominacion: string, cuit?: string) => ({
    subject: `¡Felicitaciones! ${denominacion} ya está constituida`,
    html: baseTemplate(`
      <!-- Celebración -->
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
        <div style="font-size: 20px; letter-spacing: 4px;">
          ⭐⭐⭐⭐⭐
        </div>
      </div>

      <!-- Título -->
      <h1 style="color: ${COLORS.secondary}; font-size: 28px; font-weight: 700; margin: 0 0 8px 0; text-align: center;">
        ¡Felicitaciones, ${nombre}!
      </h1>
      <p style="color: ${COLORS.primary}; font-size: 18px; font-weight: 600; margin: 0 0 24px 0; text-align: center;">
        Tu empresa ya está constituida
      </p>

      <!-- Card de empresa -->
      <div style="background: linear-gradient(135deg, ${COLORS.success} 0%, #059669 100%); border-radius: 16px; padding: 32px; margin: 24px 0; text-align: center; box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);">
        <div style="background: rgba(255,255,255,0.2); border-radius: 50%; width: 64px; height: 64px; margin: 0 auto 16px; display: inline-block; line-height: 64px; font-size: 28px;">
          🏢
        </div>
        <p style="color: rgba(255,255,255,0.9); font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 8px 0;">
          Sociedad por Acciones Simplificada
        </p>
        <p style="color: white; font-size: 26px; font-weight: 700; margin: 0 0 16px 0;">
          ${denominacion}
        </p>
        ${cuit ? `
          <div style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 12px 24px; display: inline-block;">
            <p style="color: rgba(255,255,255,0.8); font-size: 11px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 1px;">
              CUIT
            </p>
            <p style="color: white; font-size: 18px; font-weight: 600; margin: 0; font-family: monospace;">
              ${cuit}
            </p>
          </div>
        ` : ''}
      </div>

      <!-- Timeline completado -->
      <div style="background: ${COLORS.light}; border-radius: 12px; padding: 24px; margin: 24px 0;">
        <p style="color: ${COLORS.secondary}; font-weight: 600; margin: 0 0 20px 0; font-size: 15px;">
          Proceso completado
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
          ${timelineStep(1, 'Validación de datos', 'Completado', false, true)}
          ${timelineStep(2, 'Reserva de denominación', 'Completado', false, true)}
          ${timelineStep(3, 'Depósito de capital', 'Completado', false, true)}
          ${timelineStep(4, 'Firma de documentos', 'Completado', false, true)}
          ${timelineStep(5, 'Inscripción y CUIT', 'Completado', false, true)}
        </table>
      </div>

      <!-- Próximos pasos -->
      <div style="border: 2px solid ${COLORS.primary}; border-radius: 12px; padding: 24px; margin: 24px 0;">
        <p style="color: ${COLORS.primary}; font-weight: 600; margin: 0 0 16px 0; font-size: 15px;">
          ¿Qué sigue ahora?
        </p>
        <ul style="color: ${COLORS.text}; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Descargá tu documentación desde el panel</li>
          <li>Habilitá el punto de venta en AFIP</li>
          <li>Abrí la cuenta bancaria empresarial</li>
          <li>Registrá tu empresa en actividades comerciales</li>
        </ul>
      </div>

      <!-- CTA -->
      ${ctaButton('Descargar documentación', `${BASE_URL}/dashboard/documentos`)}

      <!-- Gracias -->
      <div style="text-align: center; margin-top: 32px; padding: 24px; background: linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%); border-radius: 12px;">
        <p style="color: ${COLORS.secondary}; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">
          ¡Gracias por confiar en QuieroMiSAS!
        </p>
        <p style="color: ${COLORS.textLight}; font-size: 14px; margin: 0;">
          Fue un placer acompañarte en este proceso.
        </p>
      </div>
    `, `¡Tu empresa ${denominacion} ya está constituida! Descargá tu documentación.`)
  }),

  // ============================================================
  // 6. NOTIFICACIÓN PARA ADMIN - NUEVO TRÁMITE
  // ============================================================
  adminNuevoTramite: (cliente: string, email: string, denominacion: string, plan: string, tramiteId?: string) => ({
    subject: `Nuevo trámite: ${denominacion} - ${plan}`,
    html: baseTemplate(`
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="background: linear-gradient(135deg, ${COLORS.info} 0%, #2563EB 100%); border-radius: 12px; padding: 16px; display: inline-block;">
          <p style="color: white; font-size: 14px; font-weight: 600; margin: 0;">
            NUEVO TRÁMITE RECIBIDO
          </p>
        </div>
      </div>

      <!-- Título -->
      <h1 style="color: ${COLORS.secondary}; font-size: 24px; font-weight: 700; margin: 0 0 24px 0; text-align: center;">
        ${denominacion}
      </h1>

      <!-- Info del cliente -->
      ${infoCard('Datos del Cliente', [
        { label: 'Nombre', value: cliente },
        { label: 'Email', value: email },
        { label: 'Plan', value: plan },
        { label: 'Fecha', value: new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }
      ])}

      <!-- CTA -->
      ${ctaButton('Ver trámite en admin', `${BASE_URL}/dashboard/admin${tramiteId ? `/tramites/${tramiteId}` : ''}`)}

      <!-- Recordatorio -->
      <div style="background: #FFFBEB; border: 1px solid #FCD34D; border-radius: 8px; padding: 16px; margin-top: 24px;">
        <p style="color: #92400E; font-size: 13px; margin: 0;">
          <strong>Recordatorio:</strong> Validar los datos y comenzar el proceso de reserva de denominación.
        </p>
      </div>
    `, `Nuevo trámite recibido: ${denominacion} de ${cliente}`)
  }),

  // ============================================================
  // 7. RECORDATORIO DE PAGO
  // ============================================================
  recordatorioPago: (nombre: string, denominacion: string, monto: string, fechaLimite: string, urlPago: string) => ({
    subject: `Recordatorio: Pago pendiente para ${denominacion}`,
    html: baseTemplate(`
      <!-- Icono -->
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-radius: 50%; width: 72px; height: 72px; display: inline-block; line-height: 72px; font-size: 32px;">
          💰
        </div>
      </div>

      <!-- Título -->
      <h1 style="color: ${COLORS.secondary}; font-size: 24px; font-weight: 700; margin: 0 0 8px 0; text-align: center;">
        ¡Hola, ${nombre}!
      </h1>
      <p style="color: ${COLORS.text}; font-size: 16px; margin: 0 0 24px 0; text-align: center;">
        Tenés un pago pendiente para continuar con tu trámite
      </p>

      <!-- Card de pago -->
      <div style="background: ${COLORS.light}; border: 2px solid ${COLORS.warning}; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
        <p style="color: ${COLORS.textLight}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">
          Monto a pagar
        </p>
        <p style="color: ${COLORS.secondary}; font-size: 36px; font-weight: 700; margin: 0 0 16px 0;">
          ${monto}
        </p>
        <p style="color: ${COLORS.text}; font-size: 14px; margin: 0;">
          Para: <strong>${denominacion}</strong>
        </p>
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid ${COLORS.border};">
          <p style="color: #B45309; font-size: 14px; margin: 0; font-weight: 600;">
            Fecha límite: ${fechaLimite}
          </p>
        </div>
      </div>

      <!-- CTA -->
      ${ctaButton('Pagar ahora', urlPago)}

      <!-- Métodos de pago -->
      <div style="text-align: center; margin-top: 24px;">
        <p style="color: ${COLORS.textLight}; font-size: 13px; margin: 0 0 12px 0;">
          Métodos de pago disponibles:
        </p>
        <p style="color: ${COLORS.text}; font-size: 14px; margin: 0;">
          Tarjeta de crédito/débito · Transferencia bancaria · Mercado Pago
        </p>
      </div>
    `, `Recordatorio de pago pendiente para ${denominacion}`)
  })
}

// Función para verificar la conexión SMTP
export async function verifyEmailConnection() {
  try {
    await transporter.verify()
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
