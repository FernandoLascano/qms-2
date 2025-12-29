import { v2 as cloudinary } from 'cloudinary'

// Configuración de Cloudinary
const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.replace(/['"]/g, '') || ''
const apiKey = process.env.CLOUDINARY_API_KEY?.replace(/['"]/g, '') || ''
const apiSecret = process.env.CLOUDINARY_API_SECRET?.replace(/['"]/g, '') || ''

console.log('🔧 Configurando Cloudinary:', {
  cloud_name: cloudName,
  api_key: apiKey ? '***' + apiKey.slice(-4) : 'NO CONFIGURADO',
  api_secret: apiSecret ? '***' : 'NO CONFIGURADO'
})

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
})

// Función helper para subir archivos a Cloudinary
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  fileName: string,
  mimeType: string
): Promise<{ url: string; public_id: string } | null> {
  try {
    return new Promise((resolve, reject) => {
      // Limpiar el nombre del archivo
      const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
      const publicId = `${Date.now()}-${cleanFileName}`

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'auto',
          public_id: publicId,
          type: 'upload', // 'upload' permite acceso público sin autenticación
          access_mode: 'public' // Asegurar que sea público para poder visualizarlo
        },
        (error, result) => {
          if (error) {
            console.error('Error al subir a Cloudinary:', error)
            reject(error)
            return
          }
          if (result) {
            resolve({
              url: result.secure_url,
              public_id: result.public_id
            })
          } else {
            reject(new Error('No se recibió resultado de Cloudinary'))
          }
        }
      )
      uploadStream.end(buffer)
    })
  } catch (error) {
    console.error('Error en uploadToCloudinary:', error)
    return null
  }
}

// Función para generar una signed URL para acceso a archivos privados
export function getSignedUrl(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'raw'): string {
  try {
    // Generar URL firmada con expiración de 1 hora
    const signedUrl = cloudinary.url(publicId, {
      resource_type: resourceType,
      type: 'upload',
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hora
    })
    return signedUrl
  } catch (error) {
    console.error('Error generando signed URL:', error)
    return ''
  }
}

// Función para extraer el public_id de una URL de Cloudinary
export function extractPublicIdFromUrl(url: string): { publicId: string; resourceType: 'image' | 'video' | 'raw' } | null {
  try {
    // URL típica: https://res.cloudinary.com/cloud/image|raw/upload/v123/folder/file.ext
    const match = url.match(/cloudinary\.com\/[^/]+\/(image|video|raw)\/upload\/(?:v\d+\/)?(.+)$/)
    if (match) {
      let resourceType = match[1] as 'image' | 'video' | 'raw'
      let publicId = match[2]

      // Determinar si es raw basándonos en la extensión
      const extension = publicId.split('.').pop()?.toLowerCase()
      if (extension && ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'zip'].includes(extension)) {
        resourceType = 'raw'
      }

      return { publicId, resourceType }
    }
    return null
  } catch (error) {
    console.error('Error extrayendo public_id:', error)
    return null
  }
}

export default cloudinary
