import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

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

    // Intentar subir a Cloudinary primero (si está configurado)
    try {
      const uploadResult = await uploadToCloudinary(
        buffer,
        `documentos/${tramiteId}`,
        file.name,
        file.type
      )
      
      if (uploadResult?.url) {
        fileUrl = uploadResult.url
      } else {
        throw new Error('Cloudinary upload failed')
      }
    } catch (error) {
      // Fallback a almacenamiento local si Cloudinary falla
      console.log('Cloudinary no disponible, usando almacenamiento local')
      
      // Crear directorio si no existe
      const uploadDir = join(process.cwd(), 'public', 'uploads', tramiteId)
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true })
      }

      // Generar nombre único para el archivo
      const timestamp = Date.now()
      const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const filePath = join(uploadDir, fileName)

      // Guardar archivo
      await writeFile(filePath, buffer)

      // URL pública del archivo
      fileUrl = `/uploads/${tramiteId}/${fileName}`
    }

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

    // Crear notificación
    await prisma.notificacion.create({
      data: {
        userId: session.user.id,
        tramiteId: tramiteId,
        tipo: 'INFO',
        titulo: 'Documento subido',
        mensaje: `Se ha subido el documento "${nombre}". Será revisado por nuestro equipo.`
      }
    })

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

