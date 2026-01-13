import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id: tramiteId } = await params

    // Verificar que el trámite pertenece al usuario
    const tramite = await prisma.tramite.findFirst({
      where: {
        id: tramiteId,
        userId: session.user.id
      }
    })

    if (!tramite) {
      return NextResponse.json(
        { error: 'Trámite no encontrado' },
        { status: 404 }
      )
    }

    // Obtener la cuenta bancaria para depósito de capital
    const cuenta = await prisma.cuentaBancaria.findUnique({
      where: {
        id: `${tramiteId}_DEPOSITO_CAPITAL`
      }
    })

    if (!cuenta) {
      return NextResponse.json({ cuenta: null })
    }

    return NextResponse.json({
      cuenta: {
        banco: cuenta.banco,
        cbu: cuenta.cbu,
        alias: cuenta.alias,
        titular: cuenta.titular,
        montoEsperado: cuenta.montoEsperado,
        fechaInformacion: cuenta.fechaInformacion
      }
    })
  } catch (error) {
    console.error('Error al obtener cuenta de capital:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

