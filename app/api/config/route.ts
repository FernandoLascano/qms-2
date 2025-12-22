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

    // Retornar solo los datos públicos
    return NextResponse.json({
      precioPlanEsencial: config.precioPlanEsencial,
      precioPlanProfesional: config.precioPlanProfesional,
      smvm: config.smvm
    })
  } catch (error: any) {
    console.error('Error al obtener configuración pública:', error)

    // En caso de error, retornar valores por defecto
    return NextResponse.json({
      precioPlanEsencial: 85000,
      precioPlanProfesional: 120000,
      smvm: 317800
    })
  }
}
