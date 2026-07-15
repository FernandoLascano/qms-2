import { cache } from 'react'
import { prisma } from '@/lib/prisma'

// Valores por defecto usados como fallback si no hay configuración en la DB.
export const PUBLIC_CONFIG_DEFAULTS = {
  precioPlanBasico: 285000,
  precioPlanEmprendedor: 320000,
  precioPlanPremium: 390000,
  descuentoTransferencia: 3,
  smvm: 317800,
}

export type PublicConfig = typeof PUBLIC_CONFIG_DEFAULTS

/**
 * Configuración pública (precios de planes, % descuento por transferencia y SMVM).
 * Cacheado por request con React `cache()` para no repetir la query en el mismo render.
 */
export const getPublicConfig = cache(async (): Promise<PublicConfig> => {
  try {
    const config = await prisma.config.findFirst()
    if (!config) return PUBLIC_CONFIG_DEFAULTS
    return {
      precioPlanBasico: config.precioPlanBasico,
      precioPlanEmprendedor: config.precioPlanEmprendedor,
      precioPlanPremium: config.precioPlanPremium,
      descuentoTransferencia: config.descuentoTransferencia,
      smvm: config.smvm,
    }
  } catch {
    return PUBLIC_CONFIG_DEFAULTS
  }
})

/**
 * Precio con descuento por transferencia, redondeado a peso entero.
 */
export function precioTransferencia(precioPlan: number, descuentoPct: number): number {
  return Math.round(precioPlan * (1 - descuentoPct / 100))
}
