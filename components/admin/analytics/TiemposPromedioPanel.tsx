'use client'

import { Clock } from 'lucide-react'

interface TiemposPromedioProps {
  total: number
  desdeValidacion?: number
  porEtapa: {
    reservaDenominacion: number
    depositoCapital: number
    firmaEstatuto: number
    inscripcion: number
  }
}

export function TiemposPromedioPanel({ total, desdeValidacion, porEtapa }: TiemposPromedioProps) {
  const etapas = [
    { nombre: '1. Reserva Denominación', dias: porEtapa.reservaDenominacion, color: 'bg-info-solid' },
    { nombre: '2. Depósito Capital', dias: porEtapa.depositoCapital, color: 'bg-info-solid' },
    { nombre: '3. Firma Estatuto', dias: porEtapa.firmaEstatuto, color: 'bg-warning-solid' },
    { nombre: '4. Inscripción', dias: porEtapa.inscripcion, color: 'bg-success-solid' }
  ]

  const totalDias = Object.values(porEtapa).reduce((sum, dias) => sum + dias, 0)

  return (
    <div className="bg-surface rounded-control shadow-raise p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-info-soft rounded-control">
          <Clock className="w-6 h-6 text-info" />
        </div>
        <div>
          <h3 className="text-heading font-semibold text-ink">Tiempo Promedio</h3>
          <p className="text-body-sm text-ink-2">Por etapa del trámite</p>
        </div>
      </div>

      <div className="mb-6 space-y-3">
        <div className="p-4 bg-surface-2 rounded-control">
          <div className="flex items-baseline gap-2">
            <span className="text-display font-semibold text-ink">
              {total > 0 ? total.toFixed(1) : totalDias.toFixed(1)}
            </span>
            <span className="text-heading text-ink-2">días</span>
          </div>
          <p className="text-body-sm text-ink-2 mt-1">Total promedio desde Reserva de Nombre hasta Inscripción</p>
        </div>
        
        {desdeValidacion !== undefined && desdeValidacion > 0 && (
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
        {etapas.map((etapa, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between text-body-sm">
              <span className="font-medium text-ink-2">{etapa.nombre}</span>
              <span className="text-ink-2 font-semibold">
                {etapa.dias.toFixed(1)} días
              </span>
            </div>
            <div className="w-full bg-n-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${etapa.color} transition-all duration-500`}
                style={{ width: `${(etapa.dias / totalDias) * 100}%` }}
              />
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

