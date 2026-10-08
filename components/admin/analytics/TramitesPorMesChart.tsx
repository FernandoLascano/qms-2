'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TEMA, tooltipEstilo } from './tema'

interface TramitesPorMesChartProps {
  data: Array<{
    mes: string
    cantidad: number
  }>
}

export function TramitesPorMesChart({ data }: TramitesPorMesChartProps) {
  return (
    <div className="bg-surface rounded-control shadow-raise p-6">
      <h3 className="text-heading font-semibold text-ink">Trámites por mes</h3>
      <p className="mb-4 text-body-sm text-ink-2">Trámites iniciados en cada mes.</p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 12, left: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={TEMA.grilla} />
          <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fill: TEMA.ejes, fontSize: TEMA.fuente }} />
          <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} tick={{ fill: TEMA.ejes, fontSize: TEMA.fuente }} />
          <Tooltip {...tooltipEstilo} cursor={{ stroke: TEMA.grilla, strokeWidth: 1 }} formatter={(value: number) => [value, 'Trámites']} />
          <Line
            type="monotone"
            dataKey="cantidad"
            stroke={TEMA.rojo}
            strokeWidth={2}
            dot={{ fill: TEMA.rojo, stroke: '#fff', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
