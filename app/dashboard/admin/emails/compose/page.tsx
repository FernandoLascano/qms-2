'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, Loader2, Eye, EyeOff, X, FileText, User } from 'lucide-react'

interface Tramite {
  id: string
  denominacionSocial1: string
  user: { name: string; email: string }
}

interface Template {
  key: string
  name: string
  subject: string
  body: string
}

interface UploadAttachment {
  id: string
  file: File
}

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
const MAX_TOTAL_ATTACHMENTS_BYTES = 20 * 1024 * 1024
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const TEMPLATES: Template[] = [
  {
    key: 'bienvenida',
    name: 'Bienvenida',
    subject: 'Bienvenido a QuieroMiSAS',
    body: `¡Hola!\n\nGracias por registrarte en QuieroMiSAS. Estamos listos para ayudarte a constituir tu S.A.S. de manera rápida y segura.\n\nSi tenés alguna duda, no dudes en escribirnos.\n\nSaludos,\nEquipo QuieroMiSAS`
  },
  {
    key: 'documentacion',
    name: 'Solicitud de documentación',
    subject: 'Documentación pendiente para tu trámite',
    body: `¡Hola!\n\nPara poder avanzar con tu trámite de constitución, necesitamos que subas la siguiente documentación a tu panel:\n\n- DNI frente y dorso de todos los socios\n- Constancia de CUIT/CUIL de cada socio\n- Comprobante de domicilio\n\nPodés hacerlo desde tu panel en www.quieromisas.com/dashboard/documentos\n\nQuedamos atentos.\n\nSaludos,\nEquipo QuieroMiSAS`
  },
  {
    key: 'pago-pendiente',
    name: 'Recordatorio de pago',
    subject: 'Recordatorio: Pago pendiente para tu trámite',
    body: `¡Hola!\n\nTe recordamos que tenés un pago pendiente para continuar con tu trámite de constitución de S.A.S.\n\nPodés realizar el pago desde tu panel en la sección de trámites.\n\nSi ya realizaste el pago, por favor ignorá este mensaje.\n\nSaludos,\nEquipo QuieroMiSAS`
  },
  {
    key: 'estado-tramite',
    name: 'Actualización de trámite',
    subject: 'Novedades sobre tu trámite',
    body: `¡Hola!\n\nTe escribimos para informarte sobre el estado de tu trámite.\n\n[Completar con la novedad]\n\nSi tenés alguna consulta, no dudes en escribirnos.\n\nSaludos,\nEquipo QuieroMiSAS`
  },
  {
    key: 'tramite-completado',
    name: 'Trámite completado',
    subject: '¡Felicitaciones! Tu S.A.S. ya está inscripta',
    body: `¡Felicitaciones!\n\nNos alegra informarte que tu Sociedad por Acciones Simplificada ya fue inscripta exitosamente.\n\nDesde tu panel podés descargar toda la documentación:\n- Estatuto inscripto\n- CUIT de la sociedad\n- Matrícula\n\nPróximos pasos recomendados:\n1. Habilitar punto de venta en AFIP\n2. Abrir cuenta bancaria empresarial\n3. Registrar actividad comercial\n\n¡Muchos éxitos con tu nuevo emprendimiento!\n\nSaludos,\nEquipo QuieroMiSAS`
  },
  {
    key: 'consulta-general',
    name: 'Respuesta a consulta',
    subject: 'Re: Tu consulta en QuieroMiSAS',
    body: `¡Hola!\n\nGracias por tu consulta.\n\n[Completar con la respuesta]\n\nQuedamos a disposición por cualquier otra duda.\n\nSaludos,\nEquipo QuieroMiSAS`
  },
]

export default function ComposeEmailPage() {
  const router = useRouter()
  const [to, setTo] = useState<string[]>([])
  const [cc, setCc] = useState<string[]>([])
  const [toInput, setToInput] = useState('')
  const [ccInput, setCcInput] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [attachments, setAttachments] = useState<UploadAttachment[]>([])
  const [sending, setSending] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')

  // Destinatarios desde trámites
  const [tramites, setTramites] = useState<Tramite[]>([])
  const [showRecipients, setShowRecipients] = useState(false)
  const [recipientSearch, setRecipientSearch] = useState('')
  const recipientRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchTramites()
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (recipientRef.current && !recipientRef.current.contains(e.target as Node)) {
        setShowRecipients(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const fetchTramites = async () => {
    try {
      const res = await fetch('/api/tramites?limit=100')
      if (res.ok) {
        const data = await res.json()
        const items = Array.isArray(data?.tramites)
          ? data.tramites
          : Array.isArray(data) ? data : []
        setTramites(items.filter((t: Tramite) => t.user?.email))
      }
    } catch {
      // ignore
    }
  }

  const filteredTramites = tramites.filter(t => {
    const q = recipientSearch.toLowerCase()
    return (
      t.denominacionSocial1.toLowerCase().includes(q) ||
      t.user.name.toLowerCase().includes(q) ||
      t.user.email.toLowerCase().includes(q)
    )
  })

  const handleTemplateChange = (key: string) => {
    setSelectedTemplate(key)
    const template = TEMPLATES.find(t => t.key === key)
    if (template) {
      setSubject(template.subject)
      setBody(template.body)
    }
  }

  const normalizeEmails = (rawValue: string) =>
    rawValue
      .split(',')
      .map(v => v.trim().toLowerCase())
      .filter(Boolean)
      .filter(v => EMAIL_REGEX.test(v))

  const addRecipients = (rawValue: string, target: 'to' | 'cc') => {
    const emails = normalizeEmails(rawValue)
    if (!emails.length) return
    if (target === 'to') {
      setTo(prev => Array.from(new Set([...prev, ...emails])))
      setToInput('')
      setRecipientSearch('')
    } else {
      setCc(prev => Array.from(new Set([...prev, ...emails])))
      setCcInput('')
    }
  }

  const removeRecipient = (email: string, target: 'to' | 'cc') => {
    if (target === 'to') setTo(prev => prev.filter(item => item !== email))
    else setCc(prev => prev.filter(item => item !== email))
  }

  const selectRecipient = (email: string) => {
    addRecipients(email, 'to')
    setShowRecipients(false)
    setRecipientSearch('')
  }

  const handleAttachmentPick = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const nextFiles = Array.from(files)
    const invalid = nextFiles.find(file => file.size > MAX_ATTACHMENT_BYTES)
    if (invalid) {
      setError(`El archivo ${invalid.name} supera el límite de 10 MB`)
      return
    }
    const total = [...attachments.map(item => item.file), ...nextFiles]
      .reduce((sum, file) => sum + file.size, 0)
    if (total > MAX_TOTAL_ATTACHMENTS_BYTES) {
      setError('El total de adjuntos supera el límite de 20 MB')
      return
    }
    setAttachments(prev => [
      ...prev,
      ...nextFiles.map(file => ({ id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`, file }))
    ])
  }

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(item => item.id !== id))
  }

  const fileToBase64 = async (file: File): Promise<string> => {
    const bytes = await file.arrayBuffer()
    let binary = ''
    const chunkSize = 8192
    const view = new Uint8Array(bytes)
    for (let i = 0; i < view.length; i += chunkSize) {
      const chunk = view.subarray(i, i + chunkSize)
      binary += String.fromCharCode(...chunk)
    }
    return btoa(binary)
  }

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
    if (!to.length || !subject.trim() || !body.trim()) {
      setError('Completá todos los campos')
      return
    }

    if (to.some(email => !EMAIL_REGEX.test(email)) || cc.some(email => !EMAIL_REGEX.test(email))) {
      setError('Hay uno o más emails inválidos')
      return
    }

    setSending(true)
    try {
      const attachmentsPayload = await Promise.all(
        attachments.map(async ({ file }) => ({
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
          size: file.size,
          contentBase64: await fileToBase64(file),
        }))
      )

      const res = await fetch('/api/admin/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          cc,
          subject: subject.trim(),
          html: buildHtml(body),
          text: body,
          attachments: attachmentsPayload,
        }),
      })

      if (res.ok) {
        router.push('/dashboard/admin/emails')
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Error al enviar el email. Intentá nuevamente.')
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
          <div className="p-6 space-y-5">
            {/* Template selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Plantilla</label>
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent cursor-pointer"
              >
                <option value="">Escribir desde cero</option>
                {TEMPLATES.map(t => (
                  <option key={t.key} value={t.key}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* To - with autocomplete */}
            <div ref={recipientRef} className="relative">
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Destinatario</label>
              <div className="relative">
                <input
                  type="text"
                  value={toInput}
                  onChange={(e) => { setToInput(e.target.value); setRecipientSearch(e.target.value) }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault()
                      addRecipients(toInput, 'to')
                    }
                  }}
                  onBlur={() => addRecipients(toInput, 'to')}
                  onFocus={() => setShowRecipients(true)}
                  placeholder="email@ejemplo.com (Enter para agregar)"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium bg-white text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
                {toInput && (
                  <button
                    onClick={() => { setToInput(''); setRecipientSearch('') }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Dropdown de destinatarios */}
              {showRecipients && filteredTramites.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Clientes de trámites</p>
                  </div>
                  {filteredTramites.slice(0, 10).map(t => (
                    <button
                      key={t.id}
                      onClick={() => selectRecipient(t.user.email)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition text-left cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{t.user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{t.user.email}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <FileText className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400 truncate max-w-[120px]">{t.denominacionSocial1}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {to.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {to.map(email => (
                    <span key={email} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-medium">
                      {email}
                      <button type="button" onClick={() => removeRecipient(email, 'to')} className="text-brand-600 hover:text-brand-800 cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* CC */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">CC (opcional)</label>
              <input
                type="text"
                value={ccInput}
                onChange={(e) => setCcInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault()
                    addRecipients(ccInput, 'cc')
                  }
                }}
                onBlur={() => addRecipients(ccInput, 'cc')}
                placeholder="otra@empresa.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium bg-white text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
              {cc.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {cc.map(email => (
                    <span key={email} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                      {email}
                      <button type="button" onClick={() => removeRecipient(email, 'cc')} className="text-gray-500 hover:text-gray-700 cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Asunto</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Asunto del email"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium bg-white text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Mensaje</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Escribí tu mensaje..."
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium bg-white text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none leading-relaxed"
              />
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Adjuntos</label>
              <input
                type="file"
                multiple
                onChange={(e) => handleAttachmentPick(e.target.files)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-700 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 file:cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-1">Máximo 10 MB por archivo, 20 MB totales.</p>
              {attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {attachments.map(({ id, file }) => (
                    <div key={id} className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                      <span className="truncate pr-3">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      <button type="button" onClick={() => removeAttachment(id)} className="text-red-600 hover:text-red-700 cursor-pointer">Quitar</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center justify-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition cursor-pointer py-2"
              >
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showPreview ? 'Ocultar preview' : 'Ver preview'}
              </button>

              <button
                onClick={handleSend}
                disabled={sending || !to.length || !subject.trim() || !body.trim()}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-700 text-white rounded-xl text-sm font-semibold hover:bg-brand-800 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
              <p className="text-sm font-semibold text-gray-900">Vista previa</p>
              <p className="text-xs text-gray-500 mt-0.5">Así se verá el email en la bandeja del destinatario</p>
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
