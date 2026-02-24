import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
      smvm: config.smvm
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      }
    })
  } catch {

    // En caso de error, retornar valores por defecto
    return NextResponse.json({
      precioPlanBasico: 285000,
      precioPlanEmprendedor: 320000,
      precioPlanPremium: 390000,
      smvm: 317800
    })
  }
}
