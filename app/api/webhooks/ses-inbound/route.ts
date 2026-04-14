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

/** Forma mínima del objeto `mail` en notificaciones SES (JSON en SNS). */
type SesInboundMail = {
  messageId?: unknown
  source?: string
  destination?: string[]
  commonHeaders?: {
    subject?: string
    to?: string[] | string
    replyTo?: string[]
  }
}

/**
 * SES + acción "Publicar en SNS" en la regla de recepción: el aviso incluye el correo y
 * AWS limita ~150 KB; mensajes mayores rebotan con "Message length exceeds limit set by recipient".
 * Solución en AWS: dejar solo acción S3 en la regla y disparar el mismo topic SNS desde
 * notificaciones de eventos del bucket (objeto creado bajo emails/) — payload chico.
 * @see https://docs.aws.amazon.com/ses/latest/dg/receiving-email-action-sns.html
 */

/** Procesar MIME + S3 puede acercarse al límite por defecto de Vercel (10s en Hobby). */
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    // Buscar en Vercel Logs: WEBHOOK_SES_INBOUND (si no aparece, SNS no está pegándole a esta URL)
    console.log('[WEBHOOK_SES_INBOUND] POST recibido')

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
      const startedAt = Date.now()

      if (typeof message.Message !== 'string') {
        return NextResponse.json({ error: 'Invalid SNS message' }, { status: 400 })
      }
      const snsMessage = JSON.parse(message.Message) as Record<string, unknown>

      // Evento S3 -> SNS (recomendado para adjuntos grandes; evita límite ~150KB de SES+SNS)
      let effectiveSnsMessage: Record<string, unknown> = snsMessage
      if (
        Array.isArray(snsMessage.Records) &&
        (snsMessage.Records[0] as { eventSource?: string })?.eventSource === 'aws:s3'
      ) {
        const rec = snsMessage.Records[0] as {
          eventName?: string
          s3?: { bucket?: { name?: string }; object?: { key?: string } }
        }
        const bucket = rec.s3?.bucket?.name
        const rawKey = rec.s3?.object?.key
        if (!bucket || !rawKey) {
          return NextResponse.json({ error: 'S3 event inválido' }, { status: 400 })
        }
        if (bucket !== S3_BUCKET) {
          return NextResponse.json({ status: 'ignored_wrong_bucket' })
        }
        const key = decodeURIComponent(String(rawKey).replace(/\+/g, ' '))
        if (!key.startsWith('emails/')) {
          return NextResponse.json({ status: 'ignored_not_inbound_prefix' })
        }
        const extractedId = key.slice('emails/'.length)
        if (!extractedId) {
          return NextResponse.json({ error: 'messageId vacío' }, { status: 400 })
        }
        const eventName = rec.eventName || ''
        if (!String(eventName).startsWith('ObjectCreated')) {
          return NextResponse.json({ status: 'ignored_not_object_created' })
        }
        console.log('[WEBHOOK_SES_INBOUND] Origen: evento S3 (adjuntos grandes OK)')
        effectiveSnsMessage = {
          mail: {
            messageId: extractedId,
            source: '',
            destination: [],
            commonHeaders: {},
          },
          receipt: {},
        }
      }

      const sesNotification = (effectiveSnsMessage.receipt || effectiveSnsMessage) as Record<
        string,
        unknown
      >

      // Extraer metadata del email
      const mail = effectiveSnsMessage.mail as SesInboundMail | undefined
      if (!mail) {
        return NextResponse.json({ status: 'no mail data' })
      }

      const rawId = mail.messageId
      if (typeof rawId !== 'string' || !rawId) {
        return NextResponse.json({ status: 'no messageId' })
      }
      const messageId = rawId

      // Verificar que no sea duplicado
      const existing = await prisma.email.findUnique({
        where: { messageId }
      })
      if (existing) {
        return NextResponse.json({ status: 'duplicate' })
      }

      // Extraer verdicts de spam/virus
      const spamVerdict =
        (sesNotification?.spamVerdict as { status?: string } | undefined)?.status ?? null
      const virusVerdict =
        (sesNotification?.virusVerdict as { status?: string } | undefined)?.status ?? null

      // Obtener email crudo de S3
      const s3Key = `emails/${messageId}`
      let bodyText = ''
      let bodyHtml = ''
      let fromAddress = mail.source || ''
      let fromName = ''
      let subject = mail.commonHeaders?.subject || '(Sin asunto)'
      const headerTo = mail.commonHeaders?.to
      let toAddresses =
        (Array.isArray(headerTo) ? headerTo : headerTo ? [headerTo] : null) ||
        mail.destination ||
        []
      let ccAddresses: string[] = []
      let replyTo = mail.commonHeaders?.replyTo?.[0] || null
      const attachmentRecords: { fileName: string; mimeType: string; size: number; s3Key: string }[] = []
      let totalAttachmentsBytes = 0
      const sourceLower = String(mail.source || '').toLowerCase()
      let parsedFromS3 = false
      let rawBytes = 0

      try {
        const s3Response = await s3.send(new GetObjectCommand({
          Bucket: S3_BUCKET,
          Key: s3Key,
        }))

        if (s3Response.Body) {
          const rawEmail = await s3Response.Body.transformToByteArray()
          rawBytes = rawEmail.byteLength
          const parsed = await simpleParser(Buffer.from(rawEmail))
          parsedFromS3 = true

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

      const logInboundDone = (outcome: string) => {
        console.log(
          JSON.stringify({
            event: 'ses-inbound-done',
            outcome,
            messageId,
            rawBytes,
            attachmentCount: attachmentRecords.length,
            parsedFromS3,
            ms: Date.now() - startedAt,
          })
        )
      }

      // Auto-forward a email de trabajo
      try {
        const config = await prisma.config.findFirst()
        const forwardingEnabled = config?.emailForwardingEnabled ?? false
        const forwardingAddress = config?.emailForwardingAddress || 'fernandolascano@martinezwehbe.com'
        const isDeliveryReport =
          sourceLower.includes('mailer-daemon@amazonses.com') ||
          /\bdelivery status notification\b/i.test(subject)

        if (forwardingEnabled && forwardingAddress) {
          // Evita loops de reportes de entrega (DSN) que se auto-rebotan.
          if (isDeliveryReport) {
            logInboundDone('dsn_no_forward')
            return NextResponse.json({ status: 'processed_dsn_no_forward', emailId: email.id })
          }

          // Evita rebotes de SES al remitente original cuando el inbound trae adjuntos:
          // el contenido completo queda en el panel de admin y no se hace forward SMTP.
          if (!parsedFromS3 || attachmentRecords.length > 0) {
            logInboundDone('no_forward_attachments_or_parse')
            return NextResponse.json({ status: 'processed_without_forward', emailId: email.id })
          }

          // Reenvio "ultra-liviano": evita rebotes por limites de tamano en casillas destino.
          const safeBodyText = bodyText.slice(0, 5000)
          const attachmentsLabel = `${attachmentRecords.length} archivo(s), ${(totalAttachmentsBytes / 1024 / 1024).toFixed(2)} MB`
          const subjectShort = subject.slice(0, 180)
          const fromLabel = `${fromName || fromAddress} <${fromAddress}>`
          const toLabel = Array.isArray(toAddresses) ? toAddresses.join(', ') : String(toAddresses)

          const forwardHtml = `
            <div style="font-family: sans-serif; color: #374151; line-height: 1.6;">
              <p><strong>Nuevo email recibido en QuieroMiSAS</strong></p>
              <p><strong>De:</strong> ${fromLabel}<br/>
              <strong>Para:</strong> ${toLabel}<br/>
              <strong>Asunto:</strong> ${subjectShort}<br/>
              <strong>Adjuntos:</strong> ${attachmentsLabel}</p>
              <p style="font-size: 13px; color: #6b7280;">
                Se envia solo resumen para evitar rebotes por tamano. Revisar contenido completo y descargar adjuntos desde el panel de admin.
              </p>
              ${safeBodyText ? `<pre style="white-space: pre-wrap; background: #f9fafb; border: 1px solid #e5e7eb; padding: 10px; border-radius: 6px;">${safeBodyText}</pre>` : ''}
            </div>
          `

          await sendEmail({
            to: forwardingAddress,
            subject: `[FWD] ${subjectShort} - de ${fromName || fromAddress}`,
            html: forwardHtml,
            text: `Nuevo email recibido en QuieroMiSAS\nDe: ${fromLabel}\nPara: ${toLabel}\nAsunto: ${subjectShort}\nAdjuntos: ${attachmentsLabel}\n\nResumen:\n${safeBodyText || '(sin cuerpo de texto)'}`,
          })

          await prisma.email.update({
            where: { id: email.id },
            data: { isForwarded: true },
          })
          logInboundDone('forwarded_summary')
        } else {
          logInboundDone('forward_disabled')
        }
      } catch {
        // Forward failed - non-critical
        logInboundDone('forward_error')
      }

      return NextResponse.json({ status: 'processed', emailId: email.id })
    }

    return NextResponse.json({ status: 'ignored' })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
