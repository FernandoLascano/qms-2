'use client'

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Sección plegable accesible.
 *
 * Reemplaza a components/admin/CollapsibleCard, cuya cabecera era un
 * <div onClick>: no se podía abrir con teclado, no anunciaba su estado, y los
 * botones de acción que vivían adentro disparaban también el toggle.
 *
 * Acá el disparador es un <button> real con aria-expanded / aria-controls, y
 * las acciones viven FUERA de él, así "Editar" ya no pliega el panel.
 */

interface CollapsibleSectionProps {
  title: string
  description?: string
  icon?: React.ReactNode
  /** Acciones a la derecha del encabezado (no disparan el plegado). */
  action?: React.ReactNode
  /** Resumen a la derecha cuando está cerrada (p. ej. "3 socios"). */
  summary?: React.ReactNode
  defaultOpen?: boolean
  padding?: 'default' | 'compact'
  className?: string
  children: React.ReactNode
}

export function CollapsibleSection({
  title,
  description,
  icon,
  action,
  summary,
  defaultOpen = false,
  padding = 'compact',
  className,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = React.useState(defaultOpen)
  const id = React.useId()
  const panelId = `${id}-panel`
  const buttonId = `${id}-button`
  const pad = padding === 'compact' ? 'p-card-sm' : 'p-card-sm sm:p-card'

  return (
    <section
      className={cn("rounded-card border border-line bg-surface", className)}
    >
      <div className={cn("flex items-center gap-2", pad, !open && "border-b-0")}>
        <button
          type="button"
          id={buttonId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="group flex min-w-0 flex-1 items-center gap-2 rounded-control text-left"
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-ink-3 transition-transform duration-150",
              open && "rotate-180",
            )}
            aria-hidden
          />
          {icon && <span className="shrink-0 text-ink-3">{icon}</span>}
          <span className="min-w-0">
            <span className="block truncate text-heading text-ink group-hover:text-primary">
              {title}
            </span>
            {description && (
              <span className="block truncate text-body-sm text-ink-2">
                {description}
              </span>
            )}
          </span>
        </button>

        {!open && summary && (
          <span className="shrink-0 text-body-sm text-ink-2">{summary}</span>
        )}
        {action && <span className="shrink-0">{action}</span>}
      </div>

      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        hidden={!open}
        className={cn("border-t border-line", pad)}
      >
        {children}
      </div>
    </section>
  )
}

export default CollapsibleSection
