'use client'

interface ConversionFunnelProps {
  registrados: number
  conTramite: number
  completados: number
}

export function ConversionFunnel({ registrados, conTramite, completados }: ConversionFunnelProps) {
  const calcularPorcentaje = (valor: number) => {
    return registrados > 0 ? (valor / registrados) * 100 : 0
  }

  const etapas = [
    { 
      nombre: 'Registrados', 
      valor: registrados, 
      porcentaje: 100, 
      color: 'bg-info-solid' 
    },
    { 
      nombre: 'Iniciaron Trámite', 
      valor: conTramite, 
      porcentaje: calcularPorcentaje(conTramite), 
      color: 'bg-warning-solid' 
    },
    { 
      nombre: 'Completados', 
      valor: completados, 
      porcentaje: calcularPorcentaje(completados), 
      color: 'bg-success-solid' 
    }
  ]

  return (
    <div className="bg-surface rounded-control shadow-raise p-6">
      <h3 className="text-heading font-semibold text-ink mb-6">Embudo de Conversión</h3>
      <div className="space-y-4">
        {etapas.map((etapa, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between text-body-sm">
              <span className="font-medium text-ink-2">{etapa.nombre}</span>
              <span className="text-ink-2">
                {etapa.valor} ({etapa.porcentaje.toFixed(0)}%)
              </span>
            </div>
            <div className="w-full bg-n-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full ${etapa.color} transition-all duration-500 ease-out`}
                style={{ width: `${etapa.porcentaje}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-line">
        <div className="flex justify-between text-body-sm">
          <span className="text-ink-2">Tasa Conversión Total:</span>
          <span className="font-semibold text-success">
            {calcularPorcentaje(completados).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  )
}

