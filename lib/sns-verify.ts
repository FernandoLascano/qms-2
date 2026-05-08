/**
 * Verificación de firmas de mensajes HTTP de Amazon SNS (SignatureVersion 1).
 * @see https://docs.aws.amazon.com/sns/latest/dg/sns-verify-signature-of-message-verify.html
 */
import { createVerify, X509Certificate } from 'crypto'

const ALLOWED_SIGNING_CERT_HOSTS = /\.amazonaws\.com(\.cn)?$/i

function isAllowedSigningCertUrl(urlStr: string): boolean {
  try {
    const u = new URL(urlStr)
    if (u.protocol !== 'https:') return false
    return ALLOWED_SIGNING_CERT_HOSTS.test(u.hostname)
  } catch {
    return false
  }
}

function isAllowedSubscribeUrl(urlStr: string): boolean {
  try {
    const u = new URL(urlStr)
    if (u.protocol !== 'https:') return false
    // SNS subscription / unsubscribe endpoints
    if (!ALLOWED_SIGNING_CERT_HOSTS.test(u.hostname)) return false
    return /^sns\.[a-z0-9-]+\.amazonaws\.com$/i.test(u.hostname)
  } catch {
    return false
  }
}

function buildStringToSign(message: Record<string, unknown>): string | null {
  const type = message.Type
  if (type === 'Notification') {
    const m = message.Message
    const mid = message.MessageId
    const ts = message.Timestamp
    const topic = message.TopicArn
    const t = message.Type
    if (typeof m !== 'string' || typeof mid !== 'string' || typeof ts !== 'string') return null
    if (typeof topic !== 'string' || typeof t !== 'string') return null
    let s = `Message\n${m}\nMessageId\n${mid}\n`
    if (typeof message.Subject === 'string' && message.Subject !== '') {
      s += `Subject\n${message.Subject}\n`
    }
    s += `Timestamp\n${ts}\nTopicArn\n${topic}\nType\n${t}\n`
    return s
  }

  if (type === 'SubscriptionConfirmation') {
    const m = message.Message
    const mid = message.MessageId
    const subUrl = message.SubscribeURL
    const ts = message.Timestamp
    const token = message.Token
    const topic = message.TopicArn
    const t = message.Type
    if (
      typeof m !== 'string' ||
      typeof mid !== 'string' ||
      typeof subUrl !== 'string' ||
      typeof ts !== 'string' ||
      typeof token !== 'string' ||
      typeof topic !== 'string' ||
      typeof t !== 'string'
    ) {
      return null
    }
    return `Message\n${m}\nMessageId\n${mid}\nSubscribeURL\n${subUrl}\nTimestamp\n${ts}\nToken\n${token}\nTopicArn\n${topic}\nType\n${t}\n`
  }

  if (type === 'UnsubscribeConfirmation') {
    const m = message.Message
    const mid = message.MessageId
    const unsubUrl = message.UnsubscribeURL
    const ts = message.Timestamp
    const token = message.Token
    const topic = message.TopicArn
    const t = message.Type
    if (
      typeof m !== 'string' ||
      typeof mid !== 'string' ||
      typeof unsubUrl !== 'string' ||
      typeof ts !== 'string' ||
      typeof token !== 'string' ||
      typeof topic !== 'string' ||
      typeof t !== 'string'
    ) {
      return null
    }
    return `Message\n${m}\nMessageId\n${mid}\nUnsubscribeURL\n${unsubUrl}\nTimestamp\n${ts}\nToken\n${token}\nTopicArn\n${topic}\nType\n${t}\n`
  }

  return null
}

async function fetchSigningCertPem(signingCertUrl: string): Promise<string> {
  const res = await fetch(signingCertUrl, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Cert fetch failed: ${res.status}`)
  return res.text()
}

/**
 * Verifica firma SNS. Devuelve ok=false si el mensaje no es confiable.
 */
export async function verifyAwsSnsMessage(
  message: Record<string, unknown>
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const sigVersion = String(message.SignatureVersion ?? '')
  if (sigVersion !== '1') {
    return { ok: false, reason: `SignatureVersion no soportada: ${sigVersion || '(vacía)'}` }
  }

  const signature = message.Signature
  const signingCertUrl = message.SigningCertURL
  if (typeof signature !== 'string' || typeof signingCertUrl !== 'string') {
    return { ok: false, reason: 'Signature o SigningCertURL faltante' }
  }

  if (!isAllowedSigningCertUrl(signingCertUrl)) {
    return { ok: false, reason: 'SigningCertURL no permitida' }
  }

  const stringToSign = buildStringToSign(message)
  if (!stringToSign) {
    return { ok: false, reason: 'Tipo SNS desconocido o campos incompletos' }
  }

  let certPem: string
  try {
    certPem = await fetchSigningCertPem(signingCertUrl)
  } catch {
    return { ok: false, reason: 'No se pudo obtener el certificado de firma' }
  }

  try {
    const x509 = new X509Certificate(certPem)
    const publicKey = x509.publicKey
    const verifier = createVerify('RSA-SHA1')
    verifier.update(stringToSign, 'utf8')
    const valid = verifier.verify(publicKey, signature, 'base64')
    if (!valid) return { ok: false, reason: 'Firma RSA-SHA1 inválida' }
  } catch {
    return { ok: false, reason: 'Error al verificar certificado o firma' }
  }

  return { ok: true }
}

export function assertAllowedSubscribeUrl(urlStr: string): boolean {
  return isAllowedSubscribeUrl(urlStr)
}
