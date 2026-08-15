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
      <div className={cn('w-full', className)}>
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
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary"
              aria-hidden
            >
              <FileText className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-body-sm font-medium text-ink">
                {elegido.name}
              </span>
              <span className="block text-label text-ink-2 tnum">
                {formatearPeso(elegido.size)}
              </span>
            </span>
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
