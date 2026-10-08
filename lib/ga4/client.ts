import { GoogleAuth } from 'google-auth-library'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { CUENTA_ANALYTICS, clienteSinClaves, enVercel } from '@/lib/gcp'

const GA4_READONLY_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly'

export type Ga4ClientResult =
  | { ok: true; client: BetaAnalyticsDataClient; method: 'service_account' | 'vercel_oidc' | 'oauth' }
  | { ok: false; error: string }

/**
 * GA4 Data API. Modos de autenticación, en orden de preferencia:
 *
 * 1) Service Account con clave en env: GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 o
 *    GOOGLE_SERVICE_ACCOUNT_JSON. (El proyecto de Google no deja crear claves,
 *    así que en la práctica no se usa.)
 *
 * 2) Sin claves, desde Vercel (lo que se usa en producción): la cuenta
 *    qms-analytics vía el token OIDC de Vercel (lib/gcp.ts). No vence. Requiere
 *    que ese email tenga acceso "Lector" en la propiedad GA4.
 *
 * 3) OAuth2 refresh token de usuario (legacy, se vence: sólo para correr en
 *    una máquina local): GOOGLE_OAUTH_CLIENT_ID / _SECRET / _REFRESH_TOKEN.
 */
function trimEnv(v: string | undefined): string | undefined {
  if (v == null) return undefined
  let s = v.trim()
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim()
  }
  return s || undefined
}

/** Carga la credencial de service account desde env (base64 o JSON crudo). */
function loadServiceAccount(): { client_email: string; private_key: string } | { error: string } | null {
  const b64 = trimEnv(process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64)
  const raw = trimEnv(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)

  let jsonStr: string | undefined
  if (b64) {
    try {
      jsonStr = Buffer.from(b64, 'base64').toString('utf8')
    } catch {
      return { error: 'GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 no es base64 válido.' }
    }
  } else if (raw) {
    jsonStr = raw
  } else {
    return null // no configurada → probamos OAuth
  }

  try {
    const parsed = JSON.parse(jsonStr) as { client_email?: string; private_key?: string }
    if (!parsed.client_email || !parsed.private_key) {
      return { error: 'El JSON de la service account no tiene client_email / private_key.' }
    }
    // Por si el private_key quedó con los saltos de línea escapados.
    const private_key = parsed.private_key.replace(/\\n/g, '\n')
    return { client_email: parsed.client_email, private_key }
  } catch {
    return { error: 'El JSON de la service account no se pudo parsear.' }
  }
}

export function createGa4DataClient(): Ga4ClientResult {
  // 1) Service Account (preferido)
  const sa = loadServiceAccount()
  if (sa && 'error' in sa) {
    return { ok: false, error: sa.error }
  }
  if (sa) {
    const auth = new GoogleAuth({
      credentials: {
        client_email: sa.client_email,
        private_key: sa.private_key,
      },
      scopes: [GA4_READONLY_SCOPE],
    })
    return { ok: true, client: new BetaAnalyticsDataClient({ auth }), method: 'service_account' }
  }

  // 2) Sin claves, desde Vercel
  if (enVercel() && process.env.GA4_SIN_CLAVES !== 'false') {
    const auth = new GoogleAuth({ authClient: clienteSinClaves(CUENTA_ANALYTICS, [GA4_READONLY_SCOPE]) })
    return { ok: true, client: new BetaAnalyticsDataClient({ auth }), method: 'vercel_oidc' }
  }

  // 3) OAuth2 refresh token (legacy)
  const clientId = trimEnv(process.env.GOOGLE_OAUTH_CLIENT_ID)
  const clientSecret = trimEnv(process.env.GOOGLE_OAUTH_CLIENT_SECRET)
  const refreshToken = trimEnv(process.env.GOOGLE_OAUTH_REFRESH_TOKEN)

  if (!clientId || !clientSecret || !refreshToken) {
    return {
      ok: false,
      error:
        'Configurá una Service Account (GOOGLE_SERVICE_ACCOUNT_JSON_BASE64) con acceso Viewer a la propiedad GA4, o el flujo OAuth (GOOGLE_OAUTH_CLIENT_ID/SECRET/REFRESH_TOKEN).',
    }
  }

  const auth = new GoogleAuth({
    credentials: {
      type: 'authorized_user',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    },
    scopes: [GA4_READONLY_SCOPE],
  })

  return { ok: true, client: new BetaAnalyticsDataClient({ auth }), method: 'oauth' }
}

export function getGa4PropertyResource(): { ok: true; property: string } | { ok: false; error: string } {
  const id = trimEnv(process.env.GA4_PROPERTY_ID) || '516402270'
  if (!/^\d+$/.test(id)) {
    return { ok: false, error: 'GA4_PROPERTY_ID debe ser numérico (ID de propiedad GA4).' }
  }
  return { ok: true, property: `properties/${id}` }
}
