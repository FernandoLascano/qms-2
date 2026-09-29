'use client'

import { cn } from '@/lib/utils'
import { diaMas, hoyClave } from '@/lib/leads/agenda'

const OPCIONES = [
  { texto: 'Mañana', dias: 1 },
  { texto: 'En 3 días', dias: 3 },
  { texto: 'En 1 semana', dias: 7 },
  { texto: 'En 2 semanas', dias: 14 },
]

/** Cuándo volver a contactarlo. `valor` es un día YYYY-MM-DD o null (sin fecha). */
export function SelectorProximo({
  valor,
  onChange,
  etiqueta = 'Próximo seguimiento',
}: {
  valor: string | null
  onChange: (dia: string | null) => void
  etiqueta?: string
}) {
  const rapida = OPCIONES.find((o) => diaMas(o.dias) === valor)

  const chip = (activo: boolean) =>
    cn(
      'rounded-full border px-2.5 py-0.5 text-body-sm transition-colors',
      activo ? 'border-primary-line bg-primary-soft font-medium text-primary' : 'border-line bg-surface text-ink-2 hover:text-ink',
    )

  return (
    <div className="space-y-1.5">
      <p className="text-label text-ink-2">{etiqueta}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {OPCIONES.map((o) => (
          <button key={o.dias} type="button" className={chip(rapida === o)} onClick={() => onChange(diaMas(o.dias))}>
            {o.texto}
          </button>
        ))}
        <input
          type="date"
          min={hoyClave()}
          value={valor ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          aria-label="Elegir fecha"
          className={cn(chip(!!valor && !rapida), 'h-7 text-body-sm')}
        />
        <button type="button" className={chip(valor === null)} onClick={() => onChange(null)}>
          Sin fecha
        </button>
      </div>
    </div>
  )
}
