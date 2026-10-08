'use client'

import { TEMA } from './tema'

interface EstadosTramitesChartProps {
  enCurso: number
  completados: number
  cancelados: number
}

/**
 * Estado de los trámites como barras horizontales con el número al lado: se
 * comparan mejor que en una torta y no dependen del color para leerse.
 */
export function EstadosTramitesChart({ enCurso, completados, cancelados }: EstadosTramitesChartProps) {
  const total = enCurso + completados + cancelados
  const filas = [
    { nombre: 'En curso', valor: enCurso },
    { nombre: 'Completados', valor: completados },
    { nombre: 'Cancelados', valor: cancelados },
  ]
  const max = Math.max(...filas.map((f) => f.valor), 1)

  return (
    <div className="bg-surface rounded-control shadow-raise p-6">
      <h3 className="text-heading font-semibold text-ink">Estado de los trámites</h3>
      <p className="mb-6 text-body-sm text-ink-2">{total} trámites en total.</p>
      <ul className="space-y-5">
        {filas.map((f) => (
          <li key={f.nombre} title={`${f.nombre}: ${f.valor} (${total ? Math.round((f.valor / total) * 100) : 0}%)`}>
            <div className="mb-1.5 flex items-baseline justify-between text-body-sm">
              <span className="font-medium text-ink">{f.nombre}</span>
              <span className="tnum text-ink-2">
                <span className="font-semibold text-ink">{f.valor}</span> · {total ? Math.round((f.valor / total) * 100) : 0}%
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-3">
              <div className="h-full rounded-full" style={{ width: `${(f.valor / max) * 100}%`, background: TEMA.gris }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
