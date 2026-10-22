'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Botón para copiar un dato (CBU, alias, monto) con confirmación en el lugar.
 *
 * Idea de interior.dev «copy-button» (MIT): el ícono pasa a un tilde que se
 * dibuja, el texto cambia a «Copiado» sin que el botón cambie de ancho, y a
 * los 2 s vuelve solo. Rehecho en CSS (ver `.apilado` en globals.css).
 *
 * Existe porque los clientes copiaban el CBU a mano para transferir el
 * capital: un dígito mal es una transferencia rebotada o, peor, perdida.
 */

type Estado = 'listo' | 'copiado' | 'error'

/** Copia al portapapeles, con respaldo para navegadores sin la API moderna. */
async function copiarTexto(texto: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto)
      return true
    }
  } catch {
    // Sigue con el respaldo (p. ej. iframes o permisos denegados).
  }
  const area = document.createElement('textarea')
  area.value = texto
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  document.body.removeChild(area)
  return ok
}

export function CopyButton({
  valor,
  etiqueta = 'Copiar',
  etiquetaCopiado = 'Copiado',
  /** Para lectores de pantalla: qué se copia («Copiar CBU»). */
  descripcion,
  className,
}: {
  valor: string
  etiqueta?: string
  etiquetaCopiado?: string
  descripcion?: string
  className?: string
}) {
  const [estado, setEstado] = useState<Estado>('listo')
  // Cada copia reinicia la cuenta regresiva, aunque se toque dos veces seguidas.
  const [vez, setVez] = useState(0)

  useEffect(() => {
    if (estado === 'listo') return
    const id = setTimeout(() => setEstado('listo'), 2000)
    return () => clearTimeout(id)
  }, [estado, vez])

  const copiar = async () => {
    const ok = await copiarTexto(valor)
    setEstado(ok ? 'copiado' : 'error')
    setVez((v) => v + 1)
  }

  const textos: [Estado, string][] = [
    ['listo', etiqueta],
    ['copiado', etiquetaCopiado],
    ['error', 'No se pudo'],
  ]

  return (
    <button
      type="button"
      onClick={copiar}
      aria-label={descripcion ?? etiqueta}
      className={cn(
        'inline-flex h-8 shrink-0 select-none items-center gap-1.5 rounded-control border border-line bg-surface px-2.5',
        'text-label font-medium text-ink-2 shadow-raise transition-[background-color,border-color,color,transform] duration-150',
        'hover:bg-surface-2 hover:text-ink active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        estado === 'copiado' && 'border-success-line text-success hover:text-success',
        estado === 'error' && 'border-danger-line text-danger hover:text-danger',
        className,
      )}
    >
      <span className="apilado size-3.5" aria-hidden>
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-3.5" data-activo={estado === 'listo'}>
          <path d="M9.6 5.1V3.7A1.7 1.7 0 0 0 7.9 2H3.7A1.7 1.7 0 0 0 2 3.7v4.2a1.7 1.7 0 0 0 1.7 1.7h1.4" />
          <rect x="5.1" y="5.1" width="6.9" height="6.9" rx="1.7" />
        </svg>
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="tilde-dibujo size-3.5" data-activo={estado === 'copiado'}>
          <path d="M2.9 7.4 5.6 10.1 11.1 4" />
        </svg>
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" className="size-3.5" data-activo={estado === 'error'}>
          <path d="M3.6 3.6 10.4 10.4M10.4 3.6 3.6 10.4" />
        </svg>
      </span>
      <span className="apilado" aria-hidden>
        {textos.map(([clave, texto]) => (
          <span key={clave} className="whitespace-nowrap" data-activo={estado === clave}>
            {texto}
          </span>
        ))}
      </span>
      <span role="status" aria-live="polite" className="sr-only">
        {estado === 'copiado' ? `${etiquetaCopiado}` : estado === 'error' ? 'No se pudo copiar' : ''}
      </span>
    </button>
  )
}

/**
 * Fila «Etiqueta: valor [Copiar]» para datos bancarios. `copiar` es lo que va
 * al portapapeles cuando difiere de lo que se muestra (un monto se muestra
 * «$ 1.250.000» pero se copia «1250000», que es lo que acepta el homebanking).
 */
export function DatoCopiable({
  etiqueta,
  valor,
  copiar,
  mono,
  className,
}: {
  etiqueta: string
  valor: string
  copiar?: string
  mono?: boolean
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="min-w-[80px] font-medium text-ink-2">{etiqueta}:</span>
      <span className={cn('min-w-0 flex-1 break-all text-ink', mono && 'font-mono')}>{valor}</span>
      <CopyButton valor={copiar ?? valor} descripcion={`Copiar ${etiqueta}`} />
    </div>
  )
}

/** Monto para pegar en el homebanking: sin «$» ni separadores de miles. */
export function montoParaCopiar(monto: number): string {
  return Number.isInteger(monto) ? String(monto) : monto.toFixed(2).replace('.', ',')
}
