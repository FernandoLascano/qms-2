import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Badge / píldora de estado.
 *
 * Un solo mapa de tonos para todo el módulo, así el mismo estado nunca se ve
 * gris en una pantalla y violeta en otra.
 */

export type Tone = 'neutral' | 'primary' | 'info' | 'success' | 'warning' | 'danger'

const TONES: Record<Tone, string> = {
  neutral: 'bg-surface-3 text-n-700 border-line',
  primary: 'bg-primary-soft text-primary border-primary-line',
  info: 'bg-info-soft text-info border-info-line',
  success: 'bg-success-soft text-success border-success-line',
  warning: 'bg-warning-soft text-warning border-warning-line',
  danger: 'bg-danger-soft text-danger border-danger-line',
}

const DOTS: Record<Tone, string> = {
  neutral: 'bg-n-400',
  primary: 'bg-primary',
  info: 'bg-info-solid',
  success: 'bg-success-solid',
  warning: 'bg-warning-solid',
  danger: 'bg-danger-solid',
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
  /** Punto de color a la izquierda: ayuda a leer el estado sin depender del color del texto. */
  dot?: boolean
  size?: 'sm' | 'md'
}

export function Badge({
  className,
  tone = 'neutral',
  dot = false,
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        // Píldora redonda, como los badges de la portada.
        "inline-flex items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap",
        size === 'sm' ? "px-2.5 py-0.5 text-label" : "px-3 py-1 text-label",
        TONES[tone],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full shrink-0", DOTS[tone])}
          aria-hidden
        />
      )}
      {children}
    </span>
  )
}

/** Contador numérico compacto (bandeja de emails, notificaciones sin leer). */
export function CountBadge({
  count,
  tone = 'danger',
  className,
}: {
  count: number
  tone?: Tone
  className?: string
}) {
  if (count <= 0) return null
  return (
    <span
      className={cn(
        "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5",
        "text-label leading-none tnum",
        tone === 'danger'
          ? "bg-danger-solid text-on-primary"
          : "bg-primary text-on-primary",
        className,
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
