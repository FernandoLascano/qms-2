import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugifyPartner, validatePartnerEconomicConfig } from '@/lib/partners'
import { PartnerDiscountType } from '@prisma/client'

function parseBeneficios(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  return String(value)
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

async function ensureAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.rol !== 'ADMIN') return false
  return true
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await ensureAdmin())) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const { id } = await params
    const partner = await prisma.partner.findUnique({
      where: { id },
      include: {
        _count: {
          select: { clicks: true, users: true, conversions: true },
        },
      },
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partner no encontrado' }, { status: 404 })
    }

    return NextResponse.json(partner)
  } catch {
    return NextResponse.json({ error: 'Error al obtener partner' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await ensureAdmin())) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const existing = await prisma.partner.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Partner no encontrado' }, { status: 404 })
    }

    const aplicaDescuento = body.aplicaDescuento !== undefined ? Boolean(body.aplicaDescuento) : existing.aplicaDescuento
    const aplicaComision = body.aplicaComision !== undefined ? Boolean(body.aplicaComision) : existing.aplicaComision
    const descuentoTipo = body.descuentoTipo !== undefined
      ? (body.descuentoTipo ? String(body.descuentoTipo) as PartnerDiscountType : null)
      : existing.descuentoTipo
    const descuentoValor = body.descuentoValor !== undefined
      ? (body.descuentoValor === null ? null : Number(body.descuentoValor))
      : existing.descuentoValor
    const comisionPorcentaje = body.comisionPorcentaje !== undefined
      ? (body.comisionPorcentaje === null ? null : Number(body.comisionPorcentaje))
      : existing.comisionPorcentaje

    const validationError = validatePartnerEconomicConfig({
      aplicaDescuento,
      descuentoTipo,
      descuentoValor,
      aplicaComision,
      comisionPorcentaje,
    })
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const updateData: any = {}
    if (body.nombre !== undefined) updateData.nombre = String(body.nombre).trim()
    if (body.slug !== undefined) updateData.slug = slugifyPartner(String(body.slug))
    if (body.logoUrl !== undefined) updateData.logoUrl = body.logoUrl ? String(body.logoUrl) : null
    if (body.beneficios !== undefined) updateData.beneficios = parseBeneficios(body.beneficios)
    if (body.activo !== undefined) updateData.activo = Boolean(body.activo)
    if (body.condicionesNotas !== undefined) {
      updateData.condicionesNotas = body.condicionesNotas ? String(body.condicionesNotas) : null
    }

    updateData.aplicaDescuento = aplicaDescuento
    updateData.descuentoTipo = aplicaDescuento ? descuentoTipo : null
    updateData.descuentoValor = aplicaDescuento ? descuentoValor : null
    updateData.aplicaComision = aplicaComision
    updateData.comisionPorcentaje = aplicaComision ? comisionPorcentaje : null

    const partner = await prisma.partner.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(partner)
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Slug duplicado' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error al actualizar partner' }, { status: 500 })
  }
}
