'use client'

import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts'
import { TEMA, tooltipEstilo, pesos, pesosCorto } from './tema'

interface IngresosPorMesChartProps {
  data: Array<{
    mes: string
    ingresos: number
  }>
}

/** Ingresos computables (lo que se liquida): el mes actual en rojo, los anteriores de contexto. */
export function IngresosPorMesChart({ data }: IngresosPorMesChartProps) {
  const ultimo = data.length - 1
  return (
    <div className="bg-surface rounded-control shadow-raise p-6">
      <h3 className="text-heading font-semibold text-ink">Ingresos por mes</h3>
      <p className="mb-4 text-body-sm text-ink-2">Honorarios y domicilio: lo mismo que se liquida a las partes.</p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 22, right: 4, left: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={TEMA.grilla} />
          <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fill: TEMA.ejes, fontSize: TEMA.fuente }} />
          <YAxis tickLine={false} axisLine={false} width={64} tick={{ fill: TEMA.ejes, fontSize: TEMA.fuente }} tickFormatter={pesosCorto} />
          <Tooltip {...tooltipEstilo} formatter={(value: number) => [pesos(value), 'Ingresos']} />
          <Bar dataKey="ingresos" radius={[4, 4, 0, 0]} maxBarSize={44}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === ultimo ? TEMA.rojo : TEMA.gris} />
            ))}
            <LabelList
              dataKey="ingresos"
              position="top"
              content={({ x, y, width, value, index }) =>
                index === ultimo && Number(value) > 0 ? (
                  <text x={Number(x) + Number(width) / 2} y={Number(y) - 6} textAnchor="middle" fontSize={12} fontWeight={600} fill="#1c1c1c">
                    {pesosCorto(Number(value))}
                  </text>
                ) : null
              }
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
