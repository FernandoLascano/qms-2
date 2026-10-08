'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import { pesos } from './tema'

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
  // Pesos completos, igual que las tarjetas de arriba: antes acá decía
  // «$1.2M» y arriba «$1214K» para el mismo ingreso.
  const formatearValor = (valor: number | string) =>
    formato === 'dinero' && typeof valor === 'number' ? pesos(valor) : valor

  const cambioAbsoluto = Math.abs(cambio)
  const TrendIcon = esPositivo ? TrendingUp : TrendingDown
  const colorTendencia = esPositivo ? 'text-success' : 'text-primary'
  const bgTendencia = esPositivo ? 'bg-success-soft' : 'bg-primary-soft'

  return (
    <div className="bg-surface rounded-control shadow-raise p-6 hover:shadow-raise transition">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-body-sm font-medium text-ink-2 mb-1">{titulo}</p>
          <h3 className="text-display font-semibold text-ink">
            {formatearValor(valorActual)}
          </h3>
        </div>
        {icono && (
          <div className="p-3 rounded-control bg-surface-2">
            {icono}
          </div>
        )}
      </div>

      <div className={`flex items-center gap-2 p-3 rounded-control ${bgTendencia}`}>
        <TrendIcon className={`w-5 h-5 ${colorTendencia}`} />
        <div className="flex-1">
          <span className={`text-body-sm font-semibold ${colorTendencia}`}>
            {cambio > 0 ? '+' : cambio < 0 ? '−' : ''}{cambioAbsoluto.toFixed(1)}%
          </span>
          <span className="text-label text-ink-2 ml-2">vs mes anterior</span>
        </div>
      </div>

      <div className="mt-3 text-label text-ink-2">
        Mes anterior: {formatearValor(valorAnterior)}
      </div>
    </div>
  )
}

