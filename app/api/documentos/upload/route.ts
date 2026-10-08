import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadToSupabase } from '@/lib/supabase-storage'
import { enviarEmailNotificacion } from '@/lib/emails/send'
import { enSegundoPlano } from '@/lib/en-segundo-plano'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const tramiteId = formData.get('tramiteId') as string
    const tipo = formData.get('tipo') as string
    const nombre = formData.get('nombre') as string
    const descripcion = formData.get('descripcion') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      )
    }

    // Validar tipo MIME (allow-list) y tamaño del archivo
    const ALLOWED_MIME_TYPES = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
    ]
    const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15 MB

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Solo PDF o imágenes (JPG, PNG, WEBP).' },
        { status: 400 }
      )
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'El archivo supera el tamaño máximo permitido (15 MB).' },
        { status: 400 }
      )
    }

    // Verificar que el trámite pertenece al usuario y obtener información para emails
    const tramite = await prisma.tramite.findFirst({
      where: {
        id: tramiteId,
        userId: session.user.id
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!tramite) {
      return NextResponse.json(
        { error: 'Trámite no encontrado' },
        { status: 404 }
      )
    }

    // Convertir el archivo a buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Subir a Supabase Storage
    const uploadResult = await uploadToSupabase(
      buffer,
      `documentos/${tramiteId}`,
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

    // Guardar en base de datos
    const documento = await prisma.documento.create({
      data: {
        tramiteId: tramiteId,
        userId: session.user.id,
        tipo: tipo as any,
        nombre: nombre,
        descripcion: descripcion || null,
        url: fileUrl,
        tamanio: file.size,
        mimeType: file.type,
        estado: 'PENDIENTE'
      }
    })

    // Determinar el tipo de notificación según el documento
    let notifTitulo = ''
    let notifMensaje = ''
    let notifLink = ''

    if (nombre?.includes('DEPOSITO_CAPITAL') || tipo === 'COMPROBANTE_DEPOSITO') {
      notifTitulo = 'Comprobante de Depósito Recibido'
      notifMensaje = `El cliente ha subido un comprobante de depósito del 25% del capital. Revisar y aprobar.`
      notifLink = `/dashboard/admin/tramites/${tramiteId}?tab=pagos`
    } else if (tipo === 'DOCUMENTO_FIRMADO' || nombre?.toLowerCase().includes('firmado')) {
      notifTitulo = 'Documento Firmado Recibido'
      notifMensaje = `El cliente ha subido el documento firmado "${nombre}". Revisar y aprobar.`
      notifLink = `/dashboard/admin/tramites/${tramiteId}?tab=documentos`
    } else if (tipo === 'DNI_FRENTE' || tipo === 'DNI_DORSO' || tipo === 'CONSTANCIA_CUIL') {
      notifTitulo = 'Documentación Personal Recibida'
      notifMensaje = `El cliente ha subido documentación personal: "${nombre}". Revisar.`
      notifLink = `/dashboard/admin/tramites/${tramiteId}?tab=documentos`
    } else {
      // Cualquier otro documento también debe notificarse al admin
      notifTitulo = 'Nuevo Documento Recibido'
      notifMensaje = `El cliente ha subido un documento: "${nombre}". Revisar.`
      notifLink = `/dashboard/admin/tramites/${tramiteId}?tab=documentos`
    }

    const admins = await prisma.user.findMany({
      where: { rol: 'ADMIN' },
      select: { id: true, email: true, name: true }
    })

    // Notificaciones en la base (rápidas) en un solo insert: la del cliente y
    // una por admin. Antes iban de a una, con un findUnique por admin.
    await prisma.notificacion.createMany({
      data: [
        {
          userId: session.user.id,
          tramiteId: tramiteId,
          tipo: 'INFO' as const,
          titulo: 'Documento subido',
          mensaje: `Se ha subido el documento "${nombre}". Será revisado por nuestro equipo.`,
          link: `/dashboard/tramites/${tramiteId}`
        },
        ...admins.map(admin => ({
          userId: admin.id,
          tramiteId: tramiteId,
          tipo: 'ACCION_REQUERIDA' as const,
          titulo: notifTitulo,
          mensaje: notifMensaje,
          link: notifLink
        }))
      ]
    })

    // Emails a los admins después de responder (dentro del request sumaban
    // varios segundos a cada subida).
    const denominacion = tramite.denominacionAprobada || tramite.denominacionSocial1 || 'Trámite'
    const clienteNombre = tramite.user?.name || 'Cliente'
    const mensajeEmail = `${notifMensaje}\n\nTrámite: ${denominacion}\nCliente: ${clienteNombre}`
    enSegundoPlano(
      'documentos/upload',
      ...admins
        .filter(admin => admin.email)
        .map(admin => () =>
          enviarEmailNotificacion(
            admin.email,
            admin.name || 'Administrador',
            notifTitulo,
            mensajeEmail,
            tramiteId,
            { paraAdmin: true, tono: 'accion', cta: { texto: 'Revisar en el panel', tab: notifLink.includes('tab=pagos') ? 'pagos' : 'documentos' } }
          )
        )
    )

    return NextResponse.json({
      success: true,
      documento: {
        id: documento.id,
        nombre: documento.nombre,
        url: documento.url
      }
    })

  } catch {
    return NextResponse.json(
      { error: 'Error al subir el documento' },
      { status: 500 }
    )
  }
}

