'use client'

import { TEMA } from './tema'

interface ConversionFunnelProps {
  leads: number
  registrados: number
  conTramite: number
  completados: number
}

/**
 * Embudo de personas: cada paso está incluido en el anterior, así que nunca
 * puede haber más gente abajo que arriba.
 *  - Interesados: todos los registrados más los leads que nunca abrieron cuenta.
 *  - Registrados: usuarios con cuenta.
 *  - Iniciaron trámite: usuarios con al menos un trámite (aunque sea borrador).
 *  - Completados: usuarios con una sociedad inscripta.
 */
export function ConversionFunnel({ leads, registrados, conTramite, completados }: ConversionFunnelProps) {
  const base = Math.max(leads, registrados)
  const calcularPorcentaje = (valor: number) => (base > 0 ? (valor / base) * 100 : 0)

  const etapas = [
    {
      nombre: 'Interesados',
      valor: leads,
      porcentaje: calcularPorcentaje(leads),
    },
    { 
      nombre: 'Registrados', 
      valor: registrados, 
      porcentaje: calcularPorcentaje(registrados), 
    },
    { 
      nombre: 'Iniciaron Trámite', 
      valor: conTramite, 
      porcentaje: calcularPorcentaje(conTramite), 
    },
    { 
      nombre: 'Completados', 
      valor: completados, 
      porcentaje: calcularPorcentaje(completados), 
    }
  ]

  return (
    <div className="bg-surface rounded-control shadow-raise p-6">
      <h3 className="text-heading font-semibold text-ink mb-6">Embudo de conversión</h3>
      <div className="space-y-4">
        {etapas.map((etapa, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between text-body-sm">
              <span className="font-medium text-ink-2">{etapa.nombre}</span>
              <span className="text-ink-2">
                {etapa.valor} ({etapa.porcentaje.toFixed(0)}%)
              </span>
            </div>
            <div className="w-full bg-surface-3 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                // Un solo color; el último paso (el resultado) en rojo.
                style={{ width: `${etapa.porcentaje}%`, background: index === etapas.length - 1 ? TEMA.rojo : TEMA.gris }}
              />
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-line">
        <div className="flex justify-between text-body-sm">
          <span className="text-ink-2">Tasa Conversión Total:</span>
          <span className="font-semibold text-ink">
            {calcularPorcentaje(completados).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  )
}

