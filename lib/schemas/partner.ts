import { z } from 'zod'
import { PartnerDiscountType } from '@prisma/client'

export const partnerCreateBodySchema = z.object({
  nombre: z.string().trim().min(1).max(200),
  slug: z.string().trim().max(200).optional(),
  logoUrl: z.string().max(2000).optional().nullable(),
  beneficios: z.union([z.string(), z.array(z.string())]).optional(),
  activo: z.boolean().optional(),
  aplicaDescuento: z.boolean().optional(),
  descuentoTipo: z.nativeEnum(PartnerDiscountType).optional().nullable(),
  descuentoValor: z.number().finite().optional().nullable(),
  aplicaComision: z.boolean().optional(),
  comisionPorcentaje: z.number().finite().optional().nullable(),
  condicionesNotas: z.string().max(20_000).optional().nullable(),
})
