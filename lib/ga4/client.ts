import { OAuth2Client, GoogleAuth } from 'google-auth-library'
import { BetaAnalyticsDataClient } from '@google-analytics/data'

const GA4_READONLY_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly'

export type Ga4ClientResult =
  | { ok: true; client: BetaAnalyticsDataClient }
  | { ok: false; error: string }

/**
 * GA4 Data API con OAuth2 (refresh token). No usa claves JSON de service account.
 * Variables: GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN
 */
function trimEnv(v: string | undefined): string | undefined {
  if (v == null) return undefined
  let s = v.trim()
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim()
  }
  return s || undefined
}

export function createGa4DataClient(): Ga4ClientResult {
  const clientId = trimEnv(process.env.GOOGLE_OAUTH_CLIENT_ID)
  const clientSecret = trimEnv(process.env.GOOGLE_OAUTH_CLIENT_SECRET)
  const refreshToken = trimEnv(process.env.GOOGLE_OAUTH_REFRESH_TOKEN)

  if (!clientId || !clientSecret || !refreshToken) {
    return {
      ok: false,
      error:
        'Configurá en Vercel (o .env local) GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET y GOOGLE_OAUTH_REFRESH_TOKEN. El refresh token se obtiene una vez con OAuth (p. ej. OAuth Playground) con el scope analytics.readonly.',
    }
  }

  const auth = new OAuth2Client(clientId, clientSecret)
  auth.setCredentials({
    refresh_token: refreshToken,
    scope: GA4_READONLY_SCOPE,
  })

  // google-gax tipa `auth` como GoogleAuth; OAuth2Client funciona en runtime para refresh token.
  const client = new BetaAnalyticsDataClient({
    auth: auth as unknown as GoogleAuth,
  })
  return { ok: true, client }
}

export function getGa4PropertyResource(): { ok: true; property: string } | { ok: false; error: string } {
  const id = trimEnv(process.env.GA4_PROPERTY_ID) || '516402270'
  if (!/^\d+$/.test(id)) {
    return { ok: false, error: 'GA4_PROPERTY_ID debe ser numérico (ID de propiedad GA4).' }
  }
  return { ok: true, property: `properties/${id}` }
}
