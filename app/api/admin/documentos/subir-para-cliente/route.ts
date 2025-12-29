import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadToSupabase } from '@/lib/supabase-storage'
import { enviarEmailNotificacion } from '@/lib/emails/send'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const tramiteId = formData.get('tramiteId') as string
    const userId = formData.get('userId') as string
    const nombre = formData.get('nombre') as string
    const descripcion = formData.get('descripcion') as string
    const tipo = formData.get('tipo') as string || 'DOCUMENTO_PARA_FIRMAR'

    console.log('📤 Subiendo documento a Cloudinary:', { nombre, tramiteId, userId, fileName: file?.name })

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo' },
        { status: 400 }
      )
    }

    if (!tramiteId || !userId || !nombre) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el trámite existe
    const tramite = await prisma.tramite.findUnique({
      where: { id: tramiteId }
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

    console.log('📁 Tamaño del archivo:', buffer.length, 'bytes')
    console.log('☁️ Subiendo a Supabase Storage...')

    // Subir a Supabase Storage
    const uploadResult = await uploadToSupabase(
      buffer,
      `documentos-admin/${tramiteId}`,
      file.name,
      file.type
    )

    if (!uploadResult?.url) {
      console.error('❌ Error al subir a Supabase Storage')
      return NextResponse.json(
        { error: 'Error al subir el archivo. Por favor intenta de nuevo.' },
        { status: 500 }
      )
    }

    const fileUrl = uploadResult.url
    console.log('✅ Archivo subido a Supabase:', fileUrl)

    // Crear registro en la base de datos
    try {
      await prisma.documento.create({
        data: {
          tramiteId: tramiteId,
          userId: userId,
          nombre: nombre,
          descripcion: descripcion || 'Documento para firmar',
          url: fileUrl,
          tamanio: buffer.length,
          mimeType: file.type || 'application/pdf',
          tipo: tipo as any, // DOCUMENTO_PARA_FIRMAR, ESTATUTO_PARA_FIRMAR, o ACTA_PARA_FIRMAR
          estado: 'PENDIENTE'
        }
      })
      console.log('✅ Documento registrado en BD')
    } catch (error: any) {
      console.error('❌ Error al crear documento en BD:', error)
      return NextResponse.json(
        { error: `Error al registrar documento: ${error.message}` },
        { status: 500 }
      )
    }

    // Notificar al cliente
    const mensajeNotificacion = `Los documentos "${nombre}" están listos. Descargalos, firmalos y subí las versiones firmadas.${descripcion ? ` Instrucciones: ${descripcion}` : ''}`

    try {
      await prisma.notificacion.create({
        data: {
          userId: userId,
          tramiteId: tramiteId,
          tipo: 'ACCION_REQUERIDA',
          titulo: '📄 Documentos Listos para Firmar',
          mensaje: mensajeNotificacion,
          link: `/dashboard/tramites/${tramiteId}#documentos`
        }
      })
      console.log('✅ Notificación enviada')

      // Enviar email al usuario
      const usuario = await prisma.user.findUnique({
        where: { id: userId }
      })
      if (usuario) {
        try {
          await enviarEmailNotificacion(
            usuario.email,
            usuario.name || 'Usuario',
            'Documentos Listos para Firmar',
            mensajeNotificacion,
            tramiteId
          )
          console.log('✅ Email enviado al usuario')
        } catch (emailError) {
          console.error('⚠️ Error al enviar email:', emailError)
        }
      }
    } catch (error: any) {
      console.error('⚠️ Error al crear notificación:', error)
    }

    // Marcar etapa de documentos enviados
    try {
      await prisma.tramite.update({
        where: { id: tramiteId },
        data: {
          documentosRevisados: true
        }
      })
      console.log('✅ Etapa actualizada')
    } catch (error: any) {
      console.error('⚠️ Error al actualizar etapa:', error)
    }

    console.log('🎉 Documento subido exitosamente')

    return NextResponse.json({
      success: true,
      url: fileUrl,
      storagePath: uploadResult.path
    })

  } catch (error: any) {
    console.error('💥 Error general al subir documento:', error)
    return NextResponse.json(
      { error: error.message || 'Error al subir documento' },
      { status: 500 }
    )
  }
}
