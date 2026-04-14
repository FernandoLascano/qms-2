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
  const [replyText, setReplyText] = useState('')
  const [replyTo, setReplyTo] = useState('')
  const [replyCc, setReplyCc] = useState('')
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
      if (data?.direction === 'INBOUND') {
        setReplyTo((data.replyTo || data.from || '').toLowerCase())
      }
    } catch {
      router.push('/dashboard/admin/emails')
    } finally {
      setLoading(false)
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
  }

  const handleReply = async () => {
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

      const res = await fetch(`/api/admin/emails/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html,
          text: replyText,
          to: replyTo,
          cc: replyCc,
          attachments: attachmentsPayload,
        }),
      })

      if (res.ok) {
        setShowReply(false)
        setReplyText('')
        setReplyCc('')
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-700" />
      </div>
    )
  }

  if (!email) return null

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/dashboard/admin/emails"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a la bandeja
      </Link>

      {/* Email Header */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  email.direction === 'INBOUND'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  {email.direction === 'INBOUND' ? 'Recibido' : 'Enviado'}
                </span>
                {email.status === 'REPLIED' && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                    Respondido
                  </span>
                )}
                {email.status === 'ARCHIVED' && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                    Archivado
                  </span>
                )}
                {email.tramite && (
                  <Link
                    href={`/dashboard/admin/tramites/${email.tramite.id}`}
                    className="text-xs font-bold px-3 py-1 rounded-full bg-brand-100 text-brand-700 hover:bg-brand-200 transition"
                  >
                    {email.tramite.denominacionSocial1}
                  </Link>
                )}
              </div>
              <h1 className="text-lg sm:text-xl font-black text-gray-900">{email.subject}</h1>
            </div>

            <div className="flex flex-wrap gap-2">
              {email.direction === 'INBOUND' && (
                <button
                  onClick={() => setShowReply(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-700 text-white rounded-xl text-sm font-semibold hover:bg-brand-800 transition cursor-pointer"
                >
                  <Reply className="w-4 h-4" />
                  Responder
                </button>
              )}
              {(email.status === 'UNREAD' || email.status === 'READ') && (
                <button
                  onClick={handleToggleRead}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
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
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
              >
                <Archive className="w-4 h-4" />
                {email.status === 'ARCHIVED' ? 'Desarchivar' : 'Archivar'}
              </button>
            </div>
          </div>
        </div>

        {/* Sender/Recipient info */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {email.direction === 'INBOUND'
                    ? (email.fromName ? `${email.fromName} <${email.from}>` : email.from)
                    : `De: contacto@quieromisas.com`
                  }
                </p>
                <p className="text-gray-500">
                  {email.direction === 'INBOUND'
                    ? `Para: ${email.to.join(', ')}`
                    : `Para: ${email.to.join(', ')}`
                  }
                </p>
                {email.cc.length > 0 && (
                  <p className="text-gray-500">CC: {email.cc.join(', ')}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-400 ml-11">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs">{formatDate(email.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Attachments */}
        {email.attachments.length > 0 && (
          <div className="px-6 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2 flex-wrap">
              <Paperclip className="w-4 h-4 text-gray-400" />
              {email.attachments.map(att => (
                <a
                  key={att.id}
                  href={`/api/admin/emails/attachments/${att.id}/download`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-200 transition"
                >
                  {att.fileName}
                  <span className="text-gray-400">({formatSize(att.size)})</span>
                  <Download className="w-3 h-3 text-gray-400" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Email Body */}
        <div className="p-6">
          {email.bodyHtml ? (
            <div
              className="prose prose-sm max-w-none [&_*]:!text-gray-800 [&_a]:!text-brand-700"
              dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
            />
          ) : (
            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed">
              {email.bodyText || 'Sin contenido'}
            </pre>
          )}
        </div>

        {/* Thread / Replies */}
        {email.replies.length > 0 && (
          <div className="border-t border-gray-100">
            <div className="px-6 py-3 bg-gray-50">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Respuestas ({email.replies.length})
              </p>
            </div>
            <div className="divide-y divide-gray-100">
              {email.replies.map(reply => (
                <Link
                  key={reply.id}
                  href={`/dashboard/admin/emails/${reply.id}`}
                  className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition"
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                    reply.direction === 'INBOUND' ? 'bg-green-100' : 'bg-purple-100'
                  }`}>
                    {reply.direction === 'INBOUND' ? (
                      <Inbox className="w-3 h-3 text-green-600" />
                    ) : (
                      <Send className="w-3 h-3 text-purple-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{reply.subject}</p>
                    <p className="text-xs text-gray-400">{reply.from}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(reply.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Reply Form */}
        {showReply && (
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <Reply className="w-4 h-4 text-gray-400" />
              <p className="text-sm font-semibold text-gray-700">
                Responder a {email.fromName || email.from}
              </p>
            </div>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Escribí tu respuesta..."
              rows={6}
              className="w-full p-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              autoFocus
            />
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <input
                type="text"
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
                placeholder="destinatario@correo.com"
                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
              <input
                type="text"
                value={replyCc}
                onChange={(e) => setReplyCc(e.target.value)}
                placeholder="cc@correo.com, otro@correo.com"
                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div className="mt-3">
              <input
                type="file"
                multiple
                onChange={(e) => setReplyAttachments(Array.from(e.target.files || []))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 file:cursor-pointer"
              />
              {replyAttachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {replyAttachments.map((file, idx) => (
                    <span key={`${file.name}-${idx}`} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-600">
                      {file.name}
                      <button
                        type="button"
                        onClick={() => setReplyAttachments(prev => prev.filter((_, pIdx) => pIdx !== idx))}
                        className="text-gray-400 hover:text-gray-700 cursor-pointer"
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
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleReply}
                disabled={!replyText.trim() || sending}
                className="flex items-center gap-2 px-6 py-2 bg-brand-700 text-white rounded-xl text-sm font-semibold hover:bg-brand-800 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Enviar respuesta
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
