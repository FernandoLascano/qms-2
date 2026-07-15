import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PUBLIC_CONFIG_DEFAULTS } from '@/lib/config'

// GET - Obtener configuración pública (precios, SMVM)
export async function GET(request: NextRequest) {
  try {
    // Obtener la configuración
    let config = await prisma.config.findFirst()

    if (!config) {
      // Si no existe configuración, crear una con valores por defecto
      config = await prisma.config.create({
        data: {}
      })
    }

    // Retornar solo los datos públicos con cache
    return NextResponse.json({
      precioPlanBasico: config.precioPlanBasico,
      precioPlanEmprendedor: config.precioPlanEmprendedor,
      precioPlanPremium: config.precioPlanPremium,
      descuentoTransferencia: config.descuentoTransferencia,
      smvm: config.smvm
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      }
    })
  } catch {

    // En caso de error, retornar valores por defecto
    return NextResponse.json(PUBLIC_CONFIG_DEFAULTS)
  }
}
