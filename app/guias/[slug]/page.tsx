import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Clock } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { GuiaInteractiva } from '@/components/guias/GuiaInteractiva'
import { GUIAS } from '@/lib/guias'
import { metadataDePagina } from '@/lib/seo/site'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return GUIAS.map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const guia = GUIAS.find((g) => g.slug === slug)
  if (!guia) return {}
  return metadataDePagina({ ruta: `/guias/${guia.slug}`, titulo: `${guia.titulo} | QuieroMiSAS`, descripcion: guia.bajada })
}

export default async function GuiaPage({ params }: Props) {
  const { slug } = await params
  const guia = GUIAS.find((g) => g.slug === slug)
  if (!guia) notFound()
  const pasos = guia.secciones.reduce((n, s) => n + s.pasos.length, 0)

  return (
    <div className="canvas-landing min-h-screen">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-10 space-y-8">
        <div className="space-y-3">
          <Link href="/dashboard" className="inline-flex min-h-10 items-center gap-2 text-body-sm font-medium text-ink-2 hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Volver a mi panel
          </Link>
          <h1 className="text-display text-ink">{guia.titulo}</h1>
          <p className="max-w-2xl text-body text-ink-2">{guia.bajada}</p>
          <p className="inline-flex items-center gap-2 text-body-sm text-ink-3">
            <Clock className="h-4 w-4" aria-hidden /> {pasos} pasos
          </p>
        </div>
        <GuiaInteractiva guia={guia} />
      </main>
    </div>
  )
}
