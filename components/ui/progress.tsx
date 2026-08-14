import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Barra de progreso única del módulo.
 *
 * Antes había tres: una con gradiente brand→verde (cliente), otra con
 * gradiente brand→brand (admin) y una tercera inline. Mismo dato, tres
 * lenguajes. Ahora es color plano: el gradiente sugería una transición que no
 * existe (el progreso es discreto, de 7 etapas).
 */

export function Progress({
  value,
  tone = 'primary',
  size = 'md',
  label,
  className,
}: {
  /** 0 a 100 */
  value: number
  tone?: 'primary' | 'success'
  size?: 'sm' | 'md'
  /** Texto accesible del progreso. */
  label?: string
  className?: string
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))

  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? `Progreso: ${pct}%`}
      className={cn(
        "w-full overflow-hidden rounded-full bg-surface-3",
        size === 'sm' ? "h-1.5" : "h-2",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500",
          tone === 'success' ? "bg-success-solid" : "bg-primary",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/** Progreso con encabezado "Progreso — 71%". */
export function LabeledProgress({
  value,
  caption,
  tone = 'primary',
  className,
}: {
  value: number
  caption?: string
  tone?: 'primary' | 'success'
  className?: string
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-body-sm text-ink-2">{caption ?? 'Progreso'}</span>
        <span
          className={cn(
            "text-body-sm font-medium tnum",
            tone === 'success' ? "text-success" : "text-ink",
          )}
        >
          {pct}%
        </span>
      </div>
      <Progress value={pct} tone={tone} label={`${caption ?? 'Progreso'}: ${pct}%`} />
    </div>
  )
}
