import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Lista de datos "etiqueta / valor".
 *
 * Este patrón aparecía ~100 veces escrito a mano (<p class="text-sm
 * text-gray-500">Label</p><p class="font-semibold">Valor</p>) con seis
 * combinaciones distintas de tamaño y color. Ahora es un componente.
 *
 *   <DataList columns={4}>
 *     <DataItem label="Jurisdicción" value="Córdoba (IPJ)" />
 *     <DataItem label="Capital" value={<span className="tnum">$100.000</span>} />
 *   </DataList>
 */

export function DataList({
  columns = 2,
  className,
  children,
}: {
  columns?: 1 | 2 | 3 | 4
  className?: string
  children: React.ReactNode
}) {
  const cols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
  }[columns]

  return <dl className={cn("grid gap-x-6 gap-y-4", cols, className)}>{children}</dl>
}

export function DataItem({
  label,
  value,
  icon: Icon,
  className,
  mono = false,
}: {
  label: string
  value: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
  className?: string
  /** Para CBU, CUIT, códigos: usa la familia monoespaciada. */
  mono?: boolean
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-label text-ink-2">{label}</dt>
      <dd
        className={cn(
          "mt-0.5 flex items-center gap-1.5 text-body font-medium text-ink",
          mono && "font-mono tnum",
        )}
      >
        {Icon && <Icon className="h-4 w-4 shrink-0 text-ink-3" />}
        <span className="truncate">{value || '—'}</span>
      </dd>
    </div>
  )
}
