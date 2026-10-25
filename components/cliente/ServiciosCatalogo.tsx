'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Building2,
  Calculator,
  Check,
  FileCheck,
  FileSignature,
  FileText,
  Landmark,
  LineChart,
  MapPin,
  MessageCircle,
  Sparkles,
  TrendingUp,
  UserCog,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ACENTO_DE_SLUG,
  CATEGORIAS,
  CLASES_ACENTO,
  DESTACADOS,
  INCLUYE,
  precioVisible,
  type ServicioCard,
} from '@/lib/servicios'

export type { ServicioCard }

const WHATSAPP = '5493512136212'

const ICONOS: Record<string, LucideIcon> = {
  BadgeCheck, Building2, Calculator, FileSignature, FileText, FileCheck,
  Landmark, LineChart, MapPin, TrendingUp, UserCog, BookOpen,
}

const enlaceWhatsapp = (nombre: string) =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hola! Quiero consultar por el servicio: ${nombre}`)}`

/** «Me interesa»: deja la consulta registrada para que un asesor contacte al cliente. */
export function useConsultarServicio() {
  const [enviando, setEnviando] = useState<string | null>(null)
  const [consultados, setConsultados] = useState<Record<string, boolean>>({})

  const consultar = async (nombre: string) => {
    setEnviando(nombre)
    try {
      const res = await fetch('/api/servicios/consultar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servicio: nombre }),
      })
      if (res.ok) {
        toast.success('¡Listo! Un asesor de QMS se va a contactar con vos.')
        setConsultados((prev) => ({ ...prev, [nombre]: true }))
      } else {
        toast.error('No se pudo registrar la consulta. Probá de nuevo.')
      }
    } catch {
      toast.error('No se pudo registrar la consulta. Probá de nuevo.')
    } finally {
      setEnviando(null)
    }
  }
  return { consultar, enviando, consultados }
}

/** Botones de una tarjeta: «Me interesa» y WhatsApp, o el estado si ya se pidió. */
function Acciones({
  servicio,
  contratado,
  consulta,
  compacto,
}: {
  servicio: ServicioCard
  contratado: boolean
  consulta: ReturnType<typeof useConsultarServicio>
  compacto?: boolean
}) {
  if (contratado) {
    return (
      <p className="flex items-center gap-2 text-body-sm font-semibold text-success">
        <Check className="h-4 w-4" aria-hidden /> Ya lo tenés contratado
      </p>
    )
  }
  if (consulta.consultados[servicio.nombre]) {
    return (
      <p className="flex items-center gap-2 text-body-sm font-semibold text-success">
        <Check className="h-4 w-4" aria-hidden /> Consulta enviada: te contactamos
      </p>
    )
  }
  return (
    <div className={cn('flex gap-2', compacto ? 'flex-col' : 'flex-col sm:flex-row sm:items-center')}>
      <Button onClick={() => consulta.consultar(servicio.nombre)} loading={consulta.enviando === servicio.nombre} className={compacto ? 'w-full' : ''}>
        Me interesa
      </Button>
      <a
        href={enlaceWhatsapp(servicio.nombre)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-control px-3 text-body-sm font-medium text-ink-2 hover:bg-surface-2 hover:text-ink"
      >
        <MessageCircle className="h-4 w-4" aria-hidden />
        Preguntar por WhatsApp
      </a>
    </div>
  )
}

function IconoServicio({ servicio, grande }: { servicio: ServicioCard; grande?: boolean }) {
  const Icono = ICONOS[servicio.icono] ?? FileText
  const acento = CLASES_ACENTO[ACENTO_DE_SLUG[servicio.slug] ?? 'a1']
  return (
    <span
      className={cn('flex shrink-0 items-center justify-center rounded-full ring-1', acento.icono, grande ? 'h-12 w-12' : 'h-10 w-10')}
      aria-hidden
    >
      <Icono className={grande ? 'h-6 w-6' : 'h-5 w-5'} />
    </span>
  )
}

/** Tarjeta grande de un servicio destacado, con lo que incluye. */
function TarjetaDestacada({ servicio, contratado, consulta }: { servicio: ServicioCard; contratado: boolean; consulta: ReturnType<typeof useConsultarServicio> }) {
  const acento = CLASES_ACENTO[ACENTO_DE_SLUG[servicio.slug] ?? 'a1']
  return (
    <article className={cn('relative flex flex-col gap-4 overflow-hidden rounded-card border bg-surface p-6 shadow-raise', acento.borde)}>
      <div className={cn('pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-60', acento.fondo)} aria-hidden />
      <div className="relative flex items-start gap-4">
        <IconoServicio servicio={servicio} grande />
        <div className="min-w-0">
          <h3 className="text-title text-ink text-balance">{servicio.nombre}</h3>
          <p className="mt-1 text-body text-ink-2 text-pretty">{servicio.descripcion}</p>
        </div>
      </div>
      {INCLUYE[servicio.slug] && (
        <ul className="relative grid gap-2 sm:grid-cols-3">
          {INCLUYE[servicio.slug].map((item) => (
            <li key={item} className="flex items-start gap-2 text-body-sm text-ink">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      )}
      <div className="relative mt-auto flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-heading font-semibold text-ink tnum">{precioVisible(servicio)}</p>
        <Acciones servicio={servicio} contratado={contratado} consulta={consulta} />
      </div>
    </article>
  )
}

/** Tarjeta mediana: ícono con su color, nombre, para qué sirve y precio. */
export function TarjetaServicio({
  servicio,
  contratado,
  consulta,
}: {
  servicio: ServicioCard
  contratado: boolean
  consulta: ReturnType<typeof useConsultarServicio>
}) {
  return (
    <article className="flex h-full flex-col gap-3 rounded-card border border-line bg-surface p-5 shadow-raise transition-shadow hover:shadow-pop">
      <div className="flex items-start gap-3">
        <IconoServicio servicio={servicio} />
        <div className="min-w-0">
          <h3 className="text-heading text-ink text-balance">{servicio.nombre}</h3>
          <p className="mt-0.5 text-body-sm font-semibold text-ink-2 tnum">{precioVisible(servicio)}</p>
        </div>
      </div>
      <p className="flex-1 text-body-sm text-ink-2 text-pretty">{servicio.descripcion}</p>
      <Acciones servicio={servicio} contratado={contratado} consulta={consulta} compacto />
    </article>
  )
}

/**
 * Catálogo para el cliente. Antes era una grilla de tarjetas iguales (mismo
 * ícono gris, mismo botón): no se distinguía un servicio de otro. Ahora los
 * dos clave van arriba, grandes y con lo que incluyen, y el resto se agrupa
 * por para qué sirve, cada uno con su color.
 */
export default function ServiciosCatalogo({ servicios, contratados = [] }: { servicios: ServicioCard[]; contratados?: string[] }) {
  const consulta = useConsultarServicio()
  const porSlug = new Map(servicios.map((s) => [s.slug, s]))
  const esContratado = (s: ServicioCard) => contratados.includes(s.slug)

  const destacados = DESTACADOS.map((slug) => porSlug.get(slug)).filter((s): s is ServicioCard => !!s)
  const usados = new Set(destacados.map((s) => s.slug))
  const categorias = CATEGORIAS.map((c) => ({
    ...c,
    servicios: c.slugs.map((slug) => porSlug.get(slug)).filter((s): s is ServicioCard => !!s && !usados.has(s.slug)),
  })).filter((c) => c.servicios.length > 0)
  categorias.forEach((c) => c.servicios.forEach((s) => usados.add(s.slug)))
  const otros = servicios.filter((s) => !usados.has(s.slug))

  return (
    <div className="space-y-section">
      {destacados.length > 0 && (
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-heading font-semibold text-ink">
            <Sparkles className="h-5 w-5 text-primary" aria-hidden /> Los más pedidos después de constituir
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {destacados.map((s) => (
              <TarjetaDestacada key={s.id} servicio={s} contratado={esContratado(s)} consulta={consulta} />
            ))}
          </div>
        </section>
      )}

      {[...categorias, ...(otros.length ? [{ id: 'otros', titulo: 'Otros servicios', bajada: '', servicios: otros }] : [])].map((c) => (
        <section key={c.id} className="space-y-4">
          <div>
            <h2 className="text-heading font-semibold text-ink">{c.titulo}</h2>
            {c.bajada && <p className="text-body-sm text-ink-2">{c.bajada}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {c.servicios.map((s) => (
              <TarjetaServicio key={s.id} servicio={s} contratado={esContratado(s)} consulta={consulta} />
            ))}
          </div>
        </section>
      ))}

      <section className="flex flex-col items-start gap-3 rounded-card border border-line bg-surface-2 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-heading font-semibold text-ink">¿No encontrás lo que buscás?</h2>
          <p className="text-body-sm text-ink-2">Contanos qué necesita tu sociedad y te decimos cómo te podemos ayudar.</p>
        </div>
        <Button asChild variant="secondary">
          <Link href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hola! Tengo una consulta sobre mi sociedad')}`} target="_blank">
            Escribinos <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </section>
    </div>
  )
}
