'use client'

import * as React from 'react'
import { FileText, Paperclip, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Selector de archivo del sistema.
 *
 * El `<input type="file">` nativo se dibuja con el estilo del navegador: en
 * Chrome sale un "Choose File / No file chosen" gris, en inglés, que no
 * respeta ningún token y era lo más feo de las pantallas de documentos.
 *
 * Acá el input real queda oculto pero accesible (el label lo activa, y sigue
 * siendo alcanzable con teclado), y encima se dibuja una zona de arrastre con
 * el nombre y el peso del archivo elegido.
 */

const formatearPeso = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export interface FileInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'size'> {
  /** Texto de la zona vacía. */
  label?: string
  /** Formatos admitidos, para mostrar bajo el título. */
  ayuda?: string
  /** Archivo elegido (controlado desde afuera). */
  archivo?: File | null
  onArchivo?: (archivo: File | null) => void
  /** Versión de una línea, para formularios densos. */
  compacto?: boolean
  /** Avance de la subida (0–100). `null`/ausente = no se está subiendo. */
  progreso?: number | null
  /** La subida terminó bien: muestra el tilde animado. */
  listo?: boolean
}

export const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  (
    {
      className,
      label = 'Elegí un archivo o arrastralo acá',
      ayuda,
      archivo,
      onArchivo,
      compacto = false,
      progreso = null,
      listo = false,
      disabled,
      onChange,
      ...props
    },
    ref,
  ) => {
    const [interno, setInterno] = React.useState<File | null>(null)
    const [arrastrando, setArrastrando] = React.useState(false)
    const inputRef = React.useRef<HTMLInputElement>(null)
    const id = React.useId()

    // Componente controlado o no, según el consumidor pase `archivo` o no.
    const elegido = archivo !== undefined ? archivo : interno

    /**
     * Cuando el consumidor limpia la selección (típicamente tras subir el
     * archivo), hay que vaciar también el input real. Si no, el navegador
     * conserva el archivo anterior y volver a elegir *el mismo* no dispara
     * ningún `change`: la pantalla se queda vacía y el botón de subir
     * deshabilitado sin que se entienda por qué.
     */
    React.useEffect(() => {
      if (archivo === null && inputRef.current?.value) inputRef.current.value = ''
    }, [archivo])

    const setArchivo = (f: File | null) => {
      if (archivo === undefined) setInterno(f)
      onArchivo?.(f)
    }

    const alSoltar = (e: React.DragEvent) => {
      e.preventDefault()
      setArrastrando(false)
      if (disabled) return
      const f = e.dataTransfer.files?.[0]
      if (!f || !inputRef.current) return
      // Se refleja en el input real para que un <form> normal lo envíe.
      const dt = new DataTransfer()
      dt.items.add(f)
      inputRef.current.files = dt.files
      setArchivo(f)
      inputRef.current.dispatchEvent(new Event('change', { bubbles: true }))
    }

    const limpiar = () => {
      if (inputRef.current) inputRef.current.value = ''
      setArchivo(null)
    }

    return (
      /* `relative` no es decorativo: el <input> de abajo es `sr-only`, que en
         Tailwind significa `position: absolute` SIN top ni left. Sin un ancestro
         posicionado, su bloque contenedor pasa a ser la página entera, y el
         input queda anclado a su posición estática en coordenadas del documento
         —fuera del <main> que scrollea—. Eso estiraba el alto del documento
         hasta donde cayera el input: en la pantalla de un trámite con
         documentos, 419px de scroll en blanco por debajo del panel. */
      <div className={cn('relative w-full', className)}>
        <input
          {...props}
          ref={(nodo) => {
            inputRef.current = nodo
            if (typeof ref === 'function') ref(nodo)
            else if (ref) ref.current = nodo
          }}
          id={props.id ?? id}
          type="file"
          disabled={disabled}
          className="sr-only"
          onChange={(e) => {
            setArchivo(e.target.files?.[0] ?? null)
            onChange?.(e)
          }}
        />

        {elegido ? (
          <div
            className={cn(
              'flex items-center gap-3 rounded-control border border-line-input bg-surface-2',
              compacto ? 'px-3 py-2' : 'px-4 py-3',
            )}
          >
            <span
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors',
                listo ? 'bg-success-solid text-on-primary' : 'bg-primary-soft text-primary',
              )}
              aria-hidden
            >
              {listo ? <TildeAnimado /> : <FileText className="h-4 w-4" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-body-sm font-medium text-ink">
                {elegido.name}
              </span>
              {progreso !== null && !listo ? (
                <span className="mt-1 flex items-center gap-2" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progreso} aria-label="Subiendo archivo">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-n-200">
                    <span
                      className={cn(
                        'block h-full rounded-full bg-primary transition-[width] duration-300 ease-out',
                        progreso >= 100 && 'animate-pulse',
                      )}
                      style={{ width: `${Math.max(progreso, 4)}%` }}
                    />
                  </span>
                  <span className="shrink-0 text-label text-ink-2 tnum">
                    {progreso < 100 ? `${progreso}%` : 'Procesando…'}
                  </span>
                </span>
              ) : (
                <span className={cn('block text-label tnum', listo ? 'font-medium text-success' : 'text-ink-2')}>
                  {listo ? 'Subido' : formatearPeso(elegido.size)}
                </span>
              )}
            </span>
            {progreso === null && !listo && (
            <>
            <label
              htmlFor={props.id ?? id}
              className="cursor-pointer rounded-chip px-2 py-1 text-label font-semibold text-primary hover:bg-primary-soft"
            >
              Cambiar
            </label>
            <button
              type="button"
              onClick={limpiar}
              aria-label={`Quitar ${elegido.name}`}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control text-ink-3 hover:bg-danger-soft hover:text-danger"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
            </>
            )}
          </div>
        ) : (
          <label
            htmlFor={props.id ?? id}
            onDragOver={(e) => {
              e.preventDefault()
              if (!disabled) setArrastrando(true)
            }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={alSoltar}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-control border border-dashed',
              'transition-colors duration-150',
              compacto ? 'px-3 py-2.5' : 'px-4 py-5',
              disabled
                ? 'cursor-not-allowed border-line bg-surface-2 opacity-60'
                : arrastrando
                  ? 'border-primary bg-primary-soft'
                  : 'border-line-input bg-surface hover:border-primary hover:bg-primary-soft/40',
            )}
          >
            <span
              className={cn(
                'flex shrink-0 items-center justify-center rounded-full',
                compacto ? 'h-8 w-8' : 'h-10 w-10',
                arrastrando ? 'bg-primary text-on-primary' : 'bg-surface-3 text-ink-2',
              )}
              aria-hidden
            >
              {compacto ? (
                <Paperclip className="h-4 w-4" />
              ) : (
                <Upload className="h-4.5 w-4.5" />
              )}
            </span>
            <span className="min-w-0">
              <span className="block text-body-sm font-medium text-ink">{label}</span>
              {ayuda && <span className="block text-label text-ink-2">{ayuda}</span>}
            </span>
          </label>
        )}
      </div>
    )
  },
)

FileInput.displayName = 'FileInput'

/** Tilde que se dibuja solo (trazo SVG; keyframe `dibujar-trazo` en globals.css). */
function TildeAnimado() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7.5" className="trazo-dibujado" pathLength={1} />
    </svg>
  )
}
