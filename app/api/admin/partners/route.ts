import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugifyPartner, validatePartnerEconomicConfig } from '@/lib/partners'
import { PartnerDiscountType } from '@prisma/client'
import { partnerCreateBodySchema } from '@/lib/schemas/partner'

function parseBeneficios(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  return String(value)
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const partners = await prisma.partner.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            clicks: true,
            users: true,
            conversions: true,
          },
        },
      },
    })

    return NextResponse.json(
      partners.map((partner) => ({
        ...partner,
        conversionRate: partner._count.clicks > 0
          ? (partner._count.conversions / partner._count.clicks) * 100
          : 0,
      }))
    )
  } catch {
    return NextResponse.json({ error: 'Error al obtener partners' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const raw = await request.json()
    const parsed = partnerCreateBodySchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const body = parsed.data

    const nombre = body.nombre
    const slugRaw = (body.slug || nombre).trim()
    const slug = slugifyPartner(slugRaw)

    if (!slug) {
      return NextResponse.json({ error: 'Slug inválido.' }, { status: 400 })
    }

    const aplicaDescuento = Boolean(body.aplicaDescuento)
    const aplicaComision = Boolean(body.aplicaComision)
    const descuentoTipo = body.descuentoTipo ?? null
    const descuentoValor = body.descuentoValor ?? null
    const comisionPorcentaje = body.comisionPorcentaje ?? null

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

    const beneficios = parseBeneficios(body.beneficios)

    const partner = await prisma.partner.create({
      data: {
        nombre,
        slug,
        logoUrl: body.logoUrl ?? null,
        beneficios,
        activo: body.activo === undefined ? true : Boolean(body.activo),
        aplicaDescuento,
        descuentoTipo: aplicaDescuento ? descuentoTipo : null,
        descuentoValor: aplicaDescuento ? descuentoValor : null,
        aplicaComision,
        comisionPorcentaje: aplicaComision ? comisionPorcentaje : null,
        condicionesNotas: body.condicionesNotas ? String(body.condicionesNotas) : null,
      },
    })

    return NextResponse.json(partner, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe un partner con ese slug.' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error al crear partner' }, { status: 500 })
  }
}
