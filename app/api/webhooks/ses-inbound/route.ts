import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { simpleParser } from 'mailparser'
import { sendEmail } from '@/lib/email'

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const S3_BUCKET = 'quieromisas-emails-inbound'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    let message: Record<string, unknown>

    try {
      message = JSON.parse(body)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    // Manejar confirmación de suscripción SNS
    if (message.Type === 'SubscriptionConfirmation') {
      const subscribeUrl = typeof message.SubscribeURL === 'string' ? message.SubscribeURL : ''
      if (subscribeUrl) {
        await fetch(subscribeUrl)
      }
      return NextResponse.json({ status: 'confirmed' })
    }

    // Manejar notificación de email
    if (message.Type === 'Notification') {
      if (typeof message.Message !== 'string') {
        return NextResponse.json({ error: 'Invalid SNS message' }, { status: 400 })
      }
      const snsMessage = JSON.parse(message.Message)
      const sesNotification = snsMessage.receipt || snsMessage

      // Extraer metadata del email
      const mail = snsMessage.mail
      if (!mail) {
        return NextResponse.json({ status: 'no mail data' })
      }

      const messageId = mail.messageId
      if (!messageId) {
        return NextResponse.json({ status: 'no messageId' })
      }

      // Verificar que no sea duplicado
      const existing = await prisma.email.findUnique({
        where: { messageId }
      })
      if (existing) {
        return NextResponse.json({ status: 'duplicate' })
      }

      // Extraer verdicts de spam/virus
      const spamVerdict = sesNotification?.spamVerdict?.status || null
      const virusVerdict = sesNotification?.virusVerdict?.status || null

      // Obtener email crudo de S3
      const s3Key = `emails/${messageId}`
      let bodyText = ''
      let bodyHtml = ''
      let fromAddress = mail.source || ''
      let fromName = ''
      let subject = mail.commonHeaders?.subject || '(Sin asunto)'
      let toAddresses = mail.commonHeaders?.to || mail.destination || []
      let ccAddresses: string[] = []
      let replyTo = mail.commonHeaders?.replyTo?.[0] || null
      const attachmentRecords: { fileName: string; mimeType: string; size: number; s3Key: string }[] = []
      let totalAttachmentsBytes = 0

      try {
        const s3Response = await s3.send(new GetObjectCommand({
          Bucket: S3_BUCKET,
          Key: s3Key,
        }))

        if (s3Response.Body) {
          const rawEmail = await s3Response.Body.transformToByteArray()
          const parsed = await simpleParser(Buffer.from(rawEmail))

          bodyText = parsed.text || ''
          bodyHtml = parsed.html || parsed.textAsHtml || ''
          subject = parsed.subject || subject

          if (parsed.from) {
            fromAddress = parsed.from.value?.[0]?.address || fromAddress
            fromName = parsed.from.value?.[0]?.name || ''
          }

          if (parsed.to) {
            const toValue = Array.isArray(parsed.to) ? parsed.to : [parsed.to]
            toAddresses = toValue.flatMap(t => t.value?.map(v => v.address || '') || [])
          }

          if (parsed.cc) {
            const ccValue = Array.isArray(parsed.cc) ? parsed.cc : [parsed.cc]
            ccAddresses = ccValue.flatMap(c => c.value?.map(v => v.address || '') || [])
          }

          if (parsed.replyTo) {
            replyTo = parsed.replyTo.value?.[0]?.address || replyTo
          }

          // Procesar adjuntos
          if (parsed.attachments && parsed.attachments.length > 0) {
            for (const att of parsed.attachments) {
              const attS3Key = `attachments/${messageId}/${att.filename || 'unnamed'}`

              // Guardar adjunto en S3
              const { PutObjectCommand } = await import('@aws-sdk/client-s3')
              await s3.send(new PutObjectCommand({
                Bucket: S3_BUCKET,
                Key: attS3Key,
                Body: att.content,
                ContentType: att.contentType,
              }))

              attachmentRecords.push({
                fileName: att.filename || 'unnamed',
                mimeType: att.contentType || 'application/octet-stream',
                size: att.size || att.content.length,
                s3Key: attS3Key,
              })
              totalAttachmentsBytes += att.size || att.content.length
            }
          }
        }
      } catch {
        // Si no se puede leer de S3, usar los headers de SES
        bodyText = `Email recibido de ${fromAddress}. No se pudo procesar el contenido completo.`
      }

      // Guardar en base de datos
      const email = await prisma.email.create({
        data: {
          messageId,
          from: fromAddress,
          fromName: fromName || null,
          to: Array.isArray(toAddresses) ? toAddresses : [toAddresses],
          cc: ccAddresses,
          replyTo,
          subject,
          bodyText: bodyText.substring(0, 65000), // Limitar tamaño
          bodyHtml: bodyHtml.substring(0, 200000),
          s3Key,
          direction: 'INBOUND',
          status: 'UNREAD',
          spamVerdict,
          virusVerdict,
          attachments: {
            create: attachmentRecords,
          },
        },
      })

      // Auto-forward a email de trabajo
      try {
        const config = await prisma.config.findFirst()
        const forwardingEnabled = config?.emailForwardingEnabled ?? true
        const forwardingAddress = config?.emailForwardingAddress || 'fernandolascano@martinezwehbe.com'

        if (forwardingEnabled && forwardingAddress) {
          const safeBodyText = bodyText.slice(0, 30000)
          const allowHtmlForward = (bodyHtml?.length || 0) < 120000 && totalAttachmentsBytes < 8 * 1024 * 1024
          const forwardHtml = `
            <div style="background:#f3f4f6;padding:20px;font-family:sans-serif;">
              <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                <div style="background:#1f2937;padding:16px 24px;">
                  <p style="color:white;margin:0;font-size:14px;">📧 Email reenviado desde QuieroMiSAS</p>
                </div>
                <div style="padding:24px;">
                  <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
                    <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">De:</td><td style="padding:8px 0;font-size:13px;"><strong>${fromName || fromAddress}</strong> &lt;${fromAddress}&gt;</td></tr>
                    <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Para:</td><td style="padding:8px 0;font-size:13px;">${Array.isArray(toAddresses) ? toAddresses.join(', ') : toAddresses}</td></tr>
                    <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Asunto:</td><td style="padding:8px 0;font-size:13px;"><strong>${subject}</strong></td></tr>
                    ${attachmentRecords.length > 0 ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Adjuntos:</td><td style="padding:8px 0;font-size:13px;">${attachmentRecords.length} archivo(s), ${(totalAttachmentsBytes / 1024 / 1024).toFixed(2)} MB</td></tr>` : ''}
                  </table>
                  <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">
                  ${allowHtmlForward
                    ? (bodyHtml || `<pre style="white-space:pre-wrap;font-family:sans-serif;">${safeBodyText}</pre>`)
                    : `<p style="font-size:13px;color:#6b7280;">El contenido HTML completo no se incluyó para evitar rebotes por tamaño. Revisalo desde el panel de admin.</p><pre style="white-space:pre-wrap;font-family:sans-serif;">${safeBodyText}</pre>`
                  }
                </div>
              </div>
            </div>
          `

          await sendEmail({
            to: forwardingAddress,
            subject: `[FWD] ${subject} - de ${fromName || fromAddress}`,
            html: forwardHtml,
            text: `Email reenviado\nDe: ${fromName || fromAddress} <${fromAddress}>\nAsunto: ${subject}\nAdjuntos: ${attachmentRecords.length}\n\n${safeBodyText}`,
          })

          await prisma.email.update({
            where: { id: email.id },
            data: { isForwarded: true },
          })
        }
      } catch {
        // Forward failed - non-critical
      }

      return NextResponse.json({ status: 'processed', emailId: email.id })
    }

    return NextResponse.json({ status: 'ignored' })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
