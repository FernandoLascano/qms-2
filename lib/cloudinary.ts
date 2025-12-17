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
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'auto',
          public_id: `${folder}/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`
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

export default cloudinary
