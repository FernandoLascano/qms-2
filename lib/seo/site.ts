/**
 * Dominio canónico del sitio.
 *
 * Es una constante y no una variable de entorno a propósito. El canonical, el
 * `metadataBase`, el sitemap y el JSON-LD tienen que apuntar todos al MISMO
 * origen: si sale de una variable y en el deploy queda mal (la URL efímera de
 * Vercel, o el dominio sin `www`), Google reparte las señales entre dos sitios
 * que cree distintos. Un valor fijo no puede desincronizarse.
 */
export const SITE_URL = 'https://www.quieromisas.com'

/** Absolutiza una ruta contra el dominio canónico. */
export const urlDe = (ruta: string) => new URL(ruta, SITE_URL).toString()
