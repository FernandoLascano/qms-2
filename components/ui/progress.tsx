'use client'

import * as React from "react"
import { BarraAnimada } from "@/components/ui/motion"
import { cn } from "@/lib/utils"

/**
 * Barra de progreso única del módulo.
 *
 * Antes había tres: una con gradiente brand→verde (cliente), otra con
 * gradiente brand→brand (admin) y una tercera inline. Mismo dato, tres
 * lenguajes.
 *
 * Se llena sola hasta su porcentaje al entrar en pantalla: acá el movimiento
 * es el mensaje, porque el recorrido muestra cuánto del trámite está hecho.
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
  return (
    <BarraAnimada
      value={value}
      tone={tone}
      size={size}
      label={label}
      className={className}
    />
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
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-body-sm font-medium text-ink-2">
          {caption ?? 'Progreso'}
        </span>
        <span
          className={cn(
            'text-body font-bold tnum',
            tone === 'success' ? 'text-success' : 'text-primary',
          )}
        >
          {pct}%
        </span>
      </div>
      <Progress value={pct} tone={tone} label={`${caption ?? 'Progreso'}: ${pct}%`} />
    </div>
  )
}
