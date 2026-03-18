import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog sobre SAS y Sociedades en Argentina | QuieroMiSAS',
  description: 'Guías, comparativas y novedades sobre constitución de SAS, SRL y SA en Argentina. Requisitos, costos, plazos y todo lo que necesitás saber para crear tu empresa.',
  keywords: [
    'blog SAS Argentina',
    'guías sociedades Argentina',
    'trámites societarios',
    'constituir empresa Argentina',
    'SAS vs SRL',
    'requisitos SAS',
    'costos constituir SAS',
    'IPJ Córdoba',
    'IGJ CABA',
    'crear empresa Argentina'
  ],
  openGraph: {
    title: 'Blog sobre SAS y Sociedades en Argentina | QuieroMiSAS',
    description: 'Guías, comparativas y novedades sobre constitución de SAS, SRL y SA en Argentina. Requisitos, costos y plazos.',
    type: 'website',
    images: [
      {
        url: 'https://www.quieromisas.com/assets/img/og-image.png',
        width: 1200,
        height: 630,
        alt: 'QuieroMiSAS Blog - Guías sobre SAS en Argentina',
      }
    ],
  },
  alternates: {
    canonical: 'https://www.quieromisas.com/blog',
  },
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
