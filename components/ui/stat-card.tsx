import * as React from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Tarjeta de métrica.
 *
 * Regla: el color aparece SÓLO cuando el valor exige una acción. Antes cada
 * KPI tenía su color decorativo (gris, azul, verde, naranja) y por eso ninguno
 * destacaba; el número accionable pesaba lo mismo que el informativo.
 *
 * El número va en la fuente de display y a 36px: es el dato, tiene que
 * dominar la tarjeta.
 */

/** Acento por métrica: devuelve color al panel sin salirse del sistema. */
const ACENTOS = {
  a1: 'bg-a1-soft text-a1',
  a2: 'bg-a2-soft text-a2',
  a3: 'bg-a3-soft text-a3',
  a4: 'bg-a4-soft text-a4',
  a5: 'bg-a5-soft text-a5',
  a6: 'bg-a6-soft text-a6',
  neutro: 'bg-surface-3 text-ink-2',
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
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="text-body-sm font-medium text-ink-2">{label}</span>
        {Icon && (
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110',
              alert ? 'bg-warning-soft text-warning' : ACENTOS[acento],
            )}
            aria-hidden
          >
            <Icon className="h-4.5 w-4.5" />
          </span>
        )}
      </div>

      <div
        className={cn(
          'mt-3 text-display tnum',
          alert ? 'text-warning' : 'text-ink',
        )}
      >
        {value}
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
    'group relative block overflow-hidden rounded-card border p-card-sm shadow-card',
    'transition-[border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
    alert ? 'border-warning-line bg-warning-soft' : 'border-line bg-surface',
    href && 'hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift',
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
