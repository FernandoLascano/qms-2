/**
 * Datos JSON-LD del layout raíz.
 *
 * Se renderizan como <script type="application/ld+json"> del lado del servidor
 * (ver app/layout.tsx). Antes se cargaban con next/script para no inflar el
 * HTML inicial, y el efecto era que NO existían hasta que el navegador
 * hidrataba: en el HTML servido no había un solo @type. Googlebot ejecuta JS y
 * podía llegar a verlos en la segunda pasada, pero los crawlers de los
 * asistentes (GPTBot, ClaudeBot, PerplexityBot) no ejecutan JavaScript, así que
 * para ellos el sitio no tenía ningún dato estructurado. Son unos pocos KB.
 */
import { SITE_URL, urlDe } from '@/lib/seo/site'
import { faqs } from '@/lib/faqs'

export const rootOrganizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'QuieroMiSAS',
  alternateName: 'Martínez Wehbe & Asociados',
  url: SITE_URL,
  logo: urlDe('/assets/img/qms-logo-reg.png'),
  image: urlDe('/assets/img/qms-logo-reg.png'),
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+54-9-351-213-6212',
    contactType: 'customer service',
    email: 'contacto@quieromisas.com',
    availableLanguage: ['Spanish'],
    areaServed: 'AR',
  },
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Ituzaingó 87, 5to Piso',
    addressLocality: 'Córdoba',
    addressRegion: 'Córdoba',
    postalCode: '5000',
    addressCountry: 'AR',
  },
  sameAs: [] as string[],
}

type PreciosPlanes = {
  precioPlanBasico: number
  precioPlanPremium: number
}

export const buildLegalServiceJsonLd = ({ precioPlanBasico, precioPlanPremium }: PreciosPlanes) => ({
  '@context': 'https://schema.org',
  '@type': 'LegalService',
  name: 'Constitución de SAS Online - QuieroMiSAS',
  description:
    'Servicio de constitución de Sociedades por Acciones Simplificadas (S.A.S.) 100% online en Argentina. Córdoba y CABA. CUIT y matrícula en 5 días hábiles.',
  url: SITE_URL,
  provider: { '@type': 'Organization', name: 'QuieroMiSAS' },
  areaServed: [
    { '@type': 'State', name: 'Córdoba' },
    { '@type': 'State', name: 'Buenos Aires' },
  ],
  serviceType: 'Constitución de Sociedades',
  telephone: '+54-9-351-213-6212',
  email: 'contacto@quieromisas.com',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Córdoba',
    addressRegion: 'Córdoba',
    addressCountry: 'AR',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: '-31.4201',
    longitude: '-64.1888',
  },
  priceRange: '$$',
  offers: {
    '@type': 'AggregateOffer',
    lowPrice: String(precioPlanBasico),
    highPrice: String(precioPlanPremium),
    priceCurrency: 'ARS',
    offerCount: '3',
  },
})

/**
 * El marcado sale de la MISMA lista que renderiza la sección de preguntas.
 * Google pide que el contenido marcado esté visible en la página; cuando eran
 * dos listas escritas aparte, las 8 marcadas no coincidían con ninguna de las
 * 15 visibles. Ya no recibe los precios: las respuestas visibles no los
 * mencionan, y marcar un texto que el visitante no lee es justamente lo que la
 * regla prohíbe.
 */
export const buildFaqJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.pregunta,
    acceptedAnswer: { '@type': 'Answer', text: f.respuesta },
  })),
})

export const rootBreadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: urlDe('/blog') },
  ],
}
