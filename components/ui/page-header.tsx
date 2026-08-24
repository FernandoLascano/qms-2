import * as React from "react"
import Link from "next/link"
import { ChevronRight, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * El ÚNICO lugar del módulo donde vive un <h1>.
 *
 * Antes el Header del layout renderizaba un h1 con el título y cada página
 * repetía el mismo texto como h1 o h2 en text-4xl font-black: el usuario leía
 * "Mis Trámites" dos veces en 80px. Ahora el chrome sólo muestra la ruta y la
 * página es dueña de su título.
 */

export interface Crumb {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  /**
   * Se pinta en el color de marca al final del título, igual que en la
   * portada ("Elegí el plan **ideal**"). Es la firma tipográfica del sitio.
   */
  destacado?: string
  /** Etiqueta corta en mayúsculas sobre el título. También del sitio. */
  overline?: string
  description?: string
  /** Migas de pan para rutas de 3 niveles (admin › trámites › DRIX SAS). */
  breadcrumbs?: Crumb[]
  /** Enlace de vuelta, para pantallas de detalle. */
  backHref?: string
  backLabel?: string
  /** Botones de acción de la pantalla. */
  actions?: React.ReactNode
  /** Badge de estado al lado del título. */
  badge?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  destacado,
  overline,
  description,
  breadcrumbs,
  backHref,
  backLabel = 'Volver',
  actions,
  badge,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Ruta de navegación">
          <ol className="flex flex-wrap items-center gap-1 text-body-sm text-ink-2">
            {breadcrumbs.map((crumb, i) => (
              <li key={`${crumb.label}-${i}`} className="flex items-center gap-1">
                {i > 0 && (
                  <ChevronRight className="h-3.5 w-3.5 text-ink-3" aria-hidden />
                )}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="rounded-chip hover:text-ink hover:underline underline-offset-4"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-ink" aria-current="page">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {backHref && !breadcrumbs && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 rounded-chip text-body-sm text-ink-2 hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {backLabel}
        </Link>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {overline && <p className="overline mb-2">{overline}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-display text-ink text-balance">
              {title}
              {destacado && <span className="text-primary"> {destacado}</span>}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="mt-2 max-w-2xl text-body text-ink-2 text-pretty">{description}</p>
          )}
        </div>

        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  )
}

/** Encabezado de una sección dentro de una página. */
export function SectionHeader({
  title,
  description,
  actions,
  className,
  as: Tag = 'h2',
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
  as?: 'h2' | 'h3'
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <Tag className="text-title text-ink">{title}</Tag>
        {description && <p className="mt-0.5 text-body-sm text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
