import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

// Mismo bucket que los adjuntos recibidos: así la descarga desde el panel
// funciona igual para los dos sentidos.
const S3_BUCKET = 'quieromisas-emails-inbound'

function nombreSeguro(nombre: string): string {
  const base = nombre.split(/[/\\]/).pop() || 'adjunto'
  return base.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^\.+/, '').slice(0, 200) || 'adjunto'
}

/*
 * Guarda una copia de los adjuntos de un mail enviado desde el panel y
 * devuelve los registros para la base. Antes sólo se anotaba el nombre y no
 * había archivo para descargar. Si S3 falla, el mail ya salió: se registra
 * igual, con la clave vieja «outbound-inline/», que la descarga reconoce.
 */
export async function guardarAdjuntosEnviados(
  messageId: string | undefined,
  adjuntos: Array<{ filename: string; content: Buffer; contentType?: string; size: number }>
) {
  const carpeta = messageId || `sin-id-${Date.now()}`
  return Promise.all(
    adjuntos.map(async (item, i) => {
      const mimeType = item.contentType || 'application/octet-stream'
      const s3Key = `sent/${carpeta}/${i}-${nombreSeguro(item.filename)}`
      try {
        await s3.send(new PutObjectCommand({ Bucket: S3_BUCKET, Key: s3Key, Body: item.content, ContentType: mimeType }))
        return { fileName: item.filename, mimeType, size: item.size, s3Key }
      } catch {
        return { fileName: item.filename, mimeType, size: item.size, s3Key: `outbound-inline/${carpeta}/${item.filename}` }
      }
    })
  )
}
