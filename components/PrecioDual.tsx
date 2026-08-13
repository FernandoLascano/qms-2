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
      <div className={`flex flex-wrap items-center gap-2 ${centrado ? 'justify-center' : ''}`}>
        <span className="text-base text-gray-400 line-through">{formatARS(regular)}</span>
        <span className="inline-flex items-center rounded-full bg-green-100 text-green-800 border border-green-300 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">
          Ahorrás {formatARS(ahorro)} por transferencia
        </span>
      </div>
      <div className={`mt-1 flex items-baseline gap-1 ${centrado ? 'justify-center' : ''}`}>
        <span className={precioClassName}>{formatARS(transferencia)}</span>
        {gastos && <span className="text-sm text-gray-500">+ gastos</span>}
      </div>
      <p className="mt-1 text-xs text-gray-500">
        {formatARS(regular)} abonando con tarjeta o Mercado Pago. Precio promocional pagando por transferencia bancaria.
      </p>
    </div>
  )
}
