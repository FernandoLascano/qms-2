import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const S3_BUCKET = 'quieromisas-emails-inbound'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attachmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { attachmentId } = await params
    const attachment = await prisma.emailAttachment.findUnique({
      where: { id: attachmentId },
    })

    if (!attachment) {
      return NextResponse.json({ error: 'Adjunto no encontrado' }, { status: 404 })
    }

    if (attachment.s3Key.startsWith('outbound-inline/')) {
      return NextResponse.json({ error: 'El adjunto no está disponible para descarga directa' }, { status: 400 })
    }

    const object = await s3.send(new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: attachment.s3Key,
    }))

    if (!object.Body) {
      return NextResponse.json({ error: 'Archivo vacío' }, { status: 404 })
    }

    return new NextResponse(object.Body.transformToWebStream() as ReadableStream, {
      headers: {
        'Content-Type': attachment.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(attachment.fileName)}"`,
        'Cache-Control': 'private, max-age=60',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
