import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener un trámite específico
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Buscar el trámite - solo si pertenece al usuario
    const tramite = await prisma.tramite.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    })
    
    // Log para debugging
    if (tramite) {
      console.log('Trámite encontrado:', {
        id: tramite.id,
        tieneDatosUsuario: !!tramite.datosUsuario,
        plan: tramite.plan,
        jurisdiccion: tramite.jurisdiccion,
        denominacion1: tramite.denominacionSocial1,
        formularioCompleto: tramite.formularioCompleto,
        estadoGeneral: tramite.estadoGeneral
      })
    }

    if (!tramite) {
      return NextResponse.json(
        { error: 'Trámite no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ tramite })

  } catch (error) {
    console.error('Error al obtener trámite:', error)
    return NextResponse.json(
      { error: 'Error al obtener trámite' },
      { status: 500 }
    )
  }
}

