import { PartnerDiscountType } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export interface PartnerEconomicInput {
  aplicaDescuento?: boolean
  descuentoTipo?: PartnerDiscountType | null
  descuentoValor?: number | null
  aplicaComision?: boolean
  comisionPorcentaje?: number | null
}

export function slugifyPartner(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function validatePartnerEconomicConfig(input: PartnerEconomicInput): string | null {
  const aplicaDescuento = Boolean(input.aplicaDescuento)
  const aplicaComision = Boolean(input.aplicaComision)
  const descuentoValor = input.descuentoValor ?? null
  const comisionPorcentaje = input.comisionPorcentaje ?? null

  if (!aplicaDescuento && !aplicaComision) {
    return 'Debes activar al menos una condición económica (descuento o comisión).'
  }

  if (aplicaDescuento) {
    if (!input.descuentoTipo) return 'Debes seleccionar el tipo de descuento.'
    if (descuentoValor === null || Number.isNaN(descuentoValor) || descuentoValor <= 0) {
      return 'El valor de descuento debe ser mayor a 0.'
    }
    if (input.descuentoTipo === PartnerDiscountType.PORCENTAJE && descuentoValor > 100) {
      return 'El descuento porcentual no puede ser mayor a 100.'
    }
  }

  if (aplicaComision) {
    if (comisionPorcentaje === null || Number.isNaN(comisionPorcentaje) || comisionPorcentaje <= 0) {
      return 'El porcentaje de comisión debe ser mayor a 0.'
    }
    if (comisionPorcentaje > 100) {
      return 'El porcentaje de comisión no puede ser mayor a 100.'
    }
  }

  return null
}

export async function registerPartnerConversion(params: {
  userId: string
  montoCobrado: number
  metodoPago?: string | null
  sourceType: 'PAGO' | 'ENLACE_PAGO'
  sourceId?: string | null
  pagoId?: string | null
}) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { id: true, partnerId: true },
  })

  if (!user?.partnerId) return { created: false, reason: 'USER_WITHOUT_PARTNER' as const }

  const existing = await prisma.partnerConversion.findUnique({
    where: { userId: params.userId },
    select: { id: true },
  })

  if (existing) return { created: false, reason: 'ALREADY_CONVERTED' as const }

  const partner = await prisma.partner.findUnique({
    where: { id: user.partnerId },
    select: {
      id: true,
      aplicaDescuento: true,
      descuentoTipo: true,
      descuentoValor: true,
      aplicaComision: true,
      comisionPorcentaje: true,
    },
  })

  if (!partner) return { created: false, reason: 'PARTNER_NOT_FOUND' as const }

  const comisionEstimada = partner.aplicaComision && partner.comisionPorcentaje
    ? (params.montoCobrado * partner.comisionPorcentaje) / 100
    : null

  try {
    await prisma.partnerConversion.create({
      data: {
        partnerId: partner.id,
        userId: params.userId,
        pagoId: params.pagoId ?? null,
        montoCobrado: params.montoCobrado,
        metodoPago: params.metodoPago ?? null,
        sourceType: params.sourceType,
        sourceId: params.sourceId ?? null,
        descuentoAplicado: partner.aplicaDescuento,
        descuentoTipoSnapshot: partner.descuentoTipo,
        descuentoValorSnapshot: partner.descuentoValor,
        comisionAplicada: partner.aplicaComision,
        comisionPorcentajeSnapshot: partner.comisionPorcentaje,
        comisionEstimada,
      },
    })
    return { created: true as const }
  } catch {
    return { created: false, reason: 'CREATE_FAILED' as const }
  }
}
