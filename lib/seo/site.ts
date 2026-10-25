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

/**
 * Metadatos de una página pública: canonical + Open Graph + Twitter propios.
 *
 * Next reemplaza (no fusiona) el `openGraph` del layout raíz cuando la página
 * declara el suyo, y lo hereda entero cuando no: sin esto, compartir
 * /privacidad mostraba el título y el og:url de la home.
 */
export function metadataDePagina({ ruta, titulo, descripcion }: { ruta: string; titulo: string; descripcion?: string }) {
  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical: ruta },
    openGraph: {
      type: 'website' as const,
      locale: 'es_AR',
      siteName: 'QuieroMiSAS',
      url: ruta,
      title: titulo,
      description: descripcion,
      images: ['/opengraph-image'],
    },
    twitter: { card: 'summary_large_image' as const, title: titulo, description: descripcion, images: ['/opengraph-image'] },
  }
}
