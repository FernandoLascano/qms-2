'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface TendenciasChartProps {
  tramites: {
    porMes: Array<{ mes: string; cantidad: number }>
  }
  ingresos: {
    porMes: Array<{ mes: string; ingresos: number }>
  }
}

export function TendenciasChart({ tramites, ingresos }: TendenciasChartProps) {
  // Calcular tendencias
  const tramitesTendencia = calcularTendencia(tramites.porMes.map(m => m.cantidad))
  const ingresosTendencia = calcularTendencia(ingresos.porMes.map(m => m.ingresos))

  return (
    <div className="bg-surface rounded-control shadow-raise p-6">
      <h3 className="text-heading font-semibold text-ink mb-4">Tendencias</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-info-soft rounded-control border border-info-line">
          <div>
            <p className="text-body-sm font-medium text-ink-2">Trámites</p>
            <p className="text-label text-ink-2">Últimos 6 meses</p>
          </div>
          <div className="flex items-center gap-2">
            {tramitesTendencia > 0 ? (
              <TrendingUp className="h-5 w-5 text-success" />
            ) : tramitesTendencia < 0 ? (
              <TrendingDown className="h-5 w-5 text-primary" />
            ) : (
              <Minus className="h-5 w-5 text-ink-3" />
            )}
            <span className={`font-semibold ${
              tramitesTendencia > 0 ? 'text-success' : 
              tramitesTendencia < 0 ? 'text-primary' : 
              'text-ink-2'
            }`}>
              {tramitesTendencia > 0 ? '+' : ''}{tramitesTendencia.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-success-soft rounded-control border border-success-line">
          <div>
            <p className="text-body-sm font-medium text-ink-2">Ingresos</p>
            <p className="text-label text-ink-2">Últimos 6 meses</p>
          </div>
          <div className="flex items-center gap-2">
            {ingresosTendencia > 0 ? (
              <TrendingUp className="h-5 w-5 text-success" />
            ) : ingresosTendencia < 0 ? (
              <TrendingDown className="h-5 w-5 text-primary" />
            ) : (
              <Minus className="h-5 w-5 text-ink-3" />
            )}
            <span className={`font-semibold ${
              ingresosTendencia > 0 ? 'text-success' : 
              ingresosTendencia < 0 ? 'text-primary' : 
              'text-ink-2'
            }`}>
              {ingresosTendencia > 0 ? '+' : ''}{ingresosTendencia.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function calcularTendencia(valores: number[]): number {
  if (valores.length < 2) return 0
  
  const primeros = valores.slice(0, Math.floor(valores.length / 2))
  const ultimos = valores.slice(Math.floor(valores.length / 2))
  
  const promedioPrimeros = primeros.reduce((a, b) => a + b, 0) / primeros.length
  const promedioUltimos = ultimos.reduce((a, b) => a + b, 0) / ultimos.length
  
  if (promedioPrimeros === 0) return promedioUltimos > 0 ? 100 : 0
  
  return ((promedioUltimos - promedioPrimeros) / promedioPrimeros) * 100
}

