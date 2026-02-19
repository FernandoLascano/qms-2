'use client'

import { CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProgressSummaryProps {
  pasoActual: number
  totalPasos: number
  pasosCompletados: boolean[]
}

export function ProgressSummary({ pasoActual, totalPasos, pasosCompletados }: ProgressSummaryProps) {
  const porcentaje = Math.round((pasoActual / totalPasos) * 100)
  const pasosCompletos = pasosCompletados.filter(Boolean).length

  return (
    <div className="bg-gradient-to-r from-brand-50 to-orange-50 border-2 border-brand-200 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-brand-600" />
          <span className="font-semibold text-gray-900">Progreso del Formulario</span>
        </div>
        <span className="text-2xl font-bold text-brand-600">{porcentaje}%</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
        <div
          className="bg-gradient-to-r from-brand-600 to-brand-700 h-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
          style={{ width: `${porcentaje}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-gray-700">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span>{pasosCompletos} de {totalPasos} pasos completados</span>
        </div>
        <span className="text-gray-600">
          Paso {pasoActual} de {totalPasos}
        </span>
      </div>
    </div>
  )
}

