'use client'

import { precioRegular, ahorroTransferencia, formatARS } from '@/lib/precios'

interface PrecioDualProps {
  // Precio de transferencia (el precio base del plan, promocional).
  transferencia: number
  // Clase del precio destacado (transferencia), para adaptarse al color de cada card.
  precioClassName?: string
  // Muestra "+ gastos" al lado del precio.
  gastos?: boolean
  // Alineación del contenido.
  align?: 'left' | 'center'
}

// Muestra el precio regular tachado + el precio de transferencia destacado,
// con un badge de ahorro y la aclaración del método de pago.
export function PrecioDual({ transferencia, precioClassName = 'text-4xl font-bold text-gray-900', gastos = false, align = 'left' }: PrecioDualProps) {
  const regular = precioRegular(transferencia)
  const ahorro = ahorroTransferencia(transferencia)
  const centrado = align === 'center'

  return (
    <div className={centrado ? 'text-center' : ''}>
      <p className="text-sm text-gray-400">
        <span className="line-through">{formatARS(regular)}</span> con tarjeta
      </p>
      <div className={`flex items-baseline gap-1 ${centrado ? 'justify-center' : ''}`}>
        <span className={precioClassName}>{formatARS(transferencia)}</span>
        {gastos && <span className="text-sm text-gray-500">+ gastos</span>}
      </div>
      <p className="text-xs font-semibold text-green-700">
        Ahorrás {formatARS(ahorro)} pagando por transferencia
      </p>
    </div>
  )
}
