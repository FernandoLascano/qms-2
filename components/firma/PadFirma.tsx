'use client'

import { useEffect, useRef, useState } from 'react'
import { Eraser } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export type FirmaCapturada = { imagen: string; modo: 'dibujada' | 'escrita' }

const ANCHO = 600
const ALTO = 200

/** Lienzo vacío → null; si no, el PNG como data URL (fondo transparente). */
function exportar(canvas: HTMLCanvasElement, conTrazo: boolean) {
  return conTrazo ? canvas.toDataURL('image/png') : null
}

/**
 * Firma dibujada con el dedo o el mouse, o escrita (el nombre en letra
 * manuscrita). Avisa cada cambio con la imagen lista o null si está vacía.
 */
export function PadFirma({
  nombre,
  onChange,
  id,
}: {
  nombre: string
  onChange: (firma: FirmaCapturada | null) => void
  id?: string
}) {
  const [modo, setModo] = useState<'dibujada' | 'escrita'>('dibujada')
  const [escrita, setEscrita] = useState(nombre)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dibujando = useRef(false)
  const conTrazo = useRef(false)

  const ctx = () => {
    const c = canvasRef.current?.getContext('2d')
    if (c) {
      c.lineWidth = 3
      c.lineCap = 'round'
      c.lineJoin = 'round'
      c.strokeStyle = '#1c2a5a'
    }
    return c
  }

  function limpiar() {
    const c = canvasRef.current
    c?.getContext('2d')?.clearRect(0, 0, ANCHO, ALTO)
    conTrazo.current = false
    onChange(null)
  }

  // Firma escrita: el nombre en letra manuscrita sobre el mismo lienzo.
  useEffect(() => {
    if (modo !== 'escrita') return
    const c = canvasRef.current
    const g = c?.getContext('2d')
    if (!c || !g) return
    g.clearRect(0, 0, ANCHO, ALTO)
    const texto = escrita.trim()
    if (!texto) {
      onChange(null)
      return
    }
    let tam = 72
    g.fillStyle = '#1c2a5a'
    g.textBaseline = 'middle'
    do {
      g.font = `italic ${tam}px "Segoe Script", "Brush Script MT", "Snell Roundhand", cursive`
      tam -= 4
    } while (g.measureText(texto).width > ANCHO - 40 && tam > 20)
    g.fillText(texto, 20, ALTO / 2)
    onChange({ imagen: c.toDataURL('image/png'), modo: 'escrita' })
    // onChange cambia en cada render del padre: sólo importa el texto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo, escrita])

  function punto(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * ANCHO, y: ((e.clientY - r.top) / r.height) * ALTO }
  }

  function cambiarModo(m: 'dibujada' | 'escrita') {
    if (m === modo) return
    limpiar()
    setModo(m)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex rounded-control border border-line p-0.5 text-body-sm" role="tablist">
          {(['dibujada', 'escrita'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={modo === m}
              onClick={() => cambiarModo(m)}
              className={cn(
                'rounded-[6px] px-3 py-1',
                modo === m ? 'bg-surface-3 font-semibold text-ink' : 'text-ink-2 hover:text-ink',
              )}
            >
              {m === 'dibujada' ? 'Dibujar' : 'Escribir'}
            </button>
          ))}
        </div>
        {modo === 'dibujada' && (
          <Button type="button" size="sm" variant="ghost" onClick={limpiar}>
            <Eraser className="h-4 w-4" aria-hidden /> Borrar
          </Button>
        )}
      </div>

      {modo === 'escrita' && (
        <Input id={id} value={escrita} onChange={(e) => setEscrita(e.target.value)} aria-label="Nombre para la firma" />
      )}

      <canvas
        ref={canvasRef}
        id={modo === 'dibujada' ? id : undefined}
        width={ANCHO}
        height={ALTO}
        aria-label={modo === 'dibujada' ? 'Recuadro para dibujar la firma' : 'Vista previa de la firma'}
        className={cn(
          'block aspect-[3/1] w-full rounded-control border border-dashed border-line-strong bg-surface',
          modo === 'dibujada' ? 'cursor-crosshair touch-none' : 'pointer-events-none',
        )}
        onPointerDown={(e) => {
          if (modo !== 'dibujada') return
          e.currentTarget.setPointerCapture(e.pointerId)
          dibujando.current = true
          const g = ctx()
          const p = punto(e)
          g?.beginPath()
          g?.moveTo(p.x, p.y)
          g?.lineTo(p.x + 0.1, p.y + 0.1)
          g?.stroke()
        }}
        onPointerMove={(e) => {
          if (!dibujando.current) return
          const g = ctx()
          const p = punto(e)
          g?.lineTo(p.x, p.y)
          g?.stroke()
          conTrazo.current = true
        }}
        onPointerUp={(e) => {
          if (!dibujando.current) return
          dibujando.current = false
          const imagen = exportar(e.currentTarget, conTrazo.current)
          onChange(imagen ? { imagen, modo: 'dibujada' } : null)
        }}
      />
      {modo === 'dibujada' && <p className="text-label text-ink-3">Firmá con el dedo o el mouse dentro del recuadro.</p>}
    </div>
  )
}
