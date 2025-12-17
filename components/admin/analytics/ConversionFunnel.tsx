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
      color: 'bg-blue-500' 
    },
    { 
      nombre: 'Iniciaron Trámite', 
      valor: conTramite, 
      porcentaje: calcularPorcentaje(conTramite), 
      color: 'bg-yellow-500' 
    },
    { 
      nombre: 'Completados', 
      valor: completados, 
      porcentaje: calcularPorcentaje(completados), 
      color: 'bg-green-500' 
    }
  ]

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-6">🎯 Embudo de Conversión</h3>
      <div className="space-y-4">
        {etapas.map((etapa, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">{etapa.nombre}</span>
              <span className="text-gray-600">
                {etapa.valor} ({etapa.porcentaje.toFixed(0)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full ${etapa.color} transition-all duration-500 ease-out`}
                style={{ width: `${etapa.porcentaje}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tasa Conversión Total:</span>
          <span className="font-bold text-green-600">
            {calcularPorcentaje(completados).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  )
}

