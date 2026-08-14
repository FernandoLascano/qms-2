'use client'

import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react'

interface Alerta {
  tipo: 'warning' | 'info' | 'success'
  mensaje: string
  valor?: number
}

interface AlertasPanelProps {
  alertas: Alerta[]
}

export function AlertasPanel({ alertas }: AlertasPanelProps) {
  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />
      case 'success':
        return <CheckCircle2 className="w-5 h-5" />
      default:
        return <Info className="w-5 h-5" />
    }
  }

  const getColorClasses = (tipo: string) => {
    switch (tipo) {
      case 'warning':
        return 'bg-warning-soft border-warning-line text-warning'
      case 'success':
        return 'bg-success-soft border-success-line text-success'
      default:
        return 'bg-info-soft border-info-line text-info'
    }
  }

  if (alertas.length === 0) {
    return (
      <div className="bg-surface rounded-control shadow-raise p-6">
        <h3 className="text-heading font-semibold text-ink mb-4">⚠️ Alertas Recientes</h3>
        <p className="text-ink-2 text-center py-4">No hay alertas en este momento</p>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-control shadow-raise p-6">
      <h3 className="text-heading font-semibold text-ink mb-4">⚠️ Alertas Recientes</h3>
      <div className="space-y-3">
        {alertas.map((alerta, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 p-3 rounded-control border ${getColorClasses(alerta.tipo)}`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(alerta.tipo)}
            </div>
            <p className="text-body-sm font-medium flex-1">{alerta.mensaje}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

