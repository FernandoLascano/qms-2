import * as React from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Tarjeta de métrica.
 *
 * Regla: el color aparece SÓLO cuando el valor exige una acción. Antes cada
 * KPI tenía su color decorativo (gris, azul, verde, naranja) y por eso ninguno
 * destacaba; el número accionable pesaba lo mismo que el informativo.
 */

interface StatCardProps {
  label: string
  value: React.ReactNode
  hint?: string
  icon?: LucideIcon
  /** true → la tarjeta se pinta para reclamar atención. */
  alert?: boolean
  href?: string
  className?: string
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  alert = false,
  href,
  className,
}: StatCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="text-body-sm text-ink-2">{label}</span>
        {Icon && (
          <Icon
            className={cn("h-4 w-4 shrink-0", alert ? "text-warning" : "text-ink-3")}
            aria-hidden
          />
        )}
      </div>
      <div
        className={cn(
          "mt-2 text-metric tnum",
          alert ? "text-warning" : "text-ink",
        )}
      >
        {value}
      </div>
      {hint && (
        <div className="mt-1 flex items-center gap-1 text-label text-ink-2">
          {hint}
          {href && <ArrowRight className="h-3 w-3" aria-hidden />}
        </div>
      )}
    </>
  )

  const classes = cn(
    "block rounded-card border p-card-sm transition-[border-color,box-shadow] duration-150",
    alert ? "border-warning-line bg-warning-soft" : "border-line bg-surface",
    href && "hover:border-line-strong hover:shadow-raise",
    className,
  )

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    )
  }

  return <div className={classes}>{content}</div>
}
