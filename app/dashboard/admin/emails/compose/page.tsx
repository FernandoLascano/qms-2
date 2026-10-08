'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileInput } from '@/components/ui/file-input'
import { TEMPLATES, personalizar, textoDePlantilla, type DbTemplate } from '@/lib/emails/respuestas-rapidas'
import {
  interpolarConocidas,
  mensajeDePendientes,
  pendientesDeCompletar,
  variablesDe,
  type DatosDestinatario,
} from '@/lib/emails/redaccion'
import { Send, Loader2, Eye, EyeOff, X, FileText, User } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Select } from '@/components/ui/select'

interface Tramite {
  id: string
  denominacionSocial1: string
  user: { name: string; email: string }
}

interface UploadAttachment {
  id: string
  file: File
}

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
const MAX_TOTAL_ATTACHMENTS_BYTES = 20 * 1024 * 1024
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DRAFT_STORAGE_KEY = 'qms-admin-email-compose-draft'

export default function ComposeEmailPage() {
  const router = useRouter()
  const [to, setTo] = useState<string[]>([])
  const [cc, setCc] = useState<string[]>([])
  const [bcc, setBcc] = useState<string[]>([])
  const [toInput, setToInput] = useState('')
  const [ccInput, setCcInput] = useState('')
  const [bccInput, setBccInput] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [attachments, setAttachments] = useState<UploadAttachment[]>([])
  const [sending, setSending] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState('')

  // La vista previa la arma el servidor con la misma función que envía, para
  // que lo que se ve acá sea exactamente lo que le llega al destinatario.
  const [previa, setPrevia] = useState('')
  const [altoPrevia, setAltoPrevia] = useState(600)
  const marcoPrevia = useRef<HTMLIFrameElement>(null)
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [dbTemplates, setDbTemplates] = useState<DbTemplate[]>([])
  const [draftRestored, setDraftRestored] = useState(false)

  // Quién es el destinatario (si hay uno solo): con eso se saluda por el
  // nombre y se rellenan las {{variables}} de las plantillas.
  const [datosDestino, setDatosDestino] = useState<DatosDestinatario | null>(null)

  // Destinatarios desde trámites
  const [tramites, setTramites] = useState<Tramite[]>([])
  const [showRecipients, setShowRecipients] = useState(false)
  const [recipientSearch, setRecipientSearch] = useState('')
  const recipientRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchTramites()
  }, [])

  const unicoDestinatario = to.length === 1 ? to[0] : ''
  useEffect(() => {
    if (!unicoDestinatario) {
      setDatosDestino(null)
      return
    }
    let vigente = true
    fetch(`/api/admin/emails/destinatario?email=${encodeURIComponent(unicoDestinatario)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((d: DatosDestinatario | null) => {
        if (vigente) setDatosDestino(d)
      })
      .catch(() => {
        if (vigente) setDatosDestino(null)
      })
    return () => {
      vigente = false
    }
  }, [unicoDestinatario])

  // Si la plantilla se eligió antes que el destinatario, las variables se
  // completan apenas se sabe quién es.
  useEffect(() => {
    if (!datosDestino) return
    const variables = variablesDe(datosDestino)
    setSubject((prev) => interpolarConocidas(prev, variables))
    setBody((prev) => personalizar(interpolarConocidas(prev, variables), datosDestino.nombre))
  }, [datosDestino])

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/admin/email-templates?scope=compose')
        if (res.ok) {
          const data = await res.json()
          setDbTemplates(Array.isArray(data.templates) ? data.templates : [])
        }
      } catch {
        // ignore
      }
    })()
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY)
      if (!raw) {
        setDraftRestored(true)
        return
      }
      const d = JSON.parse(raw) as {
        to?: string[]
        cc?: string[]
        bcc?: string[]
        subject?: string
        body?: string
      }
      if (d.to?.length) setTo(d.to)
      if (d.cc?.length) setCc(d.cc)
      if (d.bcc?.length) setBcc(d.bcc)
      if (d.subject) setSubject(d.subject)
      if (d.body) setBody(d.body)
    } catch {
      // ignore
    }
    setDraftRestored(true)
  }, [])

  useEffect(() => {
    if (!draftRestored) return
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({ to, cc, bcc, subject, body })
        )
      } catch {
        // ignore
      }
    }, 600)
    return () => clearTimeout(t)
  }, [draftRestored, to, cc, bcc, subject, body])

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

  /** Rellena las variables conocidas y pone el nombre en el «¡Hola!». */
  const completarPlantilla = (texto: string) =>
    personalizar(interpolarConocidas(texto, variablesDe(datosDestino)), datosDestino?.nombre)

  // Indicaciones «[Completar…]» o variables que quedaron sin reemplazar: se
  // avisan mientras se escribe y frenan el envío.
  const avisoPendientes = mensajeDePendientes(pendientesDeCompletar(subject, body))

  const handleTemplateChange = (key: string) => {
    setSelectedTemplate(key)
    if (key.startsWith('db:')) {
      const id = key.slice(3)
      const template = dbTemplates.find(t => t.id === id)
      if (template) {
        setSubject(completarPlantilla(template.subject))
        setBody(completarPlantilla(textoDePlantilla(template.bodyHtml) || template.subject))
      }
      return
    }
    const template = TEMPLATES.find(t => t.key === key)
    if (template) {
      setSubject(completarPlantilla(template.subject))
      setBody(completarPlantilla(template.body))
    }
  }

  const normalizeEmails = (rawValue: string) =>
    rawValue
      .split(',')
      .map(v => v.trim().toLowerCase())
      .filter(Boolean)
      .filter(v => EMAIL_REGEX.test(v))

  const addRecipients = (rawValue: string, target: 'to' | 'cc' | 'bcc') => {
    const emails = normalizeEmails(rawValue)
    if (!emails.length) return
    if (target === 'to') {
      setTo(prev => Array.from(new Set([...prev, ...emails])))
      setToInput('')
      setRecipientSearch('')
    } else if (target === 'cc') {
      setCc(prev => Array.from(new Set([...prev, ...emails])))
      setCcInput('')
    } else {
      setBcc(prev => Array.from(new Set([...prev, ...emails])))
      setBccInput('')
    }
  }

  const removeRecipient = (email: string, target: 'to' | 'cc' | 'bcc') => {
    if (target === 'to') setTo(prev => prev.filter(item => item !== email))
    else if (target === 'cc') setCc(prev => prev.filter(item => item !== email))
    else setBcc(prev => prev.filter(item => item !== email))
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

  useEffect(() => {
    if (!showPreview) return
    const t = setTimeout(() => {
      fetch('/api/emails/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texto: body || 'Tu mensaje aparecerá acá…',
          nombre: datosDestino?.nombre ?? '',
        }),
      })
        .then((res) => res.text())
        .then(setPrevia)
        .catch(() => setPrevia(''))
    }, 400)
    return () => clearTimeout(t)
  }, [body, showPreview, datosDestino])

  const medirPrevia = () => {
    const doc = marcoPrevia.current?.contentDocument
    if (doc) setAltoPrevia(doc.body.scrollHeight + 24)
  }

  const handleSend = async () => {
    setError('')
    if (!to.length || !subject.trim() || !body.trim()) {
      setError('Completá todos los campos')
      return
    }

    if (
      to.some(email => !EMAIL_REGEX.test(email)) ||
      cc.some(email => !EMAIL_REGEX.test(email)) ||
      bcc.some(email => !EMAIL_REGEX.test(email))
    ) {
      setError('Hay uno o más emails inválidos')
      return
    }

    if (avisoPendientes) {
      setError(avisoPendientes)
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
          bcc,
          subject: subject.trim(),
          text: body,
          destinatario: datosDestino?.nombre || undefined,
          attachments: attachmentsPayload,
        }),
      })

      if (res.ok) {
        try {
          localStorage.removeItem(DRAFT_STORAGE_KEY)
        } catch {
          // ignore
        }
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

      <PageHeader
        title="Redactar email"
        breadcrumbs={[{ label: 'Hoy', href: '/dashboard/admin' }, { label: 'Emails', href: '/dashboard/admin/emails' }, { label: 'Redactar' }]}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-surface rounded-card border border-line shadow-raise overflow-hidden">
          <div className="p-6 space-y-4">
            {/* Template selector */}
            <div>
              <label className="block text-body-sm font-semibold text-ink mb-1.5">Plantilla</label>
              <Select
                value={selectedTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
              >
                <option value="">Escribir desde cero</option>
                <optgroup label="Plantillas rápidas">
                  {TEMPLATES.map(t => (
                    <option key={t.key} value={t.key}>{t.name}</option>
                  ))}
                </optgroup>
                {dbTemplates.length > 0 && (
                  <optgroup label="Plantillas del sistema (BD)">
                    {dbTemplates.map(t => (
                      <option key={t.id} value={`db:${t.id}`}>{t.displayName}</option>
                    ))}
                  </optgroup>
                )}
              </Select>
              <p className="text-label text-ink-2 mt-1">
                Gestioná plantillas en{' '}
                <Link href="/dashboard/admin/emails/plantillas" className="text-primary font-semibold hover:underline">
                  Plantillas de correo
                </Link>
                .
              </p>
            </div>

            {/* To - with autocomplete */}
            <div ref={recipientRef} className="relative">
              <label className="block text-body-sm font-semibold text-ink mb-1.5">Destinatario</label>
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
                  className="w-full px-4 py-2 border border-line-strong rounded-control text-body-sm font-medium bg-surface text-ink placeholder:text-ink-2 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
                {toInput && (
                  <button
                    onClick={() => { setToInput(''); setRecipientSearch('') }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink-2 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Dropdown de destinatarios */}
              {showRecipients && filteredTramites.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-surface border border-line rounded-control shadow-raise max-h-56 overflow-y-auto">
                  <div className="px-3 py-2 border-b border-line">
                    <p className="text-label font-semibold text-ink-3">Clientes de trámites</p>
                  </div>
                  {filteredTramites.slice(0, 10).map(t => (
                    <button
                      key={t.id}
                      onClick={() => selectRecipient(t.user.email)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-surface-2 transition text-left cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-control bg-surface-3 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-ink-2" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm font-medium text-ink truncate">{t.user.name}</p>
                        <p className="text-label text-ink-2 truncate">{t.user.email}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <FileText className="w-3 h-3 text-ink-3" />
                        <span className="text-label text-ink-3 truncate max-w-[120px]">{t.denominacionSocial1}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {to.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {to.map(email => (
                    <span key={email} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-soft text-primary text-label font-medium">
                      {email}
                      <button type="button" onClick={() => removeRecipient(email, 'to')} className="text-primary hover:text-primary cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* CC */}
            <div>
              <label className="block text-body-sm font-semibold text-ink mb-1.5">CC (opcional)</label>
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
                className="w-full px-4 py-2 border border-line-strong rounded-control text-body-sm font-medium bg-surface text-ink placeholder:text-ink-2 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
              {cc.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {cc.map(email => (
                    <span key={email} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-3 text-ink-2 text-label font-medium">
                      {email}
                      <button type="button" onClick={() => removeRecipient(email, 'cc')} className="text-ink-2 hover:text-ink-2 cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* BCC */}
            <div>
              <label className="block text-body-sm font-semibold text-ink mb-1.5">BCC (copia oculta)</label>
              <input
                type="text"
                value={bccInput}
                onChange={(e) => setBccInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault()
                    addRecipients(bccInput, 'bcc')
                  }
                }}
                onBlur={() => addRecipients(bccInput, 'bcc')}
                placeholder="copia.oculta@empresa.com"
                className="w-full px-4 py-2 border border-line-strong rounded-control text-body-sm font-medium bg-surface text-ink placeholder:text-ink-2 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
              {bcc.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {bcc.map(email => (
                    <span key={email} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warning-soft text-warning text-label font-medium border border-warning-line">
                      {email}
                      <button type="button" onClick={() => removeRecipient(email, 'bcc')} className="text-warning hover:text-warning cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-body-sm font-semibold text-ink mb-1.5">Asunto</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Asunto del email"
                className="w-full px-4 py-2 border border-line-strong rounded-control text-body-sm font-medium bg-surface text-ink placeholder:text-ink-2 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-body-sm font-semibold text-ink mb-1.5">Mensaje</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Escribí tu mensaje..."
                rows={12}
                className="w-full px-4 py-3 border border-line-strong rounded-control text-body-sm font-medium bg-surface text-ink placeholder:text-ink-2 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none leading-relaxed"
              />
              {avisoPendientes && (
                <p className="mt-1.5 text-label font-medium text-warning">{avisoPendientes}</p>
              )}
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-body-sm font-semibold text-ink mb-1.5">Adjuntos</label>
              {/* `archivo={null}` mantiene la zona de arrastre siempre visible:
                  los adjuntos elegidos se listan abajo, no dentro del control. */}
              <FileInput
                multiple
                archivo={null}
                compacto
                label="Elegí archivos o arrastralos acá"
                ayuda="Máximo 10 MB por archivo, 20 MB totales"
                onChange={(e) => handleAttachmentPick(e.target.files)}
              />
              {attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {attachments.map(({ id, file }) => (
                    <div key={id} className="flex items-center justify-between text-label text-ink-2 bg-surface-2 rounded-control px-3 py-2">
                      <span className="truncate pr-3">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      <button type="button" onClick={() => removeAttachment(id)} className="text-danger hover:text-danger cursor-pointer">Quitar</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-danger-soft border border-danger-line text-danger px-4 py-3 rounded-control text-body-sm font-medium">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center justify-center gap-2 text-body-sm font-medium text-ink-2 hover:text-ink transition cursor-pointer py-2"
              >
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showPreview ? 'Ocultar preview' : 'Ver preview'}
              </button>

              <button
                onClick={handleSend}
                disabled={sending || !to.length || !subject.trim() || !body.trim() || !!avisoPendientes}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-primary text-on-primary rounded-control text-body-sm font-semibold hover:bg-primary-hover transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
          <div className="bg-surface rounded-card border border-line shadow-raise overflow-hidden">
            <div className="px-6 py-4 border-b border-line bg-surface-2">
              <p className="text-body-sm font-semibold text-ink">Vista previa</p>
              <p className="text-label text-ink-2 mt-0.5">Así se verá el email en la bandeja del destinatario</p>
            </div>
            <div className="p-6 bg-surface-3 overflow-x-auto">
              <iframe
                ref={marcoPrevia}
                srcDoc={previa}
                title="Vista previa del email"
                onLoad={medirPrevia}
                className="w-full max-w-[680px] mx-auto border-0 rounded-control bg-white block"
                style={{ height: altoPrevia }}
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
