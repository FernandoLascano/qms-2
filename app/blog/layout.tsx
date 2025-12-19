import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog y Recursos | QuieroMiSAS - Guías sobre S.A.S. y Sociedades en Argentina',
  description: 'Artículos, guías y recursos sobre constitución de S.A.S., trámites societarios, legislación y emprendimiento en Argentina. Información actualizada por expertos.',
  keywords: [
    'blog SAS Argentina',
    'guías sociedades',
    'trámites societarios',
    'constituir empresa',
    'legislación Argentina',
    'IPJ Córdoba',
    'IGJ CABA',
    'recursos emprendedores'
  ],
  openGraph: {
    title: 'Blog y Recursos - QuieroMiSAS',
    description: 'Guías y artículos sobre S.A.S. y sociedades en Argentina',
    type: 'website',
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
