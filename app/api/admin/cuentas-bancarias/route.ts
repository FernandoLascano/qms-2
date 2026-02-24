import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Obtener todas las cuentas bancarias pre-configuradas
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener cuentas bancarias desde ConfiguracionSistema
    const configuracion = await prisma.configuracionSistema.findUnique({
      where: { clave: 'CUENTAS_BANCARIAS' }
    })

    if (!configuracion) {
      return NextResponse.json({ cuentas: [] })
    }

    const cuentas = JSON.parse(configuracion.valor || '[]')
    return NextResponse.json({ cuentas })

  } catch {
    return NextResponse.json(
      { error: 'Error al obtener cuentas bancarias' },
      { status: 500 }
    )
  }
}

// Guardar o actualizar cuentas bancarias pre-configuradas
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { cuentas } = await request.json()

    // Guardar en ConfiguracionSistema
    await prisma.configuracionSistema.upsert({
      where: { clave: 'CUENTAS_BANCARIAS' },
      update: {
        valor: JSON.stringify(cuentas),
        descripcion: 'Cuentas bancarias pre-configuradas para transferencias'
      },
      create: {
        clave: 'CUENTAS_BANCARIAS',
        valor: JSON.stringify(cuentas),
        descripcion: 'Cuentas bancarias pre-configuradas para transferencias'
      }
    })

    return NextResponse.json({ success: true })

  } catch {
    return NextResponse.json(
      { error: 'Error al guardar cuentas bancarias' },
      { status: 500 }
    )
  }
}

