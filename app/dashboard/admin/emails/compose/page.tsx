'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, Loader2, Eye, EyeOff } from 'lucide-react'

export default function ComposeEmailPage() {
  const router = useRouter()
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState('')

  const buildHtml = (text: string) => {
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); padding: 24px 32px; border-radius: 16px 16px 0 0; text-align: center;">
          <img src="https://www.quieromisas.com/assets/img/qms-logo-white.png" alt="QuieroMiSAS" width="160" style="height: auto;" />
        </div>
        <div style="background: white; padding: 32px; border: 1px solid #e5e7eb; border-top: none;">
          ${text.split('\n').map(line => `<p style="margin: 0 0 12px 0; font-size: 15px; line-height: 1.7; color: #374151;">${line || '&nbsp;'}</p>`).join('')}
        </div>
        <div style="background: #1f2937; padding: 24px 32px; border-radius: 0 0 16px 16px; text-align: center;">
          <p style="color: #9ca3af; font-size: 13px; margin: 0;">QuieroMiSAS · contacto@quieromisas.com</p>
          <p style="color: #6b7280; font-size: 11px; margin: 8px 0 0 0;">© ${new Date().getFullYear()} QuieroMiSAS. Todos los derechos reservados.</p>
        </div>
      </div>
    `
  }

  const handleSend = async () => {
    setError('')
    if (!to.trim() || !subject.trim() || !body.trim()) {
      setError('Completá todos los campos')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to.trim())) {
      setError('El email de destino no es válido')
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/admin/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: to.trim(),
          subject: subject.trim(),
          html: buildHtml(body),
          text: body,
        }),
      })

      if (res.ok) {
        router.push('/dashboard/admin/emails')
      } else {
        setError('Error al enviar el email. Intentá nuevamente.')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/admin/emails"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a la bandeja
      </Link>

      {/* Header */}
      <div>
        <span className="text-sm font-semibold text-brand-700 uppercase tracking-wider">Nuevo Email</span>
        <h1 className="text-2xl font-black text-gray-900 mt-1">Redactar email</h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 space-y-4">
            {/* To */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Destinatario</label>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="email@ejemplo.com"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Asunto</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Asunto del email"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mensaje</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Escribí tu mensaje..."
                rows={12}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none leading-relaxed"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition cursor-pointer"
              >
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showPreview ? 'Ocultar preview' : 'Ver preview'}
              </button>

              <button
                onClick={handleSend}
                disabled={sending || !to.trim() || !subject.trim() || !body.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-700 text-white rounded-xl text-sm font-semibold hover:bg-brand-800 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Enviar email
              </button>
            </div>
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <p className="text-sm font-semibold text-gray-700">Vista previa</p>
              <p className="text-xs text-gray-400 mt-0.5">Así se verá el email en la bandeja del destinatario</p>
            </div>
            <div className="p-6 bg-gray-100">
              <div
                dangerouslySetInnerHTML={{ __html: buildHtml(body || 'Tu mensaje aparecerá acá...') }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
