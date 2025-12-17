import { Resend } from 'resend'

// Configurar Resend
const resendApiKey = process.env.RESEND_API_KEY

if (!resendApiKey) {
  console.warn('⚠️ RESEND_API_KEY no está configurado. Los emails no se enviarán.')
}

export const resend = new Resend(resendApiKey)

// Email por defecto para enviar (debe estar verificado en Resend)
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
export const REPLY_TO_EMAIL = process.env.RESEND_REPLY_TO || 'info@quieromisas.com'

// Verificar si Resend está configurado
export const isResendConfigured = () => {
  return !!resendApiKey
}

