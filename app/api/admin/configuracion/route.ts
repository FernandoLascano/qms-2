import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener configuración
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener la primera (y única) configuración, o crear una por defecto
    let config = await prisma.config.findFirst()

    if (!config) {
      config = await prisma.config.create({
        data: {}
      })
    }

    return NextResponse.json(config)
  } catch (error: any) {
    console.error('Error al obtener configuración:', error)
    return NextResponse.json(
      { error: 'Error al obtener configuración', detalles: error.message },
      { status: 500 }
    )
  }
}

// PUT - Actualizar configuración
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Obtener configuración existente o crear una nueva
    let config = await prisma.config.findFirst()

    if (!config) {
      config = await prisma.config.create({
        data: body
      })
    } else {
      config = await prisma.config.update({
        where: { id: config.id },
        data: {
          notificacionesAutomaticas: body.notificacionesAutomaticas,
          diasAlertaDenominacion: body.diasAlertaDenominacion,
          diasAlertaEstancamiento: body.diasAlertaEstancamiento,
          emailRemitente: body.emailRemitente,
          emailNombreRemitente: body.emailNombreRemitente,
          diasVencimientoReserva: body.diasVencimientoReserva,
          horasLimiteRespuesta: body.horasLimiteRespuesta,
          mercadoPagoEnabled: body.mercadoPagoEnabled,
          precioBaseSAS: body.precioBaseSAS,
          precioPlanBasico: body.precioPlanBasico,
          precioPlanEmprendedor: body.precioPlanEmprendedor,
          precioPlanPremium: body.precioPlanPremium,
          smvm: body.smvm,
          mantenimientoMode: body.mantenimientoMode
        }
      })
    }

    return NextResponse.json(config)
  } catch (error: any) {
    console.error('Error al actualizar configuración:', error)
    return NextResponse.json(
      { error: 'Error al actualizar configuración', detalles: error.message },
      { status: 500 }
    )
  }
}
