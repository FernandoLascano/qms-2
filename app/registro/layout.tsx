import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Crear Cuenta | QuieroMiSAS',
  alternates: { canonical: '/registro' },
  robots: {
    index: false,
    follow: false,
  },
}

export default function RegistroLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
