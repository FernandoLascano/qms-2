'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface IngresosPorMesChartProps {
  data: Array<{
    mes: string
    ingresos: number
  }>
}

export function IngresosPorMesChart({ data }: IngresosPorMesChartProps) {
  // Formatear valores en K
  const formatearMonto = (valor: number) => {
    if (valor >= 1000000) return `$${(valor / 1000000).toFixed(1)}M`
    if (valor >= 1000) return `$${(valor / 1000).toFixed(0)}K`
    return `$${valor}`
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">💰 Ingresos por Mes</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="mes" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tickFormatter={formatearMonto}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px' 
            }}
            formatter={(value: number) => [`${formatearMonto(value)}`, 'Ingresos']}
          />
          <Bar 
            dataKey="ingresos" 
            fill="#10b981"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

