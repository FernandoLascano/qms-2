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
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">📈 Tendencias</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div>
            <p className="text-sm font-medium text-gray-700">Trámites</p>
            <p className="text-xs text-gray-500">Últimos 6 meses</p>
          </div>
          <div className="flex items-center gap-2">
            {tramitesTendencia > 0 ? (
              <TrendingUp className="h-5 w-5 text-green-600" />
            ) : tramitesTendencia < 0 ? (
              <TrendingDown className="h-5 w-5 text-red-600" />
            ) : (
              <Minus className="h-5 w-5 text-gray-400" />
            )}
            <span className={`font-bold ${
              tramitesTendencia > 0 ? 'text-green-600' : 
              tramitesTendencia < 0 ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {tramitesTendencia > 0 ? '+' : ''}{tramitesTendencia.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
          <div>
            <p className="text-sm font-medium text-gray-700">Ingresos</p>
            <p className="text-xs text-gray-500">Últimos 6 meses</p>
          </div>
          <div className="flex items-center gap-2">
            {ingresosTendencia > 0 ? (
              <TrendingUp className="h-5 w-5 text-green-600" />
            ) : ingresosTendencia < 0 ? (
              <TrendingDown className="h-5 w-5 text-red-600" />
            ) : (
              <Minus className="h-5 w-5 text-gray-400" />
            )}
            <span className={`font-bold ${
              ingresosTendencia > 0 ? 'text-green-600' : 
              ingresosTendencia < 0 ? 'text-red-600' : 
              'text-gray-600'
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

