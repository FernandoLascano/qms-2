import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { enviarEmailNotificacion } from '@/lib/emails/send'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { banco, cbu, alias, titular, montoEsperado } = body

    if (!banco || !cbu || !titular || !montoEsperado) {
      return NextResponse.json(
        { error: 'Faltan datos obligatorios' },
        { status: 400 }
      )
    }

    // Verificar que el trámite existe
    const tramite = await prisma.tramite.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!tramite) {
      return NextResponse.json(
        { error: 'Trámite no encontrado' },
        { status: 404 }
      )
    }

    // Notificar al cliente con los datos bancarios
    const monto = parseFloat(String(montoEsperado))

    const mensajeNotificacion = `Para continuar con tu trámite, debés realizar el depósito del 25% del capital social.\n\n` +
      `Monto a depositar: $${monto.toLocaleString('es-AR')}\n\n` +
      `Datos de la cuenta:\n` +
      `Banco: ${banco}\n` +
      `CBU: ${cbu}\n` +
      `${alias ? `Alias: ${alias}\n` : ''}` +
      `Titular: ${titular}\n\n` +
      `Luego de realizar el depósito, subí el comprobante desde tu panel.`

    await prisma.notificacion.create({
      data: {
        userId: tramite.userId,
        tramiteId: id,
        tipo: 'ACCION_REQUERIDA',
        titulo: 'Datos para Depósito del 25% del Capital',
        mensaje: mensajeNotificacion,
        link: `/dashboard/tramites/${id}#deposito-capital`
      }
    })

    // Enviar email al usuario
    if (tramite.user) {
      try {
        await enviarEmailNotificacion(
          tramite.user.email,
          tramite.user.name || 'Usuario',
          'Datos para Depósito del 25% del Capital',
          mensajeNotificacion,
          id
        )
      } catch (emailError) {
        console.error('Error al enviar email de depósito de capital:', emailError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al guardar cuenta de capital:', error)
    return NextResponse.json(
      { error: 'Error al guardar los datos bancarios' },
      { status: 500 }
    )
  }
}


