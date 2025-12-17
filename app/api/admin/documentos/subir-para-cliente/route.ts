import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import cloudinary from '@/lib/cloudinary'

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

    // Convertir el archivo a base64 para Cloudinary
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64File = `data:${file.type};base64,${buffer.toString('base64')}`

    console.log('📁 Tamaño del archivo:', buffer.length, 'bytes')
    console.log('☁️ Subiendo a Cloudinary...')

    // Subir a Cloudinary
    let uploadResult
    try {
      uploadResult = await cloudinary.uploader.upload(base64File, {
        folder: 'qms-documentos',
        resource_type: 'auto',
        public_id: `${tramiteId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      })
      console.log('✅ Archivo subido a Cloudinary:', uploadResult.secure_url)
    } catch (error: any) {
      console.error('❌ Error al subir a Cloudinary:', error)
      return NextResponse.json(
        { error: `Error al subir a Cloudinary: ${error.message}` },
        { status: 500 }
      )
    }

    // URL pública del archivo
    const fileUrl = uploadResult.secure_url

    console.log('🔗 URL pública:', fileUrl)

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
    try {
      await prisma.notificacion.create({
        data: {
          userId: userId,
          tramiteId: tramiteId,
          tipo: 'ACCION_REQUERIDA',
          titulo: '📄 Documentos Listos para Firmar',
          mensaje: `Los documentos "${nombre}" están listos. Descargalos, firmalos y subí las versiones firmadas. ${descripcion ? `Instrucciones: ${descripcion}` : ''}`
        }
      })
      console.log('✅ Notificación enviada')
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
      cloudinaryId: uploadResult.public_id
    })

  } catch (error: any) {
    console.error('💥 Error general al subir documento:', error)
    return NextResponse.json(
      { error: error.message || 'Error al subir documento' },
      { status: 500 }
    )
  }
}
