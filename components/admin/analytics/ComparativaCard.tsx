'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'

interface ComparativaCardProps {
  titulo: string
  valorActual: number | string
  valorAnterior: number | string
  cambio: number
  esPositivo: boolean
  formato?: 'numero' | 'dinero'
  icono?: React.ReactNode
}

export function ComparativaCard({
  titulo,
  valorActual,
  valorAnterior,
  cambio,
  esPositivo,
  formato = 'numero',
  icono
}: ComparativaCardProps) {
  const formatearValor = (valor: number | string) => {
    if (formato === 'dinero' && typeof valor === 'number') {
      if (valor >= 1000000) return `$${(valor / 1000000).toFixed(1)}M`
      if (valor >= 1000) return `$${(valor / 1000).toFixed(0)}K`
      return `$${valor}`
    }
    return valor
  }

  const cambioAbsoluto = Math.abs(cambio)
  const TrendIcon = esPositivo ? TrendingUp : TrendingDown
  const colorTendencia = esPositivo ? 'text-green-600' : 'text-red-600'
  const bgTendencia = esPositivo ? 'bg-green-50' : 'bg-red-50'

  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{titulo}</p>
          <h3 className="text-3xl font-bold text-gray-900">
            {formatearValor(valorActual)}
          </h3>
        </div>
        {icono && (
          <div className="p-3 rounded-lg bg-gray-50">
            {icono}
          </div>
        )}
      </div>

      <div className={`flex items-center gap-2 p-3 rounded-lg ${bgTendencia}`}>
        <TrendIcon className={`w-5 h-5 ${colorTendencia}`} />
        <div className="flex-1">
          <span className={`text-sm font-bold ${colorTendencia}`}>
            {esPositivo ? '+' : ''}{cambioAbsoluto.toFixed(1)}%
          </span>
          <span className="text-xs text-gray-600 ml-2">vs mes anterior</span>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-500">
        Mes anterior: {formatearValor(valorAnterior)}
      </div>
    </div>
  )
}

