'use client'

import * as React from 'react'
import { ChevronsRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * «Deslizá para confirmar»: para acciones del admin que no tienen vuelta atrás
 * (inscribir la sociedad y avisarle al cliente, borrar un trámite o un
 * movimiento). Un clic se da sin querer; arrastrar hasta el final, no.
 *
 * Con teclado: flecha derecha avanza de a un cuarto; al llegar al final confirma.
 */
export function SlideToConfirm({
  label,
  onConfirm,
  loading = false,
  disabled = false,
  tone = 'danger',
  className,
}: {
  label: string
  onConfirm: () => void
  loading?: boolean
  disabled?: boolean
  tone?: 'danger' | 'primary'
  className?: string
}) {
  const pista = React.useRef<HTMLDivElement>(null)
  const [avance, setAvance] = React.useState(0) // 0–1
  const [arrastrando, setArrastrando] = React.useState(false)
  const inicio = React.useRef<{ x: number; avance: number } | null>(null)
  const confirmado = React.useRef(false)

  const PERILLA = 48
  const [ancho, setAncho] = React.useState(0)
  React.useEffect(() => {
    const el = pista.current
    if (!el) return
    const obs = new ResizeObserver(() => setAncho(el.clientWidth))
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  const recorrido = Math.max(1, ancho - PERILLA - 8)

  const cargando = React.useRef(loading)
  React.useEffect(() => {
    cargando.current = loading
  }, [loading])

  const terminar = (valor: number) => {
    if (valor >= 0.92 && !confirmado.current) {
      confirmado.current = true
      setAvance(1)
      onConfirm()
      // Si la acción no arrancó (p. ej. faltaba un dato), la perilla vuelve.
      setTimeout(() => {
        if (!cargando.current) {
          confirmado.current = false
          setAvance(0)
        }
      }, 900)
    } else if (!confirmado.current) {
      setAvance(0)
    }
  }

  // Si la acción falla y vuelve a habilitarse, la perilla vuelve al inicio.
  React.useEffect(() => {
    if (!loading && confirmado.current) {
      confirmado.current = false
      setAvance(0)
    }
  }, [loading])

  const bloqueado = disabled || loading
  const color = tone === 'danger' ? 'bg-danger-solid' : 'bg-primary'

  return (
    <div
      ref={pista}
      className={cn(
        'relative h-14 w-full select-none overflow-hidden rounded-full border border-line bg-surface-2',
        bloqueado && 'opacity-60',
        className,
      )}
    >
      <div className={cn('absolute inset-y-0 left-0 opacity-15', color)} style={{ width: `calc(${avance * 100}% + ${PERILLA / 2}px)` }} aria-hidden />
      <span
        className="pointer-events-none absolute inset-0 flex items-center justify-center pl-12 pr-4 text-body-sm font-semibold text-ink-2"
        style={{ opacity: 1 - avance * 1.4 }}
      >
        {label}
      </span>
      <button
        type="button"
        role="slider"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(avance * 100)}
        disabled={bloqueado}
        onPointerDown={(e) => {
          if (bloqueado) return
          e.currentTarget.setPointerCapture(e.pointerId)
          inicio.current = { x: e.clientX, avance }
          setArrastrando(true)
        }}
        onPointerMove={(e) => {
          if (!inicio.current) return
          const delta = (e.clientX - inicio.current.x) / recorrido
          setAvance(Math.min(1, Math.max(0, inicio.current.avance + delta)))
        }}
        onPointerUp={() => {
          inicio.current = null
          setArrastrando(false)
          terminar(avance)
        }}
        onPointerCancel={() => {
          inicio.current = null
          setArrastrando(false)
          terminar(0)
        }}
        onKeyDown={(e) => {
          if (bloqueado) return
          if (e.key === 'ArrowRight') {
            e.preventDefault()
            const nuevo = Math.min(1, avance + 0.25)
            setAvance(nuevo)
            if (nuevo >= 1) terminar(1)
          } else if (e.key === 'ArrowLeft' || e.key === 'Escape') {
            setAvance(0)
          }
        }}
        className={cn(
          'absolute left-1 top-1 flex h-12 w-12 touch-none items-center justify-center rounded-full text-on-primary shadow-raise',
          color,
          !arrastrando && 'transition-transform duration-300 ease-out',
          bloqueado ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing',
        )}
        style={{ transform: `translateX(${avance * recorrido}px)` }}
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ChevronsRight className="h-5 w-5" />}
      </button>
    </div>
  )
}
