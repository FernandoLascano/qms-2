/**
 * URL mostrable del logo de un partner.
 *
 * Los logos nuevos se suben al bucket público (`assets-publicos`) y se guardan
 * con su URL pública completa, que se usa tal cual. Los primeros logos, en
 * cambio, quedaron en el bucket privado `documentos` con una URL "pública" que
 * Supabase rechaza (el bucket no es público). Para esos devolvemos la ruta
 * proxy `/api/partners/logo/...`, que los sirve sin exponer el resto del bucket.
 *
 * Es una función pura (sin dependencias de servidor) para poder usarla también
 * en componentes de cliente.
 */
export const PARTNER_LOGOS_PREFIX = 'partners/logos/'

const BUCKET_PRIVADO = 'documentos'

export function urlLogoPartner(stored: string | null | undefined): string | null {
  if (!stored) return null

  const m = stored.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/?]+)\/([^?]+)/)
  if (m) {
    const [, bucket, objectPath] = m
    if (bucket === BUCKET_PRIVADO && objectPath.startsWith(PARTNER_LOGOS_PREFIX)) {
      return `/api/partners/logo/${objectPath.slice(PARTNER_LOGOS_PREFIX.length)}`
    }
    return stored
  }

  // Path suelto guardado (sin URL): también vive en el bucket privado.
  if (!/^https?:\/\//.test(stored) && stored.startsWith(PARTNER_LOGOS_PREFIX)) {
    return `/api/partners/logo/${stored.slice(PARTNER_LOGOS_PREFIX.length)}`
  }

  return stored
}
