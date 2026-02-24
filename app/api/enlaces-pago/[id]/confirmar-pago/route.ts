import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadToSupabase } from '@/lib/supabase-storage'
import { enviarEmailNotificacion } from '@/lib/emails/send'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Verificar que el enlace existe y pertenece al usuario
    const enlace = await prisma.enlacePago.findFirst({
      where: {
        id,
        tramite: {
          userId: session.user.id
        }
      },
      include: {
        tramite: {
          select: {
            id: true,
            denominacionSocial1: true
          }
        }
      }
    })

    if (!enlace) {
      return NextResponse.json({ error: 'Enlace no encontrado' }, { status: 404 })
    }

    // Obtener el archivo del FormData
    const formData = await req.formData()
    const file = formData.get('comprobante') as File

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó comprobante' }, { status: 400 })
    }

    // Convertir el archivo a buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Subir a Supabase Storage
    const uploadResult = await uploadToSupabase(
      buffer,
      `comprobantes/${enlace.tramiteId}`,
      file.name,
      file.type
    )

    if (!uploadResult?.url) {
      return NextResponse.json(
        { error: 'Error al subir el archivo. Por favor intenta de nuevo.' },
        { status: 500 }
      )
    }

    const fileUrl = uploadResult.url

    // Crear documento con el comprobante
    await prisma.documento.create({
      data: {
        nombre: `Comprobante - ${enlace.concepto}`,
        url: fileUrl,
        tipo: 'COMPROBANTE_DEPOSITO',
        mimeType: file.type,
        tamanio: file.size,
        estado: 'PENDIENTE',
        tramiteId: enlace.tramiteId,
        userId: session.user.id
      }
    })

    // Actualizar el enlace: cambiar a PROCESANDO (esperando validación del admin)
    await prisma.enlacePago.update({
      where: { id },
      data: {
        estado: 'PROCESANDO',
        fechaPago: new Date()
      }
    })

    // Obtener texto legible del concepto
    const conceptoTexto = enlace.concepto === 'TASA_RESERVA_NOMBRE'
      ? 'Tasa de Reserva de Nombre'
      : enlace.concepto === 'TASA_RETRIBUTIVA'
      ? 'Tasa Retributiva'
      : enlace.concepto === 'PUBLICACION_BOLETIN'
      ? 'Publicación en Boletín'
      : enlace.concepto

    // Obtener información del trámite para el email
    const tramite = await prisma.tramite.findUnique({
      where: { id: enlace.tramiteId },
      include: { user: { select: { name: true, email: true } } }
    })

    // Crear notificación para el admin
    const admins = await prisma.user.findMany({
      where: { rol: 'ADMIN' },
      select: { id: true, email: true, name: true }
    })

    for (const admin of admins) {
      await prisma.notificacion.create({
        data: {
          tipo: 'ACCION_REQUERIDA',
          titulo: 'Comprobante de Pago Recibido',
          mensaje: `El cliente ha confirmado el pago de ${conceptoTexto} ($${enlace.monto.toLocaleString('es-AR')}) y adjuntó comprobante. Revisar y aprobar.`,
          userId: admin.id,
          tramiteId: enlace.tramiteId,
          link: `/dashboard/admin/tramites/${enlace.tramiteId}#comprobantes`,
          leida: false
        }
      })

      // Enviar email al admin
      if (admin.email) {
        try {
          const denominacion = tramite?.denominacionAprobada || tramite?.denominacionSocial1 || 'Trámite'
          const clienteNombre = tramite?.user?.name || 'Cliente'
          const mensajeEmail = `El cliente ha confirmado el pago de ${conceptoTexto} ($${enlace.monto.toLocaleString('es-AR')}) y adjuntó comprobante. Revisar y aprobar.\n\nTrámite: ${denominacion}\nCliente: ${clienteNombre}`

          await enviarEmailNotificacion(
            admin.email,
            admin.name || 'Administrador',
            'Comprobante de Pago Recibido',
            mensajeEmail,
            enlace.tramiteId
          )
        } catch {
          // Email no crítico
        }
      }
    }

    // Crear notificación para el cliente
    await prisma.notificacion.create({
      data: {
        tipo: 'EXITO',
        titulo: 'Comprobante recibido',
        mensaje: `Hemos recibido tu comprobante de pago de ${conceptoTexto}. Lo revisaremos pronto.`,
        userId: session.user.id,
        tramiteId: enlace.tramiteId,
        link: `/dashboard/tramites/${enlace.tramiteId}#enlaces-pago`,
        leida: false
      }
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Error al confirmar pago' },
      { status: 500 }
    )
  }
}
