import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const dateFilter = from || to
      ? {
          gte: from ? new Date(from) : undefined,
          lte: to ? new Date(to) : undefined,
        }
      : undefined

    const [clicks, referredUsers, conversions, totals, referredUsersList, conversionsList] = await Promise.all([
      prisma.referralClick.count({
        where: {
          partnerId: id,
          clickedAt: dateFilter,
        },
      }),
      prisma.user.count({
        where: {
          partnerId: id,
          referredAt: dateFilter,
        },
      }),
      prisma.partnerConversion.count({
        where: {
          partnerId: id,
          convertedAt: dateFilter,
        },
      }),
      prisma.partnerConversion.aggregate({
        where: {
          partnerId: id,
          convertedAt: dateFilter,
        },
        _sum: {
          montoCobrado: true,
          comisionEstimada: true,
        },
        _avg: {
          descuentoValorSnapshot: true,
        },
      }),
      prisma.user.findMany({
        where: {
          partnerId: id,
          referredAt: dateFilter,
        },
        select: {
          id: true,
          name: true,
          email: true,
          referredAt: true,
        },
        orderBy: { referredAt: 'desc' },
        take: 20,
      }),
      prisma.partnerConversion.findMany({
        where: {
          partnerId: id,
          convertedAt: dateFilter,
        },
        select: {
          id: true,
          convertedAt: true,
          montoCobrado: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { convertedAt: 'desc' },
        take: 20,
      }),
    ])

    return NextResponse.json({
      clicks,
      referredUsers,
      conversions,
      conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
      totalCobrado: totals._sum.montoCobrado || 0,
      totalComisionEstimada: totals._sum.comisionEstimada || 0,
      descuentoPromedio: totals._avg.descuentoValorSnapshot || 0,
      referredUsersList,
      conversionsList,
    })
  } catch {
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 })
  }
}
