// Fuente única de la lógica de precios.
//
// El precio de cada plan (el que se configura en el admin / Config) es el
// PRECIO POR TRANSFERENCIA (promocional, el que se quiere recibir).
// El PRECIO REGULAR (tarjeta / Mercado Pago) se calcula con un recargo.
//
// Cambiando el precio base de un plan en un solo lugar (la config), ambos
// precios se recalculan automáticamente en toda la página.

// Recargo aplicado al precio de transferencia para pagos con tarjeta/Mercado Pago.
export const RECARGO_TARJETA = 0.10

// Precio regular (tarjeta / Mercado Pago) a partir del precio de transferencia.
export function precioRegular(precioTransferencia: number): number {
  return Math.round(precioTransferencia * (1 + RECARGO_TARJETA))
}

// Ahorro absoluto pagando por transferencia (regular - transferencia).
export function ahorroTransferencia(precioTransferencia: number): number {
  return precioRegular(precioTransferencia) - Math.round(precioTransferencia)
}

// Formatea un monto en pesos argentinos: 350000 -> "$350.000"
export function formatARS(monto: number): string {
  return `$${Math.round(monto).toLocaleString('es-AR')}`
}
