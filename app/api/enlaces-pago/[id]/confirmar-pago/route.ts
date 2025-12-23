import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { v2 as cloudinary } from 'cloudinary'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// Verificar si Cloudinary está configurado
const cloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET

console.log('🔍 Verificando Cloudinary:', {
  configured: cloudinaryConfigured,
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'NOT SET',
  api_key: process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET'
})

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim().replace(/['"]/g, ''),
    api_key: process.env.CLOUDINARY_API_KEY?.trim().replace(/['"]/g, ''),
    api_secret: process.env.CLOUDINARY_API_SECRET?.trim().replace(/['"]/g, '')
  })
}

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

    let fileUrl: string

    // Intentar subir a Cloudinary si está configurado
    if (cloudinaryConfigured) {
      console.log('Intentando subir a Cloudinary...')
      try {
        const uploadResult = await new Promise<any>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'qms/comprobantes',
              resource_type: 'auto', // 'auto' detecta el tipo automáticamente
              public_id: `comprobante_${enlace.id}_${Date.now()}`,
              type: 'upload', // 'upload' permite acceso público sin autenticación
              access_mode: 'public' // Hacer accesible públicamente
            },
            (error, result) => {
              if (error) {
                console.error('Error de Cloudinary:', error)
                reject(error)
              } else if (result) {
                console.log('Subido a Cloudinary exitosamente')
                console.log('URL del archivo:', result.secure_url)
                resolve(result)
              } else {
                reject(new Error('No se recibió resultado de Cloudinary'))
              }
            }
          )
          uploadStream.end(buffer)
        })
        fileUrl = uploadResult.secure_url
      } catch (cloudinaryError) {
        console.error('Error al subir a Cloudinary:', cloudinaryError)
        // Fallback a almacenamiento local
        fileUrl = await saveFileLocally(buffer, file.name, enlace.id)
      }
    } else {
      console.log('Cloudinary no configurado, guardando localmente...')
      fileUrl = await saveFileLocally(buffer, file.name, enlace.id)
    }

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

// Función auxiliar para guardar archivo localmente
async function saveFileLocally(buffer: Buffer, originalName: string, enlaceId: string): Promise<string> {
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'comprobantes')
    await mkdir(uploadDir, { recursive: true })
    
    const ext = path.extname(originalName)
    const fileName = `comprobante_${enlaceId}_${Date.now()}${ext}`
    const filePath = path.join(uploadDir, fileName)
    
    await writeFile(filePath, buffer)
    
    console.log('Archivo guardado localmente:', fileName)
    return `/uploads/comprobantes/${fileName}`
  } catch (error) {
    console.error('Error al guardar archivo localmente:', error)
    throw new Error('Error al guardar el comprobante')
  }
}

