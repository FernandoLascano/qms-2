import { getVercelOidcToken } from '@vercel/functions/oidc'

/**
 * Conversión a PDF con Gotenberg (Chromium y LibreOffice en un contenedor:
 * https://gotenberg.dev). Vercel no puede correrlos, así que el servicio vive
 * en Google Cloud Run (proyecto "My First Project", San Pablo).
 *
 * El servicio es privado: sólo acepta pedidos con un token de Google. No hay
 * claves guardadas: Vercel entrega un token OIDC propio del equipo
 * (fernandolascanos-projects), Google lo canjea (Workload Identity
 * Federation) y con eso la cuenta de servicio qms-pdf, que sólo puede invocar
 * este servicio, emite el token que pide Cloud Run.
 *
 * Los valores no son secretos; se pueden pisar por variable de entorno.
 */
const GOTENBERG_URL = process.env.GOTENBERG_URL || 'https://gotenberg-524890341277.southamerica-east1.run.app'
const WIF_PROVIDER =
  process.env.GCP_WIF_PROVIDER ||
  '//iam.googleapis.com/projects/524890341277/locations/global/workloadIdentityPools/vercel/providers/vercel'
const CUENTA_SERVICIO =
  process.env.GCP_PDF_SERVICE_ACCOUNT || 'qms-pdf@project-4ca27e64-983d-4143-889.iam.gserviceaccount.com'

/** Sólo se puede convertir corriendo en Vercel (o con un token de prueba local). */
export function conversorPdfConfigurado(): boolean {
  return !!process.env.VERCEL || !!process.env.GOTENBERG_ID_TOKEN
}

async function tokenParaGotenberg(): Promise<string> {
  // Para probar desde una máquina local: `gcloud auth print-identity-token`.
  if (process.env.GOTENBERG_ID_TOKEN) return process.env.GOTENBERG_ID_TOKEN

  const sts = await fetch('https://sts.googleapis.com/v1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
      audience: WIF_PROVIDER,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
      subjectTokenType: 'urn:ietf:params:oauth:token-type:jwt',
      subjectToken: await getVercelOidcToken(),
    }),
  })
  if (!sts.ok) throw new Error(`Google STS respondió ${sts.status}: ${(await sts.text()).slice(0, 200)}`)
  const { access_token } = (await sts.json()) as { access_token: string }

  const id = await fetch(
    `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${CUENTA_SERVICIO}:generateIdToken`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access_token}` },
      body: JSON.stringify({ audience: GOTENBERG_URL, includeEmail: true }),
    },
  )
  if (!id.ok) throw new Error(`Google IAM respondió ${id.status}: ${(await id.text()).slice(0, 200)}`)
  return ((await id.json()) as { token: string }).token
}

/**
 * HTML a PDF con el Chromium de Gotenberg. El tamaño y los márgenes salen del
 * @page del propio HTML; el pie se dibuja en el margen inferior de cada hoja.
 */
export async function htmlAPdf(html: string, pie?: string): Promise<Buffer> {
  const form = new FormData()
  form.append('files', new Blob([html], { type: 'text/html' }), 'index.html')
  if (pie) form.append('files', new Blob([pie], { type: 'text/html' }), 'footer.html')
  form.append('preferCssPageSize', 'true')
  form.append('printBackground', 'true')

  const res = await fetch(`${GOTENBERG_URL}/forms/chromium/convert/html`, {
    method: 'POST',
    body: form,
    headers: { Authorization: `Bearer ${await tokenParaGotenberg()}` },
    signal: AbortSignal.timeout(45_000),
  })
  if (!res.ok) {
    throw new Error(`Gotenberg respondió ${res.status}: ${(await res.text()).slice(0, 200)}`)
  }
  return Buffer.from(await res.arrayBuffer())
}
