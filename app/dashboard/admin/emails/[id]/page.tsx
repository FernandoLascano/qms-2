'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, Archive, Inbox, Paperclip, Clock, User, Reply, Loader2, Eye, EyeOff, Download, X } from 'lucide-react'

interface EmailDetail {
  id: string
  from: string
  fromName: string | null
  to: string[]
  cc: string[]
  bcc?: string[]
  replyTo: string | null
  subject: string
  bodyText: string | null
  bodyHtml: string | null
  direction: 'INBOUND' | 'OUTBOUND'
  status: 'UNREAD' | 'READ' | 'REPLIED' | 'ARCHIVED'
  spamVerdict: string | null
  virusVerdict: string | null
  isForwarded: boolean
  attachments: { id: string; fileName: string; mimeType: string; size: number; s3Key: string }[]
  tramite: { id: string; denominacionSocial1: string; estadoGeneral: string } | null
  parentEmail: { id: string; subject: string; from: string; createdAt: string } | null
  replies: { id: string; subject: string; from: string; to: string[]; createdAt: string; direction: string }[]
  createdAt: string
}

export default function EmailDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [email, setEmail] = useState<EmailDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showReply, setShowReply] = useState(false)
  const [composerMode, setComposerMode] = useState<'reply' | 'forward'>('reply')
  const [replyText, setReplyText] = useState('')
  const [replySubject, setReplySubject] = useState('')
  const [replyTo, setReplyTo] = useState('')
  const [replyCc, setReplyCc] = useState('')
  const [replyBcc, setReplyBcc] = useState('')
  const [replyAttachments, setReplyAttachments] = useState<File[]>([])
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (id) fetchEmail()
  }, [id])

  const fetchEmail = async () => {
    try {
      const res = await fetch(`/api/admin/emails/${id}`)
      if (!res.ok) { router.push('/dashboard/admin/emails'); return }
      const data = await res.json()
      setEmail(data)
      setReplySubject(`Re: ${data?.subject || ''}`.replace(/^Re:\s*Re:/i, 'Re:'))
      if (data?.direction === 'INBOUND') {
        setReplyTo((data.replyTo || data.from || '').toLowerCase())
      } else {
        const fallbackRecipient = Array.isArray(data?.to) && data.to.length > 0 ? data.to[0] : ''
        setReplyTo(String(fallbackRecipient).toLowerCase())
      }
    } catch {
      router.push('/dashboard/admin/emails')
    } finally {
      setLoading(false)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('admin-email-unread-refresh'))
      }
    }
  }

  const handleArchive = async () => {
    if (!email) return
    const newStatus = email.status === 'ARCHIVED' ? 'READ' : 'ARCHIVED'
    await fetch(`/api/admin/emails/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setEmail({ ...email, status: newStatus })
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('admin-email-unread-refresh'))
    }
  }

  const handleToggleRead = async () => {
    if (!email) return
    if (email.status !== 'UNREAD' && email.status !== 'READ') return
    const newStatus = email.status === 'UNREAD' ? 'READ' : 'UNREAD'
    await fetch(`/api/admin/emails/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setEmail({ ...email, status: newStatus })
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('admin-email-unread-refresh'))
    }
  }

  const handleSend = async () => {
    if (!replyText.trim() || !email) return
    setSending(true)
    try {
      const attachmentsPayload = await Promise.all(
        replyAttachments.map(async (file) => {
          const bytes = await file.arrayBuffer()
          let binary = ''
          const view = new Uint8Array(bytes)
          const chunkSize = 8192
          for (let i = 0; i < view.length; i += chunkSize) {
            binary += String.fromCharCode(...view.subarray(i, i + chunkSize))
          }
          return {
            filename: file.name,
            contentType: file.type || 'application/octet-stream',
            size: file.size,
            contentBase64: btoa(binary),
          }
        })
      )

      const html = `
        <div style="font-family: sans-serif; font-size: 15px; line-height: 1.7; color: #374151;">
          ${replyText.split('\n').map(line => `<p style="margin: 0 0 8px 0;">${line || '&nbsp;'}</p>`).join('')}
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 13px;">
            <p style="margin: 0;">— QuieroMiSAS</p>
          </div>
        </div>
      `

      const endpoint = composerMode === 'forward'
        ? '/api/admin/emails'
        : `/api/admin/emails/${id}/reply`
      const payload = composerMode === 'forward'
        ? {
            to: replyTo,
            cc: replyCc,
            bcc: replyBcc,
            subject: (replySubject || `Fwd: ${email.subject}`).trim(),
            html,
            text: replyText,
            attachments: attachmentsPayload,
          }
        : {
            html,
            text: replyText,
            to: replyTo,
            cc: replyCc,
            bcc: replyBcc,
            attachments: attachmentsPayload,
          }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setShowReply(false)
        setComposerMode('reply')
        setReplyText('')
        setReplyCc('')
        setReplyBcc('')
        setReplyAttachments([])
        fetchEmail()
      }
    } catch {
      // error
    } finally {
      setSending(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-line" />
      </div>
    )
  }

  if (!email) return null

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/dashboard/admin/emails"
        className="inline-flex items-center gap-2 text-body-sm text-ink-2 hover:text-ink-2 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a la bandeja
      </Link>

      {/* Email Header */}
      <div className="bg-surface rounded-card border border-line shadow-raise overflow-hidden">
        <div className="p-6 border-b border-line">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className={`text-label font-semibold px-3 py-1 rounded-full ${
                  email.direction === 'INBOUND'
                    ? 'bg-success-soft text-success'
                    : 'bg-info-soft text-info'
                }`}>
                  {email.direction === 'INBOUND' ? 'Recibido' : 'Enviado'}
                </span>
                {email.status === 'REPLIED' && (
                  <span className="text-label font-semibold px-3 py-1 rounded-full bg-info-soft text-info">
                    Respondido
                  </span>
                )}
                {email.status === 'ARCHIVED' && (
                  <span className="text-label font-semibold px-3 py-1 rounded-full bg-surface-3 text-ink-2">
                    Archivado
                  </span>
                )}
                {email.tramite && (
                  <Link
                    href={`/dashboard/admin/tramites/${email.tramite.id}`}
                    className="text-label font-semibold px-3 py-1 rounded-full bg-primary-soft text-primary hover:bg-brand-200 transition"
                  >
                    {email.tramite.denominacionSocial1}
                  </Link>
                )}
              </div>
              <h1 className="text-heading sm:text-title font-semibold text-ink">{email.subject}</h1>
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                (email.direction === 'INBOUND' && (email.replyTo || email.from)) ||
                (email.direction === 'OUTBOUND' && email.to.length > 0)
              ) && (
                <button
                  onClick={() => {
                    setComposerMode('reply')
                    setReplySubject(`Re: ${email.subject}`.replace(/^Re:\s*Re:/i, 'Re:'))
                    setShowReply(true)
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-control text-body-sm font-semibold hover:bg-primary-hover transition cursor-pointer"
                >
                  <Reply className="w-4 h-4" />
                  Responder
                </button>
              )}
              <button
                onClick={() => {
                  setComposerMode('forward')
                  setReplySubject(`Fwd: ${email.subject}`.replace(/^Fwd:\s*Fwd:/i, 'Fwd:'))
                  setReplyTo('')
                  setReplyCc('')
                  setReplyText(
                    `\n\n---------- Mensaje reenviado ----------\nDe: ${email.fromName || email.from}\nPara: ${email.to.join(', ')}\nAsunto: ${email.subject}\n\n${email.bodyText || ''}`.trim()
                  )
                  setShowReply(true)
                }}
                className="flex items-center gap-2 px-4 py-2 border border-line rounded-control text-body-sm font-medium text-ink-2 hover:bg-surface-2 transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Reenviar
              </button>
              {(email.status === 'UNREAD' || email.status === 'READ') && (
                <button
                  onClick={handleToggleRead}
                  className="flex items-center gap-2 px-4 py-2 border border-line rounded-control text-body-sm font-medium text-ink-2 hover:bg-surface-2 transition cursor-pointer"
                  title={email.status === 'UNREAD' ? 'Marcar como leído' : 'Marcar como no leído'}
                >
                  {email.status === 'UNREAD' ? (
                    <>
                      <Eye className="w-4 h-4" />
                      Marcar leído
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Marcar no leído
                    </>
                  )}
                </button>
              )}
              <button
                onClick={handleArchive}
                className="flex items-center gap-2 px-4 py-2 border border-line rounded-control text-body-sm font-medium text-ink-2 hover:bg-surface-2 transition cursor-pointer"
              >
                <Archive className="w-4 h-4" />
                {email.status === 'ARCHIVED' ? 'Desarchivar' : 'Archivar'}
              </button>
            </div>
          </div>
        </div>

        {/* Sender/Recipient info */}
        <div className="px-6 py-4 bg-surface-2 border-b border-line">
          <div className="flex flex-col gap-2 text-body-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-n-200 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-ink-2" />
              </div>
              <div>
                <p className="font-semibold text-ink">
                  {email.direction === 'INBOUND'
                    ? (email.fromName ? `${email.fromName} <${email.from}>` : email.from)
                    : `De: contacto@quieromisas.com`
                  }
                </p>
                <p className="text-ink-2">
                  {email.direction === 'INBOUND'
                    ? `Para: ${email.to.join(', ')}`
                    : `Para: ${email.to.join(', ')}`
                  }
                </p>
                {email.cc.length > 0 && (
                  <p className="text-ink-2">CC: {email.cc.join(', ')}</p>
                )}
                {email.bcc && email.bcc.length > 0 && (
                  <p className="text-ink-2">BCC: {email.bcc.join(', ')}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-ink-3 ml-11">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-label">{formatDate(email.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Attachments */}
        {email.attachments.length > 0 && (
          <div className="px-6 py-3 border-b border-line space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Paperclip className="w-4 h-4 text-ink-3" />
              {email.attachments.map(att => (
                <a
                  key={att.id}
                  href={`/api/admin/emails/attachments/${att.id}/download`}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-surface-3 rounded-control text-label font-medium text-ink-2 hover:bg-n-200 transition"
                >
                  {att.fileName}
                  <span className="text-ink-3">({formatSize(att.size)})</span>
                  <Download className="w-3 h-3 text-ink-3" />
                </a>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              {email.attachments
                .filter(att => att.mimeType.startsWith('image/'))
                .map(att => (
                  <img
                    key={att.id}
                    src={`/api/admin/emails/attachments/${att.id}/download?inline=1`}
                    alt={att.fileName}
                    className="max-h-72 max-w-full rounded-control border border-line object-contain bg-surface-2"
                  />
                ))}
            </div>
          </div>
        )}

        {/* Email Body */}
        <div className="p-6">
          {email.bodyHtml ? (
            <div
              className="prose prose-sm max-w-none [&_*]:!text-ink [&_a]:!text-primary"
              dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
            />
          ) : (
            <pre className="whitespace-pre-wrap text-body-sm text-ink font-sans leading-relaxed">
              {email.bodyText || 'Sin contenido'}
            </pre>
          )}
        </div>

        {/* Thread / Replies */}
        {email.replies.length > 0 && (
          <div className="border-t border-line">
            <div className="px-6 py-3 bg-surface-2">
              <p className="text-label font-semibold text-ink-2">
                Respuestas ({email.replies.length})
              </p>
            </div>
            <div className="divide-y divide-line">
              {email.replies.map(reply => (
                <Link
                  key={reply.id}
                  href={`/dashboard/admin/emails/${reply.id}`}
                  className="flex items-center gap-3 px-6 py-3 hover:bg-surface-2 transition"
                >
                  <div className={`w-6 h-6 rounded-chip flex items-center justify-center ${
                    reply.direction === 'INBOUND' ? 'bg-success-soft' : 'bg-info-soft'
                  }`}>
                    {reply.direction === 'INBOUND' ? (
                      <Inbox className="w-3 h-3 text-success" />
                    ) : (
                      <Send className="w-3 h-3 text-info" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-medium text-ink-2 truncate">{reply.subject}</p>
                    <p className="text-label text-ink-3">{reply.from}</p>
                  </div>
                  <span className="text-label text-ink-3">
                    {new Date(reply.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Reply Form */}
        {showReply && (
          <div className="border-t border-line p-6 bg-surface-2">
            <div className="flex items-center gap-2 mb-3">
              <Reply className="w-4 h-4 text-ink-3" />
              <p className="text-body-sm font-semibold text-ink-2">
                {composerMode === 'forward'
                  ? 'Reenviar mensaje'
                  : `Responder a ${email.fromName || email.from}`
                }
              </p>
            </div>
            {composerMode === 'forward' && (
              <input
                type="text"
                value={replySubject}
                onChange={(e) => setReplySubject(e.target.value)}
                placeholder="Asunto"
                className="w-full p-3 mb-3 border border-line rounded-control text-body-sm font-medium bg-surface text-ink placeholder:text-ink-2 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            )}
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={composerMode === 'forward' ? 'Escribí el reenvío...' : 'Escribí tu respuesta...'}
              rows={6}
              className="w-full p-4 border border-line rounded-control text-body-sm font-medium bg-surface text-ink placeholder:text-ink-2 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
              autoFocus
            />
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <input
                type="text"
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
                placeholder="destinatario@correo.com"
                className="w-full p-3 border border-line rounded-control text-body-sm font-medium bg-surface text-ink placeholder:text-ink-2 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
              <input
                type="text"
                value={replyCc}
                onChange={(e) => setReplyCc(e.target.value)}
                placeholder="cc@correo.com, otro@correo.com"
                className="w-full p-3 border border-line rounded-control text-body-sm font-medium bg-surface text-ink placeholder:text-ink-2 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
              <input
                type="text"
                value={replyBcc}
                onChange={(e) => setReplyBcc(e.target.value)}
                placeholder="bcc oculto@correo.com"
                className="w-full p-3 border border-line rounded-control text-body-sm font-medium bg-surface text-ink placeholder:text-ink-2 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent sm:col-span-2"
              />
            </div>
            <div className="mt-3">
              <input
                type="file"
                multiple
                onChange={(e) => setReplyAttachments(Array.from(e.target.files || []))}
                className="w-full px-3 py-2 border border-line rounded-control text-body-sm text-ink-2 file:mr-3 file:px-3 file:py-1 file:rounded-control file:border-0 file:bg-surface-3 file:text-ink-2 file:cursor-pointer"
              />
              {replyAttachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {replyAttachments.map((file, idx) => (
                    <span key={`${file.name}-${idx}`} className="inline-flex items-center gap-2 px-3 py-1 bg-surface border border-line rounded-control text-label text-ink-2">
                      {file.name}
                      <button
                        type="button"
                        onClick={() => setReplyAttachments(prev => prev.filter((_, pIdx) => pIdx !== idx))}
                        className="text-ink-3 hover:text-ink-2 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-3">
              <button
                onClick={() => { setShowReply(false); setReplyText('') }}
                className="px-4 py-2 text-body-sm font-medium text-ink-2 hover:bg-surface-3 rounded-control transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSend}
                disabled={!replyText.trim() || sending}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-on-primary rounded-control text-body-sm font-semibold hover:bg-primary-hover transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {composerMode === 'forward' ? 'Reenviar email' : 'Enviar respuesta'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
