import type { ReactNode } from 'react'
import { AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Recuadro de aviso dentro de un formulario. Dos tonos y nada más: `info` para
 * explicar (gris) y `atencion` para un requisito que puede frenar el trámite
 * (ámbar). Antes cada paso tenía el suyo —rojo de marca, amarillo, gris— con un
 * emoji distinto adelante, y el rojo se confundía con un error.
 */
export function Aviso({
  tono = 'info',
  titulo,
  children,
  className,
}: {
  tono?: 'info' | 'atencion'
  titulo?: string
  children: ReactNode
  className?: string
}) {
  const Icono = tono === 'atencion' ? AlertTriangle : Info
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-control border p-4 text-body-sm',
        tono === 'atencion' ? 'border-warning-line bg-warning-soft' : 'border-line bg-surface-2',
        className,
      )}
    >
      <Icono className={cn('mt-0.5 h-4 w-4 shrink-0', tono === 'atencion' ? 'text-warning' : 'text-ink-3')} aria-hidden />
      <div className="space-y-1 text-ink-2">
        {titulo && <p className="font-semibold text-ink">{titulo}</p>}
        {children}
      </div>
    </div>
  )
}
