/**
 * Montos en pesos enteros: capital social y aportes.
 *
 * Una sola forma de leerlos, en el navegador y en el servidor. Antes cada lugar
 * hacía su propio `parseFloat(x.replace(/\./g, ''))`, y un «700000.5» que
 * dejaba pasar el campo numérico se leía como 7.000.005 en el resumen y en el
 * servidor.
 */

/**
 * Lee un monto escrito por una persona o guardado en la base:
 * - número → se redondea a pesos enteros;
 * - «782.400», «782400», «$ 782.400» → 782400 (los puntos son de miles);
 * - «1250,50» o «1250.5» (uno o dos decimales) → se redondea: 1251.
 */
export function parsearMonto(valor: unknown): number {
  if (typeof valor === 'number') return Number.isFinite(valor) ? Math.round(valor) : 0
  const texto = String(valor ?? '').replace(/[\s$]/g, '')
  if (!texto) return 0
  if (/^\d+[.,]\d{1,2}$/.test(texto)) return Math.round(parseFloat(texto.replace(',', '.')))
  return parseInt(texto.replace(/\D/g, ''), 10) || 0
}

/** «782400» → «782.400», para mostrar dentro de un campo mientras se escribe. */
export function formatearMiles(valor: unknown): string {
  const n = parsearMonto(valor)
  return n ? n.toLocaleString('es-AR') : ''
}
