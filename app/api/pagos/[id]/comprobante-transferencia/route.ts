import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadToSupabase } from '@/lib/supabase-storage'
import { enviarEmailNotificacion } from '@/lib/emails/send'
import { enSegundoPlano } from '@/lib/en-segundo-plano'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id: pagoId } = await params
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      )
    }

    // Verificar que el pago existe y pertenece al usuario
    const pago = await prisma.pago.findUnique({
      where: { id: pagoId },
      include: {
        tramite: true
      }
    })

    if (!pago) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      )
    }

    if (pago.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'No autorizado para este pago' },
        { status: 403 }
      )
    }

    if (pago.estado === 'APROBADO') {
      return NextResponse.json(
        { error: 'Este pago ya fue aprobado' },
        { status: 400 }
      )
    }

    // Validar tipo y tamaño de archivo
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Máximo 5MB' },
        { status: 400 }
      )
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Solo JPG, PNG o PDF' },
        { status: 400 }
      )
    }

    // Subir archivo a Supabase Storage
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const uploadResult = await uploadToSupabase(
      buffer,
      `comprobantes-transferencia/${pagoId}`,
      file.name,
      file.type
    )

    if (!uploadResult?.url) {
      return NextResponse.json(
        { error: 'Error al subir el archivo' },
        { status: 500 }
      )
    }

    // Crear documento en la base de datos
    const documento = await prisma.documento.create({
      data: {
        tramiteId: pago.tramiteId,
        userId: session.user.id,
        tipo: 'COMPROBANTE_DEPOSITO', // Usar el tipo correcto para que aparezca en ComprobantesReview
        nombre: `Comprobante de Transferencia - Pago ${pagoId.substring(0, 8)}`,
        descripcion: 'Comprobante de transferencia bancaria para pago de honorarios',
        url: uploadResult.url,
        tamanio: file.size,
        mimeType: file.type,
        estado: 'PENDIENTE'
      }
    })

    // Actualizar el pago con el ID del comprobante y método de pago
    await prisma.pago.update({
      where: { id: pagoId },
      data: {
        comprobanteTransferenciaId: documento.id,
        metodoPago: 'TRANSFERENCIA',
        estado: 'PROCESANDO' // Cambiar a procesando mientras se valida
      }
    })

    // Datos para los avisos: el trámite (con cliente) y los admins, en paralelo.
    const [tramite, admins] = await Promise.all([
      prisma.tramite.findUnique({
        where: { id: pago.tramiteId },
        select: { denominacionAprobada: true, denominacionSocial1: true, user: { select: { name: true } } }
      }),
      prisma.user.findMany({
        where: { rol: 'ADMIN' },
        select: { id: true, email: true, name: true }
      })
    ])

    const mensajeAdmin = `El cliente ha subido un comprobante de transferencia para el pago de honorarios ($${pago.monto.toLocaleString('es-AR')}). Revisa y valida el pago.`

    // Notificaciones en la base (admins + cliente) en un solo insert.
    await prisma.notificacion.createMany({
      data: [
        ...admins.map(admin => ({
          userId: admin.id,
          tramiteId: pago.tramiteId,
          tipo: 'ACCION_REQUERIDA' as const,
          titulo: 'Comprobante de Transferencia Recibido',
          mensaje: mensajeAdmin,
          link: `/dashboard/admin/tramites/${pago.tramiteId}?tab=pagos`
        })),
        {
          userId: session.user.id,
          tramiteId: pago.tramiteId,
          tipo: 'EXITO' as const,
          titulo: 'Comprobante Subido Correctamente',
          mensaje: 'Tu comprobante de transferencia fue recibido. El administrador lo revisará y validará el pago.',
          link: `/dashboard/tramites/${pago.tramiteId}`
        }
      ]
    })

    // Emails a los admins después de responder.
    const denominacion = tramite?.denominacionAprobada || tramite?.denominacionSocial1 || 'Trámite'
    const clienteNombre = tramite?.user?.name || 'Cliente'
    const mensajeEmail = `${mensajeAdmin}\n\nTrámite: ${denominacion}\nCliente: ${clienteNombre}`
    enSegundoPlano(
      'pagos/comprobante-transferencia',
      ...admins
        .filter(admin => admin.email)
        .map(admin => () =>
          enviarEmailNotificacion(
            admin.email,
            admin.name || 'Administrador',
            'Comprobante de Transferencia Recibido',
            mensajeEmail,
            pago.tramiteId,
            { paraAdmin: true, tono: 'accion', cta: { texto: 'Revisar el comprobante', tab: 'pagos' } }
          )
        )
    )

    return NextResponse.json({ 
      success: true,
      documentoId: documento.id
    })

  } catch {
    return NextResponse.json(
      { error: 'Error al subir comprobante' },
      { status: 500 }
    )
  }
}

