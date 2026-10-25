'use client'

import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Recorrido guiado del panel del cliente: se muestra una sola vez (por
 * navegador) la primera vez que entra con un trámite. Resalta cada parte con
 * un recorte en la pantalla oscurecida. Los pasos cuyo elemento no está a la
 * vista (p. ej. sin trámites en curso) se saltean solos.
 */

const CLAVE = 'recorrido-panel-cliente-v1'

interface Paso {
  /** Valor de `data-recorrido` del elemento a resaltar. Sin selector = tarjeta centrada. */
  objetivo?: string
  titulo: string
  texto: string
}

const PASOS: Paso[] = [
  { titulo: '¡Bienvenido a tu panel!', texto: 'Te mostramos en 30 segundos dónde está cada cosa.' },
  { objetivo: 'tramite', titulo: 'Tu trámite', texto: 'Acá ves en qué paso está tu sociedad y qué te toca hacer a vos. Entrando al trámite tenés el detalle y el chat con el equipo.' },
  { objetivo: 'accesos', titulo: 'Todo a mano', texto: 'Tus documentos, la guía de libros digitales y, cuando esté inscripta, el legajo de tu sociedad.' },
  { objetivo: 'notificaciones', titulo: 'Avisos', texto: 'Cada novedad te llega acá y también por email. No hace falta que entres todos los días.' },
  { titulo: '¿Dudas?', texto: 'Escribinos desde el chat del trámite: te responde una persona del equipo.' },
]

type Recorte = { top: number; left: number; width: number; height: number }

export function RecorridoPanel() {
  const [indice, setIndice] = useState<number | null>(null)
  const [recorte, setRecorte] = useState<Recorte | null>(null)

  useEffect(() => {
    // Sólo en computadora: en el teléfono el recorte y la tarjeta tapan casi todo.
    if (window.innerWidth < 1024) return
    try {
      if (window.localStorage.getItem(CLAVE)) return
    } catch {
      return
    }
    const t = setTimeout(() => setIndice(0), 900)
    return () => clearTimeout(t)
  }, [])

  const cerrar = useCallback(() => {
    setIndice(null)
    try {
      window.localStorage.setItem(CLAVE, new Date().toISOString())
    } catch {
      // ignorar
    }
  }, [])

  const elemento = (p?: Paso) =>
    p?.objetivo ? (document.querySelector(`[data-recorrido="${p.objetivo}"]`) as HTMLElement | null) : null

  // Siguiente paso que se puede mostrar (sin objetivo, o con el elemento visible).
  const siguienteDesde = (desde: number) => {
    for (let i = desde; i < PASOS.length; i++) {
      const el = elemento(PASOS[i])
      if (!PASOS[i].objetivo || (el && el.offsetParent !== null)) return i
    }
    return null
  }

  const medir = useCallback(() => {
    if (indice === null) return
    const el = elemento(PASOS[indice])
    if (!el) return setRecorte(null)
    const r = el.getBoundingClientRect()
    const m = 8
    // Un elemento más alto que la pantalla se recorta a lo visible.
    const top = Math.max(8, r.top - m)
    const bottom = Math.min(window.innerHeight - 8, r.bottom + m)
    setRecorte({ top, left: r.left - m, width: r.width + m * 2, height: Math.max(0, bottom - top) })
  }, [indice])

  useLayoutEffect(() => {
    if (indice === null) return
    const el = elemento(PASOS[indice])
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    const raf = requestAnimationFrame(medir)
    const t = setTimeout(medir, 380) // después del scroll suave
    window.addEventListener('resize', medir)
    document.addEventListener('scroll', medir, true)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t)
      window.removeEventListener('resize', medir)
      document.removeEventListener('scroll', medir, true)
    }
  }, [indice, medir])

  useEffect(() => {
    if (indice === null) return
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && cerrar()
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [indice, cerrar])

  if (indice === null) return null
  const paso = PASOS[indice]
  const conRecorte = Boolean(paso.objetivo && recorte)
  const visibles = PASOS.filter((p) => !p.objetivo || elemento(p)).length
  const numero = PASOS.slice(0, indice + 1).filter((p) => !p.objetivo || elemento(p)).length

  const avanzar = () => {
    const sig = siguienteDesde(indice + 1)
    if (sig === null) cerrar()
    else {
      setRecorte(null)
      setIndice(sig)
    }
  }

  // La tarjeta va debajo del recorte si entra, si no arriba, y si tampoco
  // (elemento muy alto) a un costado. Nunca puede quedar fuera de la pantalla:
  // así se trababa el recorrido, con el botón «Siguiente» fuera de vista.
  const ALTO_TARJETA = 230
  let posicion: React.CSSProperties | undefined
  if (conRecorte && recorte) {
    const abajo = recorte.top + recorte.height + 16
    const espacioArriba = recorte.top - 16
    if (abajo + ALTO_TARJETA <= window.innerHeight) {
      posicion = { top: abajo, left: Math.min(Math.max(16, recorte.left), window.innerWidth - 400) }
    } else if (espacioArriba >= ALTO_TARJETA) {
      posicion = { top: espacioArriba - ALTO_TARJETA + 16, left: Math.min(Math.max(16, recorte.left), window.innerWidth - 400) }
    } else {
      const aLaIzquierda = recorte.left > window.innerWidth / 2
      posicion = { top: Math.max(16, Math.min(recorte.top, window.innerHeight - ALTO_TARJETA - 16)), left: aLaIzquierda ? Math.max(16, recorte.left - 400) : Math.min(recorte.left + recorte.width + 16, window.innerWidth - 400) }
    }
  }

  // Portal al <body>: dentro del panel hay ancestros con transform (animaciones
  // de entrada) y un `position: fixed` adentro de ellos deja de ser fijo.
  return createPortal(
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-labelledby="recorrido-titulo">
      {conRecorte && recorte ? (
        <div
          className="pointer-events-none fixed rounded-card ring-2 ring-primary transition-all duration-300 ease-out"
          style={{ ...recorte, boxShadow: '0 0 0 9999px rgba(15, 12, 10, 0.62)' }}
          aria-hidden
        />
      ) : (
        <div className="fixed inset-0 bg-n-950/60" aria-hidden />
      )}

      <div
        className={cn(
          'fixed w-96 rounded-card border border-line bg-surface p-5 shadow-modal transition-[top,left] duration-300 ease-out',
          !posicion && 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
        )}
        style={posicion}
      >
        <button type="button" onClick={cerrar} aria-label="Cerrar el recorrido" className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-control text-ink-3 hover:bg-surface-2 hover:text-ink">
          <X className="h-4 w-4" />
        </button>
        <p className="text-label font-semibold uppercase tracking-wide text-primary tnum">
          {numero} de {visibles}
        </p>
        <h2 id="recorrido-titulo" className="mt-1 text-heading font-semibold text-ink">{paso.titulo}</h2>
        <p className="mt-1.5 text-body-sm text-ink-2">{paso.texto}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <button type="button" onClick={cerrar} className="text-body-sm font-medium text-ink-2 hover:text-ink">
            Saltear
          </button>
          <Button onClick={avanzar} size="sm" className="gap-1.5" autoFocus>
            {siguienteDesde(indice + 1) === null ? 'Listo' : 'Siguiente'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
