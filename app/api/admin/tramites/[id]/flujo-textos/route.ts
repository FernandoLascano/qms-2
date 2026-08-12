import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// PATCH - Guarda textos del flujo (instrucciones de firma, observaciones del organismo)
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const updateData: { instruccionesFirma?: string | null; observacionesOrganismo?: string | null } = {}

    if (typeof body.instruccionesFirma === 'string') {
      updateData.instruccionesFirma = body.instruccionesFirma.trim() || null
    }
    if (typeof body.observacionesOrganismo === 'string') {
      updateData.observacionesOrganismo = body.observacionesOrganismo.trim() || null
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No hay datos para actualizar' }, { status: 400 })
    }

    await prisma.tramite.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error al guardar los textos del flujo' }, { status: 500 })
  }
}
