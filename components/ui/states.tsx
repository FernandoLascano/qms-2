'use client'

import * as React from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/* ────────────────────────────  Skeleton  ──────────────────────────── */

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-skeleton rounded-chip bg-surface-3", className)}
      aria-hidden
    />
  )
}

/** Esqueleto de una card de lista. */
export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="rounded-card border border-line bg-surface p-card-sm sm:p-card">
      <Skeleton className="h-5 w-1/3" />
      <div className="mt-4 space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-3.5" />
        ))}
      </div>
    </div>
  )
}

/** Bloque de carga de una página entera. */
export function PageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="space-y-section" aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando…</span>
      <div className="space-y-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: cards }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}

/* ──────────────────────────  Estado vacío  ────────────────────────── */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("px-6 py-12 text-center", className)}>
      {Icon && (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-card bg-surface-3">
          <Icon className="h-6 w-6 text-ink-3" aria-hidden />
        </div>
      )}
      <h3 className="text-heading text-ink">{title}</h3>
      {description && (
        <p className="mx-auto mt-1 max-w-md text-body-sm text-ink-2 text-pretty">
          {description}
        </p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}

/* ──────────────────────────  Estado de error  ─────────────────────── */

export function ErrorState({
  title = 'No pudimos cargar esta información',
  description = 'Ocurrió un problema al obtener los datos. Probá de nuevo en unos segundos.',
  onRetry,
  className,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-card border border-danger-line bg-danger-soft px-6 py-8 text-center",
        className,
      )}
    >
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-card bg-danger-solid/10">
        <AlertTriangle className="h-5 w-5 text-danger" aria-hidden />
      </div>
      <h3 className="text-heading text-ink">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-body-sm text-ink-2 text-pretty">
        {description}
      </p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" aria-hidden />
          Reintentar
        </Button>
      )}
    </div>
  )
}

/* ────────────────────────  Cargando en línea  ─────────────────────── */

export function InlineLoading({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div
      className="flex items-center justify-center gap-2 py-8 text-body-sm text-ink-2"
      aria-busy="true"
      aria-live="polite"
    >
      <RefreshCw className="h-4 w-4 animate-spin" aria-hidden />
      {label}
    </div>
  )
}
