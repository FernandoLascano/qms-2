import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Home } from 'lucide-react'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'Página no encontrada | QuieroMiSAS',
  robots: { index: false, follow: true },
}

/** 404 de todo el sitio: links rotos, notas despublicadas, partners dados de baja. */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="py-24 md:py-32">
        <div className="container mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">Error 404</p>
          <h1 className="mt-3 text-4xl font-bold text-gray-900 md:text-5xl">No encontramos esta página</h1>
          <p className="mx-auto mt-4 max-w-lg text-lg text-gray-600">
            Puede que el link esté mal escrito o que la página ya no exista. Desde acá podés volver al inicio o
            seguir leyendo nuestras guías para constituir tu SAS.
          </p>

          <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-control bg-brand-700 px-6 font-semibold text-on-primary shadow-raise transition-colors hover:bg-brand-800"
            >
              <Home className="h-5 w-5" />
              Volver al inicio
            </Link>
            <Link
              href="/blog"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-control border border-line-strong px-6 font-semibold text-n-700 transition-colors hover:border-brand-200 hover:bg-brand-50"
            >
              Ir al blog
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <p className="mt-10 text-sm text-gray-500">
            ¿Necesitás ayuda? Escribinos a{' '}
            <a href="mailto:contacto@quieromisas.com" className="font-medium text-brand-700 hover:underline">
              contacto@quieromisas.com
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  )
}
