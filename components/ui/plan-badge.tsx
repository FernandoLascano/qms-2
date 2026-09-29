import { Crown, Rocket, Sprout } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * El plan de un trámite, reconocible de un vistazo.
 *
 * En el panel aparecía como texto suelto («Plan EMPRENDEDOR», «Premium»…)
 * escrito distinto en cada pantalla. Cada plan tiene ahora un icono y un
 * color propios, siempre los mismos:
 *   Básico      → brote, gris
 *   Emprendedor → cohete, azul
 *   Premium     → corona, dorado
 */

const PLANES: Record<string, { texto: string; icono: LucideIcon; clase: string }> = {
  BASICO: { texto: 'Básico', icono: Sprout, clase: 'bg-surface-3 text-ink-2 border-line' },
  EMPRENDEDOR: { texto: 'Emprendedor', icono: Rocket, clase: 'bg-a3-soft text-a3 border-a3-line' },
  PREMIUM: { texto: 'Premium', icono: Crown, clase: 'bg-a5-soft text-a5 border-a5-line' },
}

export function PlanBadge({
  plan,
  size = 'sm',
  soloIcono = false,
  className,
}: {
  plan: string | null | undefined
  size?: 'sm' | 'md'
  /** Sólo el icono, con el nombre en el tooltip: para filas muy densas. */
  soloIcono?: boolean
  className?: string
}) {
  if (!plan) return null
  const p = PLANES[plan] ?? { texto: plan.charAt(0) + plan.slice(1).toLowerCase(), icono: Sprout, clase: PLANES.BASICO.clase }
  const Icono = p.icono

  return (
    <span
      title={`Plan ${p.texto}`}
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border font-semibold whitespace-nowrap',
        soloIcono ? 'h-6 w-6 justify-center' : size === 'sm' ? 'px-2 py-0.5 text-label' : 'px-2.5 py-1 text-label',
        p.clase,
        className,
      )}
    >
      <Icono className="h-3.5 w-3.5" aria-hidden />
      {soloIcono ? <span className="sr-only">Plan {p.texto}</span> : p.texto}
    </span>
  )
}
