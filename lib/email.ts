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
  bcc?: string | string[]
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

const QMS_LOGO_URL = process.env.EMAIL_LOGO_URL || 'https://www.quieromisas.com/assets/img/qms-logo-white.png'
const QMS_PRIMARY_RED = '#991B1B'
const QMS_PRIMARY_RED_DARK = '#7F1D1D'

function withQmsSignature(html: string): string {
  // Evita duplicar firma si el HTML ya la contiene.
  if (html.includes('data-qms-signature="true"')) return html

  const signatureBlock = `
    <div data-qms-signature="true" style="margin-top:24px;padding-top:18px;border-top:1px solid #e5e7eb;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#111827;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="padding:16px 20px;background:linear-gradient(135deg,${QMS_PRIMARY_RED} 0%,${QMS_PRIMARY_RED_DARK} 100%);text-align:center;">
            <img src="${QMS_LOGO_URL}" alt="QuieroMiSAS" width="150" style="height:auto;display:block;margin:0 auto;" />
          </td>
        </tr>
        <tr>
          <td style="padding:14px 20px;text-align:center;">
            <p style="margin:0;color:#E5E7EB;font-size:13px;line-height:1.6;">
              QuieroMiSAS · Constitui tu empresa en 5 dias
            </p>
            <p style="margin:6px 0 0 0;color:#9CA3AF;font-size:12px;line-height:1.6;">
              contacto@quieromisas.com · <a href="https://www.quieromisas.com" style="color:#FCA5A5;text-decoration:none;">www.quieromisas.com</a>
            </p>
          </td>
        </tr>
      </table>
    </div>
  `

  if (html.includes('</body>')) {
    return html.replace('</body>', `${signatureBlock}</body>`)
  }

  return `${html}${signatureBlock}`
}

function withQmsSignatureText(text?: string): string {
  const base = (text || '').trim()
  const signature = [
    '',
    '---',
    'QuieroMiSAS | Constitui tu empresa en 5 dias',
    'contacto@quieromisas.com',
    'https://www.quieromisas.com',
  ].join('\n')

  if (base.includes('QuieroMiSAS | Constitui tu empresa en 5 dias')) return base
  return `${base}${signature}`
}

export async function sendEmail({ to, cc, bcc, subject, html, text, replyTo, attachments }: EmailOptions) {
  try {
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'contacto@quieromisas.com'
    const fromName = process.env.SMTP_FROM_NAME || 'QuieroMiSAS'
    const htmlWithSignature = withQmsSignature(html)
    const textWithSignature = withQmsSignatureText(text || html.replace(/<[^>]*>/g, ''))

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      cc: cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : undefined,
      bcc: bcc ? (Array.isArray(bcc) ? bcc.join(', ') : bcc) : undefined,
      replyTo,
      subject,
      html: htmlWithSignature,
      text: textWithSignature,
      attachments
    })

    return { success: true, messageId: info.messageId }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
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
