'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface EstadosTramitesChartProps {
  enCurso: number
  completados: number
  cancelados: number
}

export function EstadosTramitesChart({ enCurso, completados, cancelados }: EstadosTramitesChartProps) {
  const data = [
    { name: 'En Curso', value: enCurso, color: '#fbbf24' },
    { name: 'Completados', value: completados, color: '#10b981' },
    { name: 'Cancelados', value: cancelados, color: '#ef4444' }
  ]

  return (
    <div className="bg-surface rounded-control shadow-raise p-6">
      <h3 className="text-heading font-semibold text-ink mb-4">Estado de Trámites</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

