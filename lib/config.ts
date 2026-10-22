import { cache } from 'react'
import { unstable_cache } from 'next/cache'
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

export const TAG_CONFIG = 'config'

/**
 * Configuración pública (precios de planes, % descuento por transferencia y SMVM).
 * Dos niveles: `unstable_cache` la guarda entre requests (el layout raíz la lee en
 * cada render dinámico del panel) y React `cache()` evita repetirla en el mismo render.
 * El admin la invalida con revalidateTag(TAG_CONFIG) al guardar.
 */
// Sin try/catch adentro: un error de la base no debe quedar guardado como precios por defecto.
const leerConfigPublica = unstable_cache(async (): Promise<PublicConfig | null> => {
  const config = await prisma.config.findFirst()
  if (!config) return null
  return {
    precioPlanBasico: config.precioPlanBasico,
    precioPlanEmprendedor: config.precioPlanEmprendedor,
    precioPlanPremium: config.precioPlanPremium,
    descuentoTransferencia: config.descuentoTransferencia,
    smvm: config.smvm,
  }
}, ['public-config'], { tags: [TAG_CONFIG], revalidate: 3600 })

export const getPublicConfig = cache(async (): Promise<PublicConfig> => {
  try {
    return (await leerConfigPublica()) ?? PUBLIC_CONFIG_DEFAULTS
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
