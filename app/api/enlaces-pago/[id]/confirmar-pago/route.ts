import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadToSupabase } from '@/lib/supabase-storage'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== CONFIRMAR PAGO - INICIO ===')

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.error('No hay sesión de usuario')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    console.log('Usuario:', session.user.email)

    const { id } = await params
    console.log('Enlace ID:', id)

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
      console.error('Enlace no encontrado')
      return NextResponse.json({ error: 'Enlace no encontrado' }, { status: 404 })
    }

    console.log('Enlace encontrado:', enlace.concepto)

    // Obtener el archivo del FormData
    const formData = await req.formData()
    const file = formData.get('comprobante') as File

    if (!file) {
      console.error('No se proporcionó archivo')
      return NextResponse.json({ error: 'No se proporcionó comprobante' }, { status: 400 })
    }

    console.log('Archivo recibido:', file.name, 'Tamaño:', file.size)

    // Convertir el archivo a buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Subir a Supabase Storage
    console.log('Subiendo a Supabase Storage...')
    const uploadResult = await uploadToSupabase(
      buffer,
      `comprobantes/${enlace.tramiteId}`,
      file.name,
      file.type
    )

    if (!uploadResult?.url) {
      console.error('Error: Supabase upload failed')
      return NextResponse.json(
        { error: 'Error al subir el archivo. Por favor intenta de nuevo.' },
        { status: 500 }
      )
    }

    const fileUrl = uploadResult.url
    console.log('Archivo subido a Supabase:', fileUrl)

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

    // Crear notificación para el admin
    const admins = await prisma.user.findMany({
      where: { rol: 'ADMIN' },
      select: { id: true }
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

    console.log('=== CONFIRMAR PAGO - ÉXITO ===')
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('=== ERROR AL CONFIRMAR PAGO ===')
    console.error('Error:', error)
    console.error('Stack:', error.stack)
    return NextResponse.json(
      { error: error.message || 'Error al confirmar pago' },
      { status: 500 }
    )
  }
}
