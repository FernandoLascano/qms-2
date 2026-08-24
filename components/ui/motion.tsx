'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Movimiento del panel: sólo el que además informa.
 *
 * La portada se mueve mucho porque la ves una vez y tiene que impresionarte.
 * El panel se abre todos los días: una animación que la primera vez es
 * simpática, a la vigésima es una espera. Así que acá sólo se anima lo que
 * comunica un dato — cuánto avanzaste y cuánto hay — y nada más.
 *
 * Todo respeta `prefers-reduced-motion`: con esa preferencia activa los
 * valores aparecen directamente en su estado final.
 */

/** ¿El sistema pide menos movimiento? */
function usaMenosMovimiento() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Dispara cuando el elemento entra en pantalla (una sola vez). */
function useEnPantalla<T extends HTMLElement>() {
  const ref = React.useRef<T>(null)
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    if (usaMenosMovimiento()) {
      setVisible(true)
      return
    }
    const obs = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { rootMargin: '-40px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return { ref, visible }
}

/* ────────────────────────────  Número  ──────────────────────────── */

/**
 * Número que cuenta hasta su valor cuando aparece en pantalla.
 *
 * No es decoración: el conteo hace que el ojo se detenga en la cifra, que es
 * justamente el dato de la tarjeta. Dura 700 ms y arranca rápido para no
 * hacerse esperar.
 */
export function NumeroAnimado({
  valor,
  className,
}: {
  valor: number
  className?: string
}) {
  const { ref, visible } = useEnPantalla<HTMLSpanElement>()
  const [actual, setActual] = React.useState(0)

  React.useEffect(() => {
    if (!visible) return
    if (usaMenosMovimiento() || valor === 0) {
      setActual(valor)
      return
    }

    const DURACION = 700
    let raf = 0
    let inicio: number | null = null

    const paso = (t: number) => {
      if (inicio === null) inicio = t
      const avance = Math.min((t - inicio) / DURACION, 1)
      // Salida suave: arranca rápido y frena al final.
      const suave = 1 - Math.pow(1 - avance, 3)
      setActual(Math.round(valor * suave))
      if (avance < 1) raf = requestAnimationFrame(paso)
    }

    raf = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(raf)
  }, [visible, valor])

  return (
    <span ref={ref} className={cn('tnum', className)}>
      {actual.toLocaleString('es-AR')}
    </span>
  )
}

/* ───────────────────────────  Progreso  ─────────────────────────── */

/**
 * Barra que se llena sola hasta su porcentaje al entrar en pantalla.
 *
 * Acá el movimiento es el mensaje: el recorrido de la barra muestra cuánto
 * del trámite está hecho, que es lo que el cliente vino a ver.
 */
export function BarraAnimada({
  value,
  tone = 'primary',
  size = 'md',
  label,
  className,
}: {
  value: number
  tone?: 'primary' | 'success'
  size?: 'sm' | 'md'
  label?: string
  className?: string
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  const { ref, visible } = useEnPantalla<HTMLDivElement>()

  return (
    <div
      ref={ref}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? `Progreso: ${pct}%`}
      className={cn(
        'relative w-full overflow-hidden rounded-full bg-surface-3',
        size === 'sm' ? 'h-1.5' : 'h-2.5',
        className,
      )}
    >
      <div
        className={cn(
          'h-full rounded-full',
          tone === 'success' ? 'bg-success-solid' : 'bg-primary',
        )}
        style={{
          width: visible ? `${pct}%` : '0%',
          transition: 'width 900ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Brillo que recorre la barra mientras el trámite está en curso */}
        {pct > 0 && pct < 100 && (
          <span className="absolute inset-y-0 left-0 w-full overflow-hidden rounded-full">
            <span className="animate-shimmer absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent" />
          </span>
        )}
      </div>
    </div>
  )
}
