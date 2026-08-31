'use client'

interface ConversionFunnelProps {
  leads: number
  registrados: number
  conTramite: number
  completados: number
}

/**
 * El embudo empezaba en «registrados» y por eso no servía para lo que hacía
 * falta: medía gente que ya había decidido abrir una cuenta, o sea después del
 * punto donde se pierde a la mayoría. Ahora arranca en el interés —consultas
 * más borradores— que es donde realmente empieza el recorrido.
 */
export function ConversionFunnel({ leads, registrados, conTramite, completados }: ConversionFunnelProps) {
  const base = Math.max(leads, registrados)
  const calcularPorcentaje = (valor: number) => (base > 0 ? (valor / base) * 100 : 0)

  const etapas = [
    {
      nombre: 'Interesados',
      valor: leads,
      porcentaje: calcularPorcentaje(leads),
      color: 'bg-primary',
    },
    { 
      nombre: 'Registrados', 
      valor: registrados, 
      porcentaje: calcularPorcentaje(registrados), 
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

