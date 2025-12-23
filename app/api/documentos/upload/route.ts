import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadToCloudinary } from '@/lib/cloudinary'

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

    // Convertir el archivo a buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let fileUrl: string

    // Subir a Cloudinary (requerido en producción - Vercel no permite filesystem)
    const uploadResult = await uploadToCloudinary(
      buffer,
      `documentos/${tramiteId}`,
      file.name,
      file.type
    )

    if (!uploadResult?.url) {
      console.error('Error: Cloudinary upload failed')
      return NextResponse.json(
        { error: 'Error al subir el archivo. Por favor intenta de nuevo.' },
        { status: 500 }
      )
    }

    fileUrl = uploadResult.url

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

    // Crear notificación para el usuario
    await prisma.notificacion.create({
      data: {
        userId: session.user.id,
        tramiteId: tramiteId,
        tipo: 'INFO',
        titulo: 'Documento subido',
        mensaje: `Se ha subido el documento "${nombre}". Será revisado por nuestro equipo.`,
        link: `/dashboard/tramites/${tramiteId}`
      }
    })

    // Notificar a los admins según el tipo de documento
    const admins = await prisma.user.findMany({
      where: { rol: 'ADMIN' },
      select: { id: true }
    })

    // Determinar el tipo de notificación según el documento
    let notifTitulo = ''
    let notifMensaje = ''
    let notifLink = ''

    if (nombre?.includes('DEPOSITO_CAPITAL') || tipo === 'COMPROBANTE_DEPOSITO') {
      notifTitulo = 'Comprobante de Depósito Recibido'
      notifMensaje = `El cliente ha subido un comprobante de depósito del 25% del capital. Revisar y aprobar.`
      notifLink = `/dashboard/admin/tramites/${tramiteId}#comprobantes`
    } else if (tipo === 'DOCUMENTO_FIRMADO' || nombre?.toLowerCase().includes('firmado')) {
      notifTitulo = 'Documento Firmado Recibido'
      notifMensaje = `El cliente ha subido el documento firmado "${nombre}". Revisar y aprobar.`
      notifLink = `/dashboard/admin/tramites/${tramiteId}#documentos`
    } else if (tipo === 'DNI_FRENTE' || tipo === 'DNI_DORSO' || tipo === 'CONSTANCIA_CUIL') {
      notifTitulo = 'Documentación Personal Recibida'
      notifMensaje = `El cliente ha subido documentación personal: "${nombre}". Revisar.`
      notifLink = `/dashboard/admin/tramites/${tramiteId}#documentos`
    } else {
      // Cualquier otro documento también debe notificarse al admin
      notifTitulo = 'Nuevo Documento Recibido'
      notifMensaje = `El cliente ha subido un documento: "${nombre}". Revisar.`
      notifLink = `/dashboard/admin/tramites/${tramiteId}#documentos`
    }

    // Crear notificación para todos los admins
    for (const admin of admins) {
      await prisma.notificacion.create({
        data: {
          userId: admin.id,
          tramiteId: tramiteId,
          tipo: 'ACCION_REQUERIDA',
          titulo: notifTitulo,
          mensaje: notifMensaje,
          link: notifLink
        }
      })
    }

    return NextResponse.json({
      success: true,
      documento: {
        id: documento.id,
        nombre: documento.nombre,
        url: documento.url
      }
    })

  } catch (error) {
    console.error('Error al subir documento:', error)
    return NextResponse.json(
      { 
        error: 'Error al subir el documento', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

