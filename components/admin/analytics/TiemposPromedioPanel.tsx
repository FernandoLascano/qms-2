'use client'

import { Clock } from 'lucide-react'

// null = no hay suficientes trámites con esas fechas cargadas para promediar.
type Dias = number | null

interface TiemposPromedioProps {
  total: Dias
  desdeValidacion?: Dias
  porEtapa: {
    reservaDenominacion: Dias
    depositoCapital: Dias
    firmaEstatuto: Dias
    inscripcion: Dias
  }
  muestra?: number
}

const SIN_DATOS = 'Sin datos suficientes'

/**
 * Todo sale de las fechas que se marcan en cada trámite inscripto. Si una
 * etapa no tiene casos suficientes se dice así, en vez de mostrar un número
 * estimado como si fuera medido.
 */
export function TiemposPromedioPanel({ total, desdeValidacion, porEtapa, muestra }: TiemposPromedioProps) {
  const etapas = [
    { nombre: '1. Reserva Denominación', detalle: 'desde el formulario enviado', dias: porEtapa.reservaDenominacion, color: 'bg-info-solid' },
    { nombre: '2. Depósito Capital', detalle: 'desde la reserva', dias: porEtapa.depositoCapital, color: 'bg-info-solid' },
    { nombre: '3. Firma Estatuto', detalle: 'desde el depósito', dias: porEtapa.firmaEstatuto, color: 'bg-warning-solid' },
    { nombre: '4. Inscripción', detalle: 'desde la firma', dias: porEtapa.inscripcion, color: 'bg-success-solid' }
  ]

  // Las barras se comparan contra la etapa más larga.
  const maximo = Math.max(0, ...etapas.map((e) => e.dias ?? 0))

  return (
    <div className="bg-surface rounded-control shadow-raise p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-info-soft rounded-control">
          <Clock className="w-6 h-6 text-info" />
        </div>
        <div>
          <h3 className="text-heading font-semibold text-ink">Tiempo Promedio</h3>
          <p className="text-body-sm text-ink-2">
            Por etapa del trámite
            {muestra ? ` · últimas ${muestra} sociedades inscriptas` : ''}
          </p>
        </div>
      </div>

      <div className="mb-6 space-y-3">
        <div className="p-4 bg-surface-2 rounded-control">
          {total !== null ? (
            <div className="flex items-baseline gap-2">
              <span className="text-display font-semibold text-ink">{total.toFixed(1)}</span>
              <span className="text-heading text-ink-2">días</span>
            </div>
          ) : (
            <p className="text-heading text-ink-2">{SIN_DATOS}</p>
          )}
          <p className="text-body-sm text-ink-2 mt-1">Total promedio desde Reserva de Nombre hasta Inscripción</p>
        </div>

        {desdeValidacion != null && desdeValidacion > 0 && (
          <div className="p-4 bg-surface-2 rounded-control border border-info-line">
            <div className="flex items-baseline gap-2">
              <span className="text-display font-semibold text-ink">
                {desdeValidacion.toFixed(1)}
              </span>
              <span className="text-heading text-ink-2">días</span>
            </div>
            <p className="text-body-sm text-ink-2 mt-1">Promedio desde Validación del Formulario hasta Inscripción</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {etapas.map((etapa) => (
          <div key={etapa.nombre} className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-body-sm">
              <span className="font-medium text-ink-2">
                {etapa.nombre}
                <span className="ml-1 font-normal text-ink-3">{etapa.detalle}</span>
              </span>
              <span className={etapa.dias !== null ? 'shrink-0 text-ink-2 font-semibold' : 'shrink-0 text-ink-3'}>
                {etapa.dias !== null ? `${etapa.dias.toFixed(1)} días` : SIN_DATOS}
              </span>
            </div>
            <div className="w-full bg-n-200 rounded-full h-2">
              {etapa.dias !== null && maximo > 0 && (
                <div
                  className={`h-2 rounded-full ${etapa.color} transition-all duration-500`}
                  style={{ width: `${(etapa.dias / maximo) * 100}%` }}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-line">
        <div className="flex justify-between text-body-sm">
          <span className="text-ink-2">Objetivo:</span>
          <span className="font-semibold text-success">≤ 5 días</span>
        </div>
      </div>
    </div>
  )
}
