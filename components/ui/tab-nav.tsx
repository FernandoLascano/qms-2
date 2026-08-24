import Link from 'next/link'
import { cn } from '@/lib/utils'
import { CountBadge } from '@/components/ui/badge'

/**
 * Pestañas basadas en la URL (?tab=…).
 *
 * Al ser enlaces y no estado de cliente, cada pestaña se puede compartir por
 * link y el servidor renderiza sólo su contenido. Esto es lo que permite pasar
 * la ficha de trámite del admin de ~20 paneles apilados a una pantalla por
 * tarea.
 */

export interface Tab {
  id: string
  label: string
  /** Contador de pendientes: sólo se muestra si es mayor a cero. */
  badge?: number
}

export function TabNav({
  tabs,
  activo,
  basePath,
  className,
}: {
  tabs: Tab[]
  activo: string
  /** Ruta base sin query. */
  basePath: string
  className?: string
}) {
  return (
    <nav
      aria-label="Secciones del trámite"
      className={cn('-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0', className)}
    >
      <ul className="flex min-w-max items-center gap-1 border-b border-line">
        {tabs.map((tab) => {
          const seleccionado = tab.id === activo
          return (
            <li key={tab.id}>
              <Link
                href={tab.id === tabs[0].id ? basePath : `${basePath}?tab=${tab.id}`}
                aria-current={seleccionado ? 'page' : undefined}
                scroll={false}
                className={cn(
                  'relative flex h-11 items-center gap-2 rounded-t-control px-3 text-body-sm transition-colors',
                  seleccionado
                    ? 'font-medium text-primary'
                    : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
                )}
              >
                {tab.label}
                {tab.badge ? <CountBadge count={tab.badge} tone="danger" /> : null}
                {seleccionado && (
                  <span
                    className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary"
                    aria-hidden
                  />
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
