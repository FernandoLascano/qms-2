import { IdentityPoolClient } from 'google-auth-library'
import { getVercelOidcToken } from '@vercel/functions/oidc'

/**
 * Acceso a Google Cloud sin claves desde Vercel (Workload Identity
 * Federation). Vercel entrega en cada función un token OIDC del equipo
 * (fernandolascanos-projects); Google lo acepta sólo de ese equipo y con él
 * actúa como una cuenta de servicio con permisos mínimos. No hay nada
 * guardado que pueda vencerse ni filtrarse.
 *
 * Proyecto de Google Cloud: "My First Project" (project-4ca27e64-983d-4143-889).
 * Los valores no son secretos; se pueden pisar por variable de entorno.
 */
export const PROYECTO_GCP = 'project-4ca27e64-983d-4143-889'

export const WIF_PROVIDER =
  process.env.GCP_WIF_PROVIDER ||
  '//iam.googleapis.com/projects/524890341277/locations/global/workloadIdentityPools/vercel/providers/vercel'

/** Cuentas de servicio, cada una con un solo permiso. */
export const CUENTA_PDF = process.env.GCP_PDF_SERVICE_ACCOUNT || `qms-pdf@${PROYECTO_GCP}.iam.gserviceaccount.com`
export const CUENTA_ANALYTICS =
  process.env.GCP_ANALYTICS_SERVICE_ACCOUNT || `qms-analytics@${PROYECTO_GCP}.iam.gserviceaccount.com`

/** Sólo funciona dentro de una función de Vercel (ahí existe el token OIDC). */
export const enVercel = () => !!process.env.VERCEL

/** Cliente de Google que actúa como `cuenta` con los `scopes` pedidos. */
export function clienteSinClaves(cuenta: string, scopes: string[]) {
  return new IdentityPoolClient({
    type: 'external_account',
    audience: WIF_PROVIDER,
    subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
    token_url: 'https://sts.googleapis.com/v1/token',
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${cuenta}:generateAccessToken`,
    subject_token_supplier: { getSubjectToken: () => getVercelOidcToken() },
    scopes,
  })
}
