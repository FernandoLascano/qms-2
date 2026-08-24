import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo/site'

/**
 * No se listan reglas para GPTBot, ClaudeBot, PerplexityBot ni Google-Extended
 * a propósito: sin reglas propias les aplica `User-agent: *`, que los deja
 * entrar. Es lo que queremos — que los asistentes puedan leer y citar el sitio.
 */
export default function robots(): MetadataRoute.Robots {

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/tramite/',
          '/_next/',
          '/private/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/dashboard/', '/api/', '/tramite/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
