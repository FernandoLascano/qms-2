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
    { nombre: '1. Reserva Denominación', dias: porEtapa.reservaDenominacion, color: 'bg-blue-500' },
    { nombre: '2. Depósito Capital', dias: porEtapa.depositoCapital, color: 'bg-purple-500' },
    { nombre: '3. Firma Estatuto', dias: porEtapa.firmaEstatuto, color: 'bg-yellow-500' },
    { nombre: '4. Inscripción', dias: porEtapa.inscripcion, color: 'bg-green-500' }
  ]

  const totalDias = Object.values(porEtapa).reduce((sum, dias) => sum + dias, 0)

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-50 rounded-lg">
          <Clock className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">⏱️ Tiempo Promedio</h3>
          <p className="text-sm text-gray-600">Por etapa del trámite</p>
        </div>
      </div>

      <div className="mb-6 space-y-3">
        <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900">
              {total > 0 ? total.toFixed(1) : totalDias.toFixed(1)}
            </span>
            <span className="text-lg text-gray-600">días</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Total promedio desde Reserva de Nombre hasta Inscripción</p>
        </div>
        
        {desdeValidacion !== undefined && desdeValidacion > 0 && (
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">
                {desdeValidacion.toFixed(1)}
              </span>
              <span className="text-lg text-gray-600">días</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Promedio desde Validación del Formulario hasta Inscripción</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {etapas.map((etapa, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">{etapa.nombre}</span>
              <span className="text-gray-600 font-semibold">
                {etapa.dias.toFixed(1)} días
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${etapa.color} transition-all duration-500`}
                style={{ width: `${(etapa.dias / totalDias) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Objetivo:</span>
          <span className="font-bold text-green-600">≤ 5 días</span>
        </div>
      </div>
    </div>
  )
}

