/**
 * Plantillas HTML de los emails transaccionales.
 *
 * Siguen el mismo sistema de diseño que el panel (app/globals.css), traducido
 * a lo que soportan los clientes de correo: tablas en vez de grid, estilos
 * en línea en vez de clases, hexadecimales en vez de variables CSS.
 */

// URL base para los enlaces en emails
const BASE_URL = process.env.NEXTAUTH_URL || 'https://quieromisas.com'

// Logo URL (hosted on the website)
// Nota: usar versión legible sobre fondo claro (mejor compatibilidad en clientes de email)
const LOGO_URL = `${BASE_URL}/assets/img/qms-logo-reg.png`
const ILLUSTRATION_WELCOME = `${BASE_URL}/assets/img/img_ppal.png`

interface EmailTemplateProps {
  nombre: string
  [key: string]: any
}

/**
 * Paleta del sistema, en hexadecimal.
 *
 * El HTML de los emails no soporta variables CSS, así que estos valores se
 * escriben a mano. Salen de la MISMA escalera de luminosidad y croma que
 * app/globals.css: para regenerarlos tras un rebranding, correr
 *   node scripts/brand-tokens.mjs <tono>
 * y actualizar el bloque `brand` de acá abajo.
 */
const colors = {
  // Marca
  primary: '#991d23',       // brand-700 · el color del logo
  primaryDark: '#7a181c',   // brand-800 · hover
  primaryLight: '#fef2f1',  // brand-50  · fondos suaves
  primaryLine: '#fbc9c4',   // brand-200 · bordes suaves
  accent: '#b0242a',        // brand-600

  // Neutrales (gris levemente frío, igual que el panel)
  white: '#ffffff',
  surface: '#ffffff',
  surface2: '#f8fafe',      // n-50  · zonas internas
  background: '#f2f4f8',    // n-100 · lienzo del email
  border: '#e5e7eb',        // n-200
  borderStrong: '#d1d3d8',  // n-300
  textLight: '#7d7f83',     // n-500 · sólo decorativo
  textMuted: '#616266',     // n-600 · texto secundario
  text: '#494b4e',          // n-700
  dark: '#1e2023',          // n-900 · texto principal

  // Estados
  success: '#1c6433',       // texto sobre fondo suave
  successSolid: '#23743c',
  successBg: '#e1f2e4',
  successLine: '#c4e0c8',

  warning: '#724b15',
  warningSolid: '#84571b',
  warningBg: '#f6ebde',
  warningLine: '#e7d4bf',

  info: '#145690',
  infoSolid: '#1a65a6',
  infoBg: '#dfefff',
  infoLine: '#c1dbf6',

  error: '#912b26',
  errorSolid: '#a8342e',
  errorBg: '#ffe5e1',
  errorLine: '#fccac3',
}

/**
 * Escala tipográfica y de forma, equivalente a la del panel.
 * (En emails no hay tokens: se interpolan estos valores.)
 */
const type = {
  hero: 'font-size: 30px; line-height: 36px; font-weight: 800; letter-spacing: -0.5px;',
  title: 'font-size: 22px; line-height: 30px; font-weight: 800; letter-spacing: -0.3px;',
  heading: 'font-size: 17px; line-height: 24px; font-weight: 700;',
  body: 'font-size: 15px; line-height: 24px; font-weight: 400;',
  bodySm: 'font-size: 13px; line-height: 20px; font-weight: 400;',
  label: 'font-size: 12px; line-height: 16px; font-weight: 600;',
  metric: 'font-size: 28px; line-height: 32px; font-weight: 800; letter-spacing: -0.5px;',
}

const radius = { chip: '8px', control: '12px', card: '16px' }

// Template base con estilos modernos
export const EmailLayout = ({ children, nombre, preheader = '' }: { children: string; nombre: string; preheader?: string }) => {
  return `
    <!DOCTYPE html>
    <html lang="es" data-qms-signature="true">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="x-apple-disable-message-reformatting">
        <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
        <meta name="color-scheme" content="light">
        <meta name="supported-color-schemes" content="light">
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

        </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: ${colors.background};">
        <!-- Preheader text (hidden) -->
        <div style="display: none; font-size: 1px; color: ${colors.background}; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
          ${preheader}
        </div>

        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${colors.background}; padding: 32px 16px;">
          <tr>
            <td align="center">
              <!-- Main Container -->
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: ${colors.white}; border-radius: ${radius.card}; overflow: hidden; border: 1px solid ${colors.border};">

                <!-- Header con Logo -->
                <tr>
                  <td style="background-color: ${colors.white}; padding: 28px 40px 24px 40px; text-align: center; border-bottom: 1px solid ${colors.border};">
                    <img
                      src="${LOGO_URL}"
                      alt="QuieroMiSAS"
                      width="164"
                      style="height: auto; margin: 0 auto; display: block;"
                    />
                  </td>
                </tr>

                <!-- Saludo -->
                <tr>
                  <td style="padding: 40px 40px 0 40px;">
                    <p style="margin: 0; color: ${colors.textMuted}; ${type.body}">
                      Hola <strong style="color: ${colors.dark}; font-weight: 700;">${nombre}</strong>
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
                    <div style="height: 1px; background-color: ${colors.border}; line-height: 1px; font-size: 0;">&nbsp;</div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 32px 40px; text-align: center;">
                    <p style="margin: 0 0 10px 0; color: ${colors.textMuted}; ${type.bodySm}">
                      ¿Necesitás una mano? Respondé este email o escribinos por WhatsApp.
                    </p>
                    <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                      <tr>
                        <td style="padding: 0 10px;">
                          <a href="https://wa.me/5493512136212" style="color: ${colors.primary}; ${type.bodySm} font-weight: 600;">WhatsApp</a>
                        </td>
                        <td style="color: ${colors.borderStrong};">·</td>
                        <td style="padding: 0 10px;">
                          <a href="mailto:contacto@quieromisas.com" style="color: ${colors.primary}; ${type.bodySm} font-weight: 600;">contacto@quieromisas.com</a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 20px 0 0 0; color: ${colors.textMuted}; ${type.label} font-weight: 400;">
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
                    <p style="margin: 0; color: ${colors.textMuted}; ${type.label} font-weight: 400;">
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
const CTAButton = (text: string, url: string) => `
  <table cellpadding="0" cellspacing="0" style="margin: 28px auto 0 auto;">
    <tr>
      <td style="background-color: ${colors.primary}; border-radius: ${radius.control};">
        <a
          href="${url}"
          style="
            display: inline-block;
            padding: 14px 28px;
            color: ${colors.white} !important;
            ${type.heading}
            text-decoration: none;
            border-radius: ${radius.control};
            border-top: 1px solid rgba(255,255,255,0.18);
          "
        >${text}</a>
      </td>
    </tr>
  </table>
`

/** Botón secundario, para acciones que acompañan al principal. */
const CTASecundario = (text: string, url: string) => `
  <table cellpadding="0" cellspacing="0" style="margin: 12px auto 0 auto;">
    <tr>
      <td style="background-color: ${colors.white}; border: 1px solid ${colors.borderStrong}; border-radius: ${radius.control};">
        <a href="${url}" style="display: inline-block; padding: 12px 24px; color: ${colors.dark} !important; ${type.bodySm} font-weight: 600; text-decoration: none;">${text}</a>
      </td>
    </tr>
  </table>
`

type Tono = 'neutral' | 'success' | 'warning' | 'info' | 'danger'

const TONOS: Record<Tono, { bg: string; line: string; text: string }> = {
  neutral: { bg: colors.surface2, line: colors.border, text: colors.textMuted },
  success: { bg: colors.successBg, line: colors.successLine, text: colors.success },
  warning: { bg: colors.warningBg, line: colors.warningLine, text: colors.warning },
  info: { bg: colors.infoBg, line: colors.infoLine, text: colors.info },
  danger: { bg: colors.errorBg, line: colors.errorLine, text: colors.error },
}

/**
 * Iconografía de los emails.
 *
 * Son los mismos lucide que usa el panel, pero rasterizados a PNG monocromo:
 * los clientes de correo no renderizan SVG ni componentes, y los emojis salen
 * distintos (y a color) en cada plataforma. Se generan con
 * `node scripts/iconos-email.mjs`, que también define qué pares icono/tono
 * existen — pedir uno que no esté generado deja un hueco, no un error.
 *
 * Van sueltos, sin recuadro de color detrás: si el cliente bloquea las
 * imágenes queda un espacio vacío y no un cuadrado de color sin sentido.
 */
type IconoEmail =
  | 'circle-check-success'
  | 'badge-check-success'
  | 'credit-card-warning'
  | 'clock-warning'
  | 'file-text-danger'
  | 'circle-alert-danger'
  | 'info-info'
  | 'circle-help-info'
  | 'info-neutral'
  | 'sparkles-brand'
  | 'mail-check-brand'
  | 'clock-brand'
  | 'shield-check-brand'
  | 'chart-line-brand'
  | 'message-circle-brand'

const Icono = (nombre: IconoEmail, lado = 20) =>
  `<img src="${BASE_URL}/assets/img/email/${nombre}.png" width="${lado}" height="${lado}" alt="" style="display: inline-block; border: 0;" />`

/** El icono que le corresponde a cada tono cuando no se pide uno concreto. */
const ICONO_DE_TONO: Record<Tono, IconoEmail> = {
  neutral: 'info-neutral',
  success: 'circle-check-success',
  warning: 'clock-warning',
  info: 'info-info',
  danger: 'circle-alert-danger',
}

/** Aviso con tono semántico: fondo tenue, línea del tono e icono en el título. */
const InfoCard = (content: string, tono: Tono = 'neutral', titulo?: string, icono?: IconoEmail) => {
  const t = TONOS[tono]
  const glifo = icono ?? ICONO_DE_TONO[tono]
  return `
  <table cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
    <tr>
      <td style="background-color: ${t.bg}; border: 1px solid ${t.line}; border-radius: ${radius.card}; padding: 18px 20px;">
        ${
          titulo
            ? `<table cellpadding="0" cellspacing="0" style="margin: 0 0 8px 0;">
                 <tr>
                   <td width="26" style="vertical-align: top; padding-right: 8px; line-height: 0;">${Icono(glifo, 18)}</td>
                   <td style="vertical-align: top;">
                     <p style="margin: 0; color: ${t.text}; ${type.heading}">${titulo}</p>
                   </td>
                 </tr>
               </table>`
            : ''
        }
        <div style="color: ${colors.text}; ${type.bodySm}">${content}</div>
      </td>
    </tr>
  </table>
`
}

/**
 * Dato destacado: etiqueta arriba, valor grande abajo.
 *
 * El tamaño del valor baja cuando la cadena es larga: un CUIT o una fecha no
 * entran a 28px en media columna y se partían en dos líneas, dejando las dos
 * tarjetas de la fila con distinta altura.
 */
const StatBox = (label: string, value: string, destacado = false) => `
  <table cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td style="
        background-color: ${destacado ? colors.primaryLight : colors.surface2};
        border: 1px solid ${destacado ? colors.primaryLine : colors.border};
        border-radius: ${radius.card};
        padding: 18px 20px;
        text-align: center;
      ">
        <p style="margin: 0 0 6px 0; color: ${colors.textMuted}; ${type.label}">${label}</p>
        <p style="margin: 0; color: ${destacado ? colors.primary : colors.dark}; ${value.length > 9 ? type.title : type.metric} white-space: nowrap;">${value}</p>
      </td>
    </tr>
  </table>
`

/** Las etapas del trámite, con la misma lógica de estados que el panel. */
const StepIndicator = (steps: { number: string; title: string; done?: boolean }[]) => `
  <table cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
    <tr>
      ${steps
        .map(
          (step) => `
        <td style="text-align: center; padding: 0 4px; vertical-align: top;">
          <table cellpadding="0" cellspacing="0" style="margin: 0 auto 8px auto;">
            <tr>
              <td style="
                width: 28px; height: 28px; border-radius: ${radius.control};
                background-color: ${step.done ? colors.successSolid : colors.background};
                border: 1px solid ${step.done ? colors.successSolid : colors.borderStrong};
                text-align: center; line-height: 28px;
              ">
                <span style="color: ${step.done ? colors.white : colors.textMuted}; font-size: 13px; font-weight: 700;">${step.done ? '&#10003;' : step.number}</span>
              </td>
            </tr>
          </table>
          <p style="margin: 0; color: ${step.done ? colors.dark : colors.textMuted}; font-size: 12px; line-height: 15px; font-weight: 600;">${step.title}</p>
        </td>
      `,
        )
        .join('')}
    </tr>
  </table>
`

/**
 * Bloque de apertura: título del hecho que motiva el email, con el color del
 * estado que corresponde. `extra` recibe la tarjeta blanca con el dato
 * concreto (denominación, monto, etc.) cuando el email tiene uno.
 *
 * Si no se pasa `icono` toma el del tono, para que un mail de estado nunca
 * quede sin señal visual.
 */
const Hero = (
  titulo: string,
  subtitulo: string,
  tono: Tono = 'neutral',
  extra = '',
  icono?: IconoEmail,
) => {
  const t = TONOS[tono]
  return `
  <table cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 24px 0;">
    <tr>
      <td align="center">
        <div style="background-color: ${t.bg}; border: 1px solid ${t.line}; border-radius: ${radius.card}; padding: 28px; max-width: 100%;">
          <div style="line-height: 0; margin: 0 0 12px 0;">${Icono(icono ?? ICONO_DE_TONO[tono], 30)}</div>
          <h1 style="margin: 0${subtitulo || extra ? ' 0 6px 0' : ''}; color: ${colors.dark}; ${type.title}">${titulo}</h1>
          ${subtitulo ? `<p style="margin: 0${extra ? ' 0 20px 0' : ''}; color: ${t.text}; ${type.bodySm} font-weight: 600;">${subtitulo}</p>` : ''}
          ${extra}
        </div>
      </td>
    </tr>
  </table>
`
}

/** Tarjeta blanca que va dentro del Hero, con el dato central del email. */
const HeroDato = (contenido: string, tono: Tono = 'neutral') => `
  <table cellpadding="0" cellspacing="0" style="margin: 0 auto; background-color: ${colors.white}; border-radius: ${radius.control}; border: 1px solid ${TONOS[tono].line};">
    <tr>
      <td style="text-align: center; padding: 18px 28px;">${contenido}</td>
    </tr>
  </table>
`

/**
 * Las etapas en vertical, con descripción.
 *
 * Se usa cuando cada paso necesita una línea de contexto: en dos columnas las
 * tarjetas quedaban de distinta altura según el largo del texto, y en el
 * teléfono se apilan igual. Los estados son los mismos del panel: cumplido,
 * en curso y pendiente.
 */
const ListaPasos = (
  steps: { title: string; detalle: string; estado?: 'hecho' | 'actual' | 'pendiente' }[],
) => `
  <table cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 24px 0;">
    ${steps
      .map((step, i) => {
        const estado = step.estado ?? 'pendiente'
        const marca =
          estado === 'hecho'
            ? { fondo: colors.successSolid, borde: colors.successSolid, texto: colors.white }
            : estado === 'actual'
              ? { fondo: colors.primary, borde: colors.primary, texto: colors.white }
              : { fondo: colors.surface2, borde: colors.borderStrong, texto: colors.textMuted }
        return `
    <tr>
      <td width="36" style="vertical-align: top; padding: 0 12px 14px 0;">
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="
              width: 26px; height: 26px; border-radius: 13px;
              background-color: ${marca.fondo}; border: 1px solid ${marca.borde};
              text-align: center; line-height: 26px;
            ">
              <span style="color: ${marca.texto}; font-size: 12px; font-weight: 700;">${estado === 'hecho' ? '&#10003;' : i + 1}</span>
            </td>
          </tr>
        </table>
      </td>
      <td style="vertical-align: top; padding: 0 0 14px 0;">
        <p style="margin: 0 0 2px 0; color: ${estado === 'pendiente' ? colors.textMuted : colors.dark}; ${type.bodySm} font-weight: 700;">
          ${step.title}${estado === 'actual' ? ` <span style="color: ${colors.primary}; font-weight: 600;">· en curso</span>` : ''}
        </p>
        <p style="margin: 0; color: ${colors.textMuted}; ${type.bodySm}">${step.detalle}</p>
      </td>
    </tr>`
      })
      .join('')}
  </table>
`

/**
 * Rejilla de dos columnas con lo que incluye el servicio. Los items se toman
 * de a pares: en pantallas angostas los clientes de correo apilan las celdas
 * solos, así que no hace falta media query.
 */
const Beneficios = (items: { icono: IconoEmail; titulo: string; detalle: string }[]) => {
  const filas = []
  for (let i = 0; i < items.length; i += 2) filas.push(items.slice(i, i + 2))
  return `
  <table cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0 0 0;">
    ${filas
      .map(
        (fila, f) => `
    ${f > 0 ? '<tr><td colspan="2" style="height: 8px;"></td></tr>' : ''}
    <tr>
      ${fila
        .map(
          (item) => `
      <td width="50%" style="padding: 4px; vertical-align: top;">
        <table cellpadding="0" cellspacing="0" width="100%" style="background-color: ${colors.white}; border-radius: ${radius.control}; border: 1px solid ${colors.border};">
          <tr>
            <td style="padding: 18px 20px;">
              <div style="line-height: 0; margin: 0 0 10px 0;">${Icono(item.icono, 20)}</div>
              <p style="margin: 0 0 4px 0; color: ${colors.dark}; ${type.heading}">${item.titulo}</p>
              <p style="margin: 0; color: ${colors.textMuted}; ${type.bodySm}">${item.detalle}</p>
            </td>
          </tr>
        </table>
      </td>`,
        )
        .join('')}
    </tr>`,
      )
      .join('')}
  </table>
`
}


// ========================================
// TEMPLATES
// ========================================

// 1. Email de Bienvenida al Registrarse
export const emailBienvenida = ({ nombre }: EmailTemplateProps) => {
  const content = `
    <p style="margin: 0 0 24px 0; color: ${colors.text}; ${type.body}">
      Gracias por confiar en nosotros para la constitución de tu sociedad.
      Estamos listos para ayudarte a dar el primer paso hacia tu nueva empresa.
    </p>

    <table cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center">
          <div style="background-color: ${colors.primaryLight}; border-radius: ${radius.card}; padding: 28px; margin: 0 auto; max-width: 100%; border: 1px solid ${colors.primaryLine};">
            <img
              src="${ILLUSTRATION_WELCOME}"
              alt="Constituí tu empresa"
              width="220"
              style="height: auto; margin: 0 auto 16px auto; display: block;"
            />
            <!-- Sin icono: la ilustración de arriba ya cumple ese papel. -->
            <div style="text-align: center;">
              <h1 style="margin: 0 0 6px 0; color: ${colors.dark}; ${type.title}">
                ¡Bienvenido a QuieroMiSAS!
              </h1>
              <p style="margin: 0; color: ${colors.textMuted}; ${type.bodySm} font-weight: 600;">
                Tu cuenta ha sido creada exitosamente
              </p>
            </div>
          </div>
        </td>
      </tr>
    </table>

    ${Beneficios([
      { icono: 'clock-brand', titulo: 'Rápido', detalle: 'Tu S.A.S. lista en solo 5 días hábiles' },
      { icono: 'shield-check-brand', titulo: 'Seguro', detalle: 'Proceso 100% online y documentos protegidos' },
      { icono: 'chart-line-brand', titulo: 'Seguimiento', detalle: 'Panel online para ver tu progreso 24/7' },
      { icono: 'message-circle-brand', titulo: 'Soporte', detalle: 'Equipo experto disponible para ayudarte' },
    ])}

    ${CTAButton('Comenzar mi trámite', `${BASE_URL}/tramite/nuevo`)}

    <p style="margin: 24px 0 0 0; color: ${colors.textMuted}; ${type.bodySm}">
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
    <div style="line-height: 0; margin: 0 0 12px 0;">${Icono('mail-check-brand', 30)}</div>
    <h2 style="margin: 0 0 12px 0; color: ${colors.dark}; ${type.title}">
      Confirmá tu email
    </h2>
    <p style="margin: 0 0 16px 0; color: ${colors.textMuted}; ${type.body}">
      Para activar tu cuenta y poder completar tu trámite, necesitamos que confirmes tu dirección de email.
    </p>

    ${CTAButton('Verificar email', verifyUrl)}

    <div style="background-color: ${colors.background}; border: 1px solid ${colors.border}; border-radius: ${radius.control}; padding: 16px; margin-top: 16px;">
      <p style="margin: 0; color: ${colors.textMuted}; ${type.bodySm}">
        Si el botón no funciona, copiá y pegá este link en tu navegador:
        <br />
        <span style="word-break: break-all; color: ${colors.primary}; font-weight: 600;">${verifyUrl}</span>
      </p>
    </div>

    <p style="margin: 16px 0 0 0; color: ${colors.textMuted}; ${type.label} font-weight: 400;">
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
    <p style="margin: 0 0 24px 0; color: ${colors.text}; ${type.body}">
      Hemos recibido tu solicitud de constitución. Te mantendremos informado en cada etapa del proceso.
    </p>

    ${Hero(
      '¡Trámite recibido!',
      'Ya está en nuestra cola de revisión',
      'success',
      HeroDato(
        `<p style="margin: 0 0 4px 0; color: ${colors.textMuted}; ${type.label}">Tu sociedad</p>
         <p style="margin: 0; color: ${colors.dark}; ${type.title}">${denominacion}</p>`,
        'success',
      ),
    )}

    <!-- Próximos pasos -->
    <p style="margin: 0 0 16px 0; color: ${colors.dark}; ${type.heading}">
      Próximos pasos
    </p>

    ${ListaPasos([
      { title: 'Revisión', detalle: 'Validamos tu documentación', estado: 'actual' },
      { title: 'Pagos', detalle: 'Te notificamos los montos a abonar' },
      { title: 'Documentos', detalle: 'Firma y presentación ante el registro' },
      { title: 'Inscripción', detalle: 'Tu S.A.S. queda constituida' },
    ])}

    ${InfoCard(
      'Nuestro equipo revisará tu solicitud en las próximas horas y te notificaremos sobre los pagos necesarios para continuar.',
      'info',
      '¿Qué sigue?',
    )}

    ${CTAButton('Ver estado del trámite', `${BASE_URL}/dashboard/tramites/${tramiteId}`)}
  `

  return EmailLayout({
    children: content,
    nombre,
    preheader: `Tu trámite de ${denominacion} ha sido recibido. Te mantendremos informado del progreso.`
  })
}

// 3. Email cuando hay un pago pendiente
export const emailPagoPendiente = ({ nombre, concepto, monto, montoTransferencia, tramiteId }: EmailTemplateProps) => {
  const content = `
    <p style="margin: 0 0 24px 0; color: ${colors.text}; ${type.body}">
      Para avanzar con la constitución de tu sociedad, necesitamos que realices el siguiente pago:
    </p>

    ${Hero(
      'Pago requerido',
      'Para continuar con tu trámite',
      'warning',
      HeroDato(
        `<p style="margin: 0 0 4px 0; color: ${colors.textMuted}; ${type.label}">Concepto</p>
         <p style="margin: 0 0 16px 0; color: ${colors.dark}; ${type.heading}">${concepto}</p>
         <p style="margin: 0 0 4px 0; color: ${colors.textMuted}; ${type.label}">Monto</p>
         <p style="margin: 0; color: ${colors.warning}; ${type.hero}">$${Number(monto).toLocaleString('es-AR')}</p>
         <p style="margin: 4px 0 0 0; color: ${colors.textMuted}; ${type.label} font-weight: 400;">Precio regular (tarjeta / Mercado Pago)</p>
         ${montoTransferencia ? `
         <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid ${colors.border};">
           <p style="margin: 0; color: ${colors.success}; ${type.title}">$${Number(montoTransferencia).toLocaleString('es-AR')}</p>
           <p style="margin: 2px 0 0 0; color: ${colors.success}; ${type.label}">Pagando por transferencia · ahorrás $${(Number(monto) - Number(montoTransferencia)).toLocaleString('es-AR')}</p>
         </div>` : ''}`,
        'warning',
      ),
      'credit-card-warning',
    )}

    ${InfoCard(
      'Una vez realizado el pago, adjuntá el comprobante en la plataforma para que podamos verificarlo rápidamente.',
      'neutral',
      'Después de pagar',
    )}

    ${CTAButton('Realizar pago', `${BASE_URL}/dashboard/tramites/${tramiteId}`)}
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
    <p style="margin: 0 0 24px 0; color: ${colors.text}; ${type.body}">
      Hemos revisado el documento <strong>"${nombreDocumento}"</strong> y necesita algunas correcciones para poder continuar.
    </p>

    ${Hero('El documento necesita corrección', 'Revisá las observaciones y volvé a subirlo', 'danger', '', 'file-text-danger')}

    ${InfoCard(
      `<span style="white-space: pre-wrap;">${observaciones}</span>`,
      'danger',
      'Observaciones',
    )}

    ${InfoCard(
      'Escribinos por WhatsApp y te guiamos con las correcciones necesarias.',
      'info',
      '¿Necesitás ayuda?',
    )}

    ${CTAButton('Subir documento corregido', `${BASE_URL}/dashboard/tramites/${tramiteId}`)}
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
    <p style="margin: 0 0 24px 0; color: ${colors.text}; ${type.body}">
      ¡Buenas noticias! Hemos completado una etapa importante de tu trámite.
    </p>

    ${Hero(
      '¡Avanzó tu trámite!',
      'Ya podemos seguir con el próximo paso',
      'success',
      HeroDato(
        `<p style="margin: 0 0 4px 0; color: ${colors.textMuted}; ${type.label}">Etapa completada</p>
         <p style="margin: 0; color: ${colors.success}; ${type.heading}">${etapa}</p>`,
        'success',
      ),
    )}

    <p style="margin: 0 0 24px 0; color: ${colors.textMuted}; ${type.bodySm}">
      Seguimos trabajando en tu trámite. Te mantendremos informado de cada avance.
    </p>

    ${CTAButton('Ver progreso completo', `${BASE_URL}/dashboard/tramites/${tramiteId}`)}
  `

  return EmailLayout({
    children: content,
    nombre,
    preheader: `¡Avance en tu trámite! Etapa completada: ${etapa}`
  })
}

// 6. Email cuando la sociedad está inscripta (¡Trámite completo!)
/**
 * Qué le queda por hacer al cliente después de la inscripción, según su plan.
 *
 * Antes esta lista era la misma para todos y le pedía tramitar el CUIT en
 * ARCA — que está incluido en los tres planes. Es decir, le pedía a gente que
 * ya había pagado que hiciera el trabajo que compró. El alta de la actividad
 * corre por cuenta del cliente sólo en el plan Básico; en Emprendedor y
 * Premium la hacemos nosotros, y el alta de libros digitales sólo en Premium.
 */
function pasosSegunPlan(plan?: string) {
  const esBasico = plan === 'BASICO'
  const esPremium = plan === 'PREMIUM'

  const quedaPendiente = ['Descargá la Resolución de Inscripción y tu CUIT desde el panel']
  const yaIncluido: string[] = []

  if (esBasico) {
    quedaPendiente.push('Dar de alta la actividad en ARCA y habilitar el punto de venta')
  } else {
    yaIncluido.push('El alta de la actividad en ARCA y el punto de venta: te contactamos para hacerlo')
  }

  if (esPremium) {
    yaIncluido.push('El alta de tus libros digitales')
  } else {
    quedaPendiente.push('Dar de alta los libros digitales (podemos hacerlo por vos)')
  }

  quedaPendiente.push('Abrir la cuenta bancaria de la sociedad — te asesoramos sin cargo')

  return { quedaPendiente, yaIncluido }
}

export const emailSociedadInscripta = ({ nombre, denominacion, cuit, matricula, tramiteId, plan }: EmailTemplateProps) => {
  const { quedaPendiente, yaIncluido } = pasosSegunPlan(plan)
  const content = `
    <p style="margin: 0 0 24px 0; color: ${colors.text}; ${type.body}">
      ¡Excelentes noticias! Tu sociedad ha sido inscripta exitosamente y ya está oficialmente constituida.
      Ahora podés empezar a operar con tu nueva empresa.
    </p>

    ${Hero(
      '¡Felicitaciones!',
      `Tu sociedad está oficialmente inscripta`,
      'success',
      HeroDato(
        `<p style="margin: 0 0 4px 0; color: ${colors.textMuted}; ${type.label}">Denominación social</p>
         <p style="margin: 0; color: ${colors.dark}; ${type.title}">${denominacion}</p>`,
        'success',
      ),
      'badge-check-success',
    )}

    ${(cuit || matricula) ? `
    <!-- Datos oficiales -->
    <table cellpadding="0" cellspacing="0" width="100%" style="margin: 16px 0 0 0;">
      <tr>
        ${cuit ? `
        <td width="${matricula ? '50' : '100'}%" style="padding: 4px; vertical-align: top;">
          ${StatBox('CUIT', cuit)}
        </td>
        ` : ''}
        ${matricula ? `
        <td width="${cuit ? '50' : '100'}%" style="padding: 4px; vertical-align: top;">
          ${StatBox('Matrícula', matricula)}
        </td>
        ` : ''}
      </tr>
    </table>
    ` : ''}

    ${InfoCard(
      `<ul style="margin: 0; padding-left: 18px; line-height: 1.9;">
        ${quedaPendiente.map((p) => `<li>${p}</li>`).join('')}
      </ul>`,
      'neutral',
      '¿Qué sigue ahora?',
    )}

    ${
      yaIncluido.length
        ? InfoCard(
            `<ul style="margin: 0; padding-left: 18px; line-height: 1.9;">
              ${yaIncluido.map((p) => `<li>${p}</li>`).join('')}
            </ul>`,
            'success',
            'De esto nos ocupamos nosotros',
          )
        : ''
    }

    ${CTAButton('Descargar documentos oficiales', `${BASE_URL}/dashboard/tramites/${tramiteId}`)}

    <p style="margin: 32px 0 0 0; color: ${colors.text}; ${type.body}">
      Este es apenas el primer paso. Desde tu panel vas a poder acceder a la documentación de tu Sociedad cuando la necesites,
      y estamos para acompañarte en lo que siga: libros digitales, contabilidad, marcas y más.
    </p>

    <p style="margin: 20px 0 0 0; color: ${colors.textMuted}; ${type.bodySm}">
      ¡Gracias por confiar en QuieroMiSAS! Éxitos en tu nueva empresa.
    </p>
  `

  return EmailLayout({
    children: content,
    nombre,
    preheader: `¡Felicitaciones! Tu sociedad ${denominacion} está inscripta. CUIT: ${cuit || 'Pendiente'}`
  })
}

// 7. Email genérico para notificaciones
export const emailNotificacion = ({ nombre, titulo, mensaje, tramiteId }: EmailTemplateProps) => {
  const content = `
    <!--
      Notificación genérica: el título y el mensaje son variables, así que no
      hay un dato que destacar. Va como título y párrafo, sin el bloque de
      apertura de color: encerrar sólo un título en una caja dejaba un banner
      vacío.
    -->
    <h1 style="margin: 0 0 12px 0; color: ${colors.dark}; ${type.title}">${titulo}</h1>

    <p style="margin: 0; color: ${colors.text}; ${type.body}">
      ${mensaje}
    </p>

    ${tramiteId ? CTAButton('Ver trámite', `${BASE_URL}/dashboard/tramites/${tramiteId}`) : ''}
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
    <p style="margin: 0 0 24px 0; color: ${colors.text}; ${type.body}">
      Este es un recordatorio amigable: tenés un pago pendiente que está deteniendo el avance de tu trámite.
    </p>

    ${Hero(
      'Tenés un pago pendiente',
      `Hace ${diasPendientes} días que tenés un pago pendiente`,
      'warning',
      HeroDato(
        `<p style="margin: 0 0 4px 0; color: ${colors.textMuted}; ${type.label}">Concepto</p>
         <p style="margin: 0 0 16px 0; color: ${colors.dark}; ${type.heading}">${concepto}</p>
         <p style="margin: 0; color: ${colors.warning}; ${type.hero}">$${Number(monto).toLocaleString('es-AR')}</p>`,
        'warning',
      ),
      'credit-card-warning',
    )}

    <p style="margin: 0 0 24px 0; color: ${colors.textMuted}; ${type.bodySm}">
      Para continuar con tu trámite, por favor realizá este pago a la brevedad.
      Si ya lo realizaste, no olvides subir el comprobante.
    </p>

    ${CTAButton('Realizar pago ahora', `${BASE_URL}/dashboard/tramites/${tramiteId}`)}

    <p style="margin: 24px 0 0 0; color: ${colors.textMuted}; ${type.label} font-weight: 400;">
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
    <p style="margin: 0 0 24px 0; color: ${colors.text}; ${type.body}">
      Te recordamos que hace <strong>${diasPendientes} días</strong> te solicitamos correcciones en el documento
      <strong>"${nombreDocumento}"</strong> y aún no lo hemos recibido.
    </p>

    ${Hero(
      'Todavía falta el documento',
      `Hace ${diasPendientes} días que esperamos el documento corregido`,
      'danger',
      '',
      'file-text-danger',
    )}

    ${InfoCard(observaciones, 'danger', 'Observaciones originales')}

    <p style="margin: 0 0 24px 0; color: ${colors.textMuted}; ${type.bodySm}">
      Para que podamos avanzar con tu trámite, necesitamos que subas el documento corregido lo antes posible.
    </p>

    ${InfoCard(
      'Escribinos por WhatsApp y te guiamos con las correcciones.',
      'info',
      '¿Necesitás ayuda?',
    )}

    ${CTAButton('Subir documento ahora', `${BASE_URL}/dashboard/tramites/${tramiteId}`)}
  `

  return EmailLayout({
    children: content,
    nombre,
    preheader: `Recordatorio: Tu documento "${nombreDocumento}" está pendiente hace ${diasPendientes} días`
  })
}

// 10. Recordatorio de trámite estancado
export const emailRecordatorioTramiteEstancado = ({ nombre, etapaActual, diasEstancado, tramiteId }: EmailTemplateProps) => {
  const acciones = [
    'Verificar si hay pagos pendientes',
    'Revisar si hay documentos por subir',
    'Consultar el estado en tu panel',
    'Contactar a nuestro equipo si tenés dudas',
  ]
  const content = `
    <p style="margin: 0 0 24px 0; color: ${colors.text}; ${type.body}">
      Notamos que tu trámite lleva <strong>${diasEstancado} días</strong> en la etapa
      <strong>"${etapaActual}"</strong>. ¿Hay algo en lo que podamos ayudarte?
    </p>

    ${Hero('¿Necesitás ayuda?', `Tu trámite lleva ${diasEstancado} días sin avanzar`, 'info', '', 'circle-help-info')}

    ${InfoCard(
      `<ul style="margin: 0; padding-left: 18px; line-height: 1.9;">
        ${acciones.map((a) => `<li>${a}</li>`).join('')}
      </ul>`,
      'neutral',
      'Posibles acciones pendientes',
    )}

    ${CTAButton('Ver estado del trámite', `${BASE_URL}/dashboard/tramites/${tramiteId}`)}

    <p style="margin: 24px 0 0 0; color: ${colors.textMuted}; ${type.bodySm}">
      Estamos para ayudarte. Escribinos por WhatsApp o respondé este email.
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
    <p style="margin: 0 0 24px 0; color: ${colors.text}; ${type.body}">
      La reserva de denominación está próxima a vencer. Es necesario completar las etapas pendientes o renovar la reserva.
    </p>

    ${Hero(
      'La denominación está por vencer',
      `Quedan ${diasParaVencer} días para que venza`,
      'warning',
      HeroDato(
        `<p style="margin: 0 0 4px 0; color: ${colors.textMuted}; ${type.label}">Denominación</p>
         <p style="margin: 0 0 12px 0; color: ${colors.dark}; ${type.title}">${denominacion}</p>
         <span style="display: inline-block; background-color: ${colors.warning}; color: ${colors.white}; padding: 8px 16px; border-radius: ${radius.chip}; ${type.bodySm} font-weight: 700;">Vence en ${diasParaVencer} días</span>`,
        'warning',
      ),
      'clock-warning',
    )}

    ${CTAButton('Ver trámite', `${BASE_URL}/dashboard/admin/tramites/${tramiteId}`)}
  `

  return EmailLayout({
    children: content,
    nombre,
    preheader: `La denominación "${denominacion}" vence en ${diasParaVencer} días`
  })
}

// 12. Email de validación de trámite
export const emailValidacionTramite = ({ nombre, denominacion, validado, observaciones, tramiteId }: EmailTemplateProps) => {
  const content = validado ? `
    <p style="margin: 0 0 24px 0; color: ${colors.text}; ${type.body}">
      Tu trámite de constitución de <strong>${denominacion}</strong> ha sido revisado y validado por nuestro equipo.
    </p>

    ${Hero(
      'Trámite validado',
      `Tu solicitud ha sido revisada y aprobada`,
      'success',
      HeroDato(
        `<p style="margin: 0; color: ${colors.success}; ${type.heading}">Procederemos con el siguiente paso del proceso</p>`,
        'success',
      ),
    )}

    <p style="margin: 0 0 16px 0; color: ${colors.text}; ${type.body}">
      <strong>¿Cómo seguimos?</strong> Un Agente de QuieroMiSAS se va a contactar con vos por <strong>WhatsApp o email</strong> para despejar dudas y coordinar el <strong>pago de los honorarios</strong>, y así avanzar con la constitución de tu Sociedad.
    </p>
    <p style="margin: 0 0 24px 0; color: ${colors.text}; ${type.body}">
      Mientras tanto, para no perder tiempo, ya podés ir gestionando <strong>Ciudadano Digital Nivel 2</strong> para todas las personas que integren la Sociedad (es un requisito del sistema). Podés ver el instructivo <a href="${BASE_URL}/assets/img/CiudadanoDigital.jpeg" style="color: ${colors.primary}; font-weight: 600;">acá</a>.
    </p>

    ${CTAButton('Ver mi trámite', `${BASE_URL}/dashboard/tramites/${tramiteId || ''}`)}
  ` : `
    <p style="margin: 0 0 24px 0; color: ${colors.text}; ${type.body}">
      Hemos revisado tu trámite de constitución de <strong>${denominacion}</strong> y encontramos algunos puntos que requieren atención.
    </p>

    ${Hero(
      'El trámite necesita correcciones',
      `Encontramos algunos puntos que necesitan atención`,
      'danger',
    )}

    ${observaciones ? `
    <table cellpadding="0" cellspacing="0" width="100%" style="background-color: ${colors.errorBg}; border-radius: ${radius.card}; border: 1px solid ${colors.errorLine}; margin: 24px 0;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 8px 0; color: ${colors.dark}; ${type.heading}">Observaciones</p>
          <p style="margin: 0; color: ${colors.text}; ${type.bodySm} white-space: pre-wrap;">${observaciones}</p>
        </td>
      </tr>
    </table>
    ` : ''}

    <p style="margin: 0 0 24px 0; color: ${colors.textMuted}; ${type.bodySm}">
      Por favor, revisá la información y realizá las correcciones necesarias para continuar con el proceso.
    </p>

    ${CTAButton('Corregir trámite', `${BASE_URL}/dashboard/tramites/${tramiteId || ''}`)}

    <table cellpadding="0" cellspacing="0" width="100%" style="background-color: ${colors.infoBg}; border-radius: ${radius.control}; border: 1px solid ${colors.border}; margin: 24px 0;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 4px 0; color: ${colors.dark}; ${type.heading}">¿Necesitás ayuda?</p>
          <p style="margin: 0; color: ${colors.text}; ${type.bodySm}">
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
      ? `Tu trámite de ${denominacion} ha sido validado`
      : `Tu trámite de ${denominacion} requiere correcciones`
  })
}

// ========================================
// CORREO MANUAL
// ========================================

/**
 * Escapa el texto que escribe el operador antes de meterlo en el HTML.
 * Es texto plano de un textarea: si trae un `<` no debe convertirse en marcado.
 */
function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Envuelve un mensaje escrito a mano desde la bandeja en el mismo sobre que
 * usan los mails automáticos.
 *
 * Antes cada pantalla armaba su propio HTML: la de redactar ponía cabecera con
 * degradado rojo, pie oscuro y encima un bloque de firma que repetía el logo
 * y el pie otra vez; la de responder mandaba texto pelado con una línea
 * "— QuieroMiSAS". Eran tres estéticas distintas para correos del mismo
 * remitente, así que el armado pasó al servidor y hay un solo sobre.
 *
 * Recibe un objeto como el resto de las plantillas, para que siga entrando en
 * el registro por nombre que usan sendEmail y la vista previa.
 *
 * @param texto   Lo que escribió el operador, en texto plano.
 * @param nombre  Con quién saluda el encabezado.
 */
export const emailManual = ({ texto, nombre }: { texto: string; nombre: string }) => {
  const parrafos = escaparHtml(texto)
    .split('\n')
    .map((linea) =>
      linea.trim()
        ? `<p style="margin: 0 0 12px 0; color: ${colors.text}; ${type.body}">${linea}</p>`
        : '<div style="height: 8px; line-height: 8px; font-size: 0;">&nbsp;</div>',
    )
    .join('')

  return EmailLayout({
    children: parrafos,
    nombre,
    preheader: texto.replace(/\s+/g, ' ').trim().slice(0, 120),
  })
}
