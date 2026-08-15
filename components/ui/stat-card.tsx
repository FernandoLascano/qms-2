import * as React from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { NumeroAnimado } from "@/components/ui/motion"
import { cn } from "@/lib/utils"

/**
 * Tarjeta de métrica.
 *
 * El número manda: va a 40px en peso 800, arriba de todo. Antes el label
 * ocupaba la primera línea y la cifra quedaba chica y perdida abajo, que es
 * justo al revés de lo que uno viene a mirar.
 *
 * El color del icono lo da el acento asignado; el tono de alerta sólo aparece
 * cuando el valor exige una acción.
 */

const ACENTOS = {
  a1: 'bg-a1-soft text-a1 ring-a1-line',
  a2: 'bg-a2-soft text-a2 ring-a2-line',
  a3: 'bg-a3-soft text-a3 ring-a3-line',
  a4: 'bg-a4-soft text-a4 ring-a4-line',
  a5: 'bg-a5-soft text-a5 ring-a5-line',
  a6: 'bg-a6-soft text-a6 ring-a6-line',
  neutro: 'bg-surface-3 text-ink-2 ring-line',
} as const

interface StatCardProps {
  label: string
  value: React.ReactNode
  hint?: string
  icon?: LucideIcon
  acento?: keyof typeof ACENTOS
  /** true → la tarjeta se pinta para reclamar atención. */
  alert?: boolean
  href?: string
  className?: string
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  acento = 'neutro',
  alert = false,
  href,
  className,
}: StatCardProps) {
  const esNumero = typeof value === 'number'

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div
            className={cn(
              'text-hero tnum leading-none',
              alert ? 'text-warning' : 'text-ink',
            )}
          >
            {esNumero ? <NumeroAnimado valor={value as number} /> : value}
          </div>
          <p className="mt-2 text-body-sm font-semibold text-ink">{label}</p>
        </div>

        {Icon && (
          <span
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1',
              'transition-transform duration-200 group-hover:scale-110',
              alert ? 'bg-warning-soft text-warning ring-warning-line' : ACENTOS[acento],
            )}
            aria-hidden
          >
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>

      {hint && (
        <div className="mt-1 flex items-center gap-1 text-label text-ink-2">
          {hint}
          {href && (
            <ArrowRight
              className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          )}
        </div>
      )}
    </>
  )

  const classes = cn(
    'group relative block overflow-hidden rounded-card border p-card shadow-card',
    'transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
    alert ? 'border-warning-line bg-warning-soft' : 'border-line-card bg-surface',
    href && 'hover:-translate-y-1 hover:border-primary-line hover:shadow-lift',
    className,
  )

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    )
  }

  return <div className={classes}>{content}</div>
}
