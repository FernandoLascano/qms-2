/** Datos JSON-LD del layout raíz (cargados con next/script para no inflar el HTML inicial). */

export const rootOrganizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'QuieroMiSAS',
  alternateName: 'Martínez Wehbe & Asociados',
  url: 'https://www.quieromisas.com',
  logo: 'https://www.quieromisas.com/assets/img/qms-logo-reg.png',
  image: 'https://www.quieromisas.com/assets/img/qms-logo-reg.png',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+54-351-428-4037',
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

export const rootLegalServiceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LegalService',
  name: 'Constitución de SAS Online - QuieroMiSAS',
  description:
    'Servicio de constitución de Sociedades por Acciones Simplificadas (S.A.S.) 100% online en Argentina. Córdoba y CABA. CUIT y matrícula en 5 días hábiles.',
  url: 'https://www.quieromisas.com',
  provider: { '@type': 'Organization', name: 'QuieroMiSAS' },
  areaServed: [
    { '@type': 'State', name: 'Córdoba' },
    { '@type': 'State', name: 'Buenos Aires' },
  ],
  serviceType: 'Constitución de Sociedades',
  telephone: '+54-351-428-4037',
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
    lowPrice: '285000',
    highPrice: '390000',
    priceCurrency: 'ARS',
    offerCount: '3',
  },
}

export const rootFaqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Qué es una S.A.S. y por qué elegirla para mi empresa?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'La Sociedad por Acciones Simplificada (S.A.S.) es el tipo societario más moderno de Argentina, creado por la Ley 27.349. Es ideal para emprendedores porque se constituye 100% online, puede tener un solo socio, tiene menores costos que una S.R.L. o S.A., y otorga responsabilidad limitada al capital aportado.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuánto cuesta constituir una S.A.S. en Argentina?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Los honorarios profesionales van desde $285.000 en el plan Básico hasta $390.000 en el plan Premium, más los gastos de jurisdicción (tasas gubernamentales de IPJ o IGJ). Es significativamente más económico que constituir una S.R.L. o S.A.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuánto tiempo tarda constituir una S.A.S.?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Con QuieroMiSAS, tu S.A.S. estará inscripta y operativa en aproximadamente 5 días hábiles desde que se presenta toda la documentación necesaria. Recibís CUIT, matrícula y estatuto inscripto.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuál es la diferencia entre S.A.S., S.R.L. y S.A.?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'La S.A.S. se puede constituir con 1 solo socio, es 100% digital, más rápida (5 días vs semanas/meses) y más económica. La S.R.L. necesita mínimo 2 socios y trámites presenciales. La S.A. requiere mínimo 2 accionistas, es más costosa y tiene mayor control estatal. Para emprendedores y startups, la S.A.S. es la opción más conveniente.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Puedo constituir una S.A.S. con un solo socio?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí, la S.A.S. permite la constitución unipersonal. Es la única forma societaria en Argentina que permite tener un solo socio con responsabilidad limitada al capital aportado.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuál es el capital mínimo para una S.A.S.?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'El capital mínimo es equivalente a 2 veces el salario mínimo vital y móvil vigente. Solo se necesita integrar el 25% al momento de la constitución y el resto dentro de los 2 años.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Necesito ir a una escribanía para constituir la S.A.S.?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No, el proceso es 100% online. La firma digital reemplaza la necesidad de escribanía. Toda la documentación se gestiona de forma remota a través de nuestra plataforma.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Qué recibo al finalizar el trámite de constitución?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Recibís el estatuto social inscripto, número de CUIT de la sociedad, matrícula, y según el plan elegido, guía para libros digitales y alta para facturar electrónicamente.',
      },
    },
  ],
}

export const rootBreadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://www.quieromisas.com' },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.quieromisas.com/blog' },
  ],
}
