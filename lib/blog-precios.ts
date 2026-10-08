import { formatARS } from '@/lib/precios'
import type { PublicConfig } from '@/lib/config'

/**
 * Precios vivos en las notas del blog.
 *
 * El contenido de las notas se guarda en la base como texto, así que un precio
 * escrito a mano ("Desde $285.000") queda viejo apenas cambia la config. Para
 * que el blog muestre lo mismo que la home, las notas pueden usar estos
 * marcadores y se reemplazan al renderizar con los precios de `getPublicConfig()`
 * (la misma fuente que usa la home):
 *
 *   {{precio_basico}}       → $350.000
 *   {{precio_emprendedor}}  → $399.000
 *   {{precio_premium}}      → $460.000
 */
export function reemplazarPreciosBlog<T>(
  valor: T,
  precios: Pick<PublicConfig, 'precioPlanBasico' | 'precioPlanEmprendedor' | 'precioPlanPremium'>
): T {
  const tabla: Record<string, string> = {
    precio_basico: formatARS(precios.precioPlanBasico),
    precio_emprendedor: formatARS(precios.precioPlanEmprendedor),
    precio_premium: formatARS(precios.precioPlanPremium),
  }

  const recorrer = (v: unknown): unknown => {
    if (typeof v === 'string') {
      return v.replace(/\{\{\s*(precio_basico|precio_emprendedor|precio_premium)\s*\}\}/g, (_, k: string) => tabla[k])
    }
    if (Array.isArray(v)) return v.map(recorrer)
    // Solo objetos planos (el JSON del contenido): fechas y demás quedan intactos.
    if (v && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype) {
      return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, recorrer(x)]))
    }
    return v
  }

  return recorrer(valor) as T
}
