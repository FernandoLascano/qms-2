'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Save, Shield, Code2, Eye } from 'lucide-react'
import { toast } from 'sonner'

const CATEGORIES = ['general', 'tramite', 'pago', 'notificacion'] as const

interface Tpl {
  id: string
  name: string
  displayName: string
  subject: string
  bodyHtml: string
  variables: string[]
  category: string
  isActive: boolean
  isSystem: boolean
}

export default function EditarPlantillaPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tpl, setTpl] = useState<Tpl | null>(null)
  const [name, setName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [variables, setVariables] = useState('')
  const [category, setCategory] = useState('general')
  const [isActive, setIsActive] = useState(true)

  // Vista previa: el HTML se manda al servidor para que lo devuelva dentro del
  // mismo sobre que usan los mails automáticos. Va con retardo para no pedirla
  // en cada tecla.
  const [vista, setVista] = useState<'html' | 'previa'>('html')
  const [previa, setPrevia] = useState('')
  const [altoPrevia, setAltoPrevia] = useState(600)
  const marco = useRef<HTMLIFrameElement>(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/email-templates/${id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTpl(data)
      setName(data.name)
      setDisplayName(data.displayName)
      setSubject(data.subject)
      setBodyHtml(data.bodyHtml)
      setVariables(Array.isArray(data.variables) ? data.variables.join(', ') : '')
      setCategory(data.category || 'general')
      setIsActive(data.isActive !== false)
    } catch {
      toast.error('No se pudo cargar la plantilla')
      router.push('/dashboard/admin/emails/plantillas')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!bodyHtml) {
      setPrevia('')
      return
    }
    const t = setTimeout(() => {
      fetch('/api/emails/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bodyHtml }),
      })
        .then((res) => res.text())
        .then(setPrevia)
        .catch(() => setPrevia(''))
    }, 400)
    return () => clearTimeout(t)
  }, [bodyHtml])

  const medirPrevia = () => {
    const doc = marco.current?.contentDocument
    if (doc) setAltoPrevia(doc.body.scrollHeight + 24)
  }

  const handleSave = async () => {
    if (!id) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/email-templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tpl?.isSystem ? undefined : name,
          displayName,
          subject,
          bodyHtml,
          variables,
          category,
          isActive,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Error al guardar')
      toast.success('Plantilla actualizada')
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !tpl) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <Link
        href="/dashboard/admin/emails/plantillas"
        className="inline-flex items-center gap-2 text-body-sm text-ink-2 hover:text-ink-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a plantillas
      </Link>

      <div className="flex items-start gap-3">
        <div>
          <h1 className="text-title font-semibold text-ink">Editar plantilla</h1>
          <p className="text-body-sm text-ink-2 mt-1">{tpl.displayName}</p>
        </div>
        {tpl.isSystem && (
          <span className="inline-flex items-center gap-1 text-label font-semibold text-warning bg-warning-soft px-2 py-1 rounded-control">
            <Shield className="w-3.5 h-3.5" />
            Sistema (no se puede eliminar ni cambiar la clave)
          </span>
        )}
      </div>

      <div className="bg-surface rounded-card border border-line shadow-raise p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-label font-semibold text-ink-2 mb-1">Clave interna</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={tpl.isSystem}
              className="w-full px-3 py-2 border border-line rounded-control text-body-sm font-mono disabled:bg-surface-3 disabled:text-ink-2"
            />
          </div>
          <div>
            <label className="block text-label font-semibold text-ink-2 mb-1">Nombre visible</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-line rounded-control text-body-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-label font-semibold text-ink-2 mb-1">Asunto</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 border border-line rounded-control text-body-sm"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-label font-semibold text-ink-2 mb-1">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-line rounded-control text-body-sm bg-surface"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-body-sm font-medium text-ink-2 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Activa
            </label>
          </div>
        </div>

        <div>
          <label className="block text-label font-semibold text-ink-2 mb-1">Variables (coma)</label>
          <input
            value={variables}
            onChange={(e) => setVariables(e.target.value)}
            className="w-full px-3 py-2 border border-line rounded-control text-body-sm"
          />
        </div>

        <div>
          <div className="flex items-center justify-between gap-4 mb-1">
            <label className="block text-label font-semibold text-ink-2">Cuerpo</label>
            <div className="flex items-center rounded-control border border-line p-0.5">
              <button
                type="button"
                onClick={() => setVista('html')}
                aria-pressed={vista === 'html'}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-chip text-label font-semibold transition ${
                  vista === 'html' ? 'bg-surface-3 text-ink' : 'text-ink-2 hover:text-ink'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                HTML
              </button>
              <button
                type="button"
                onClick={() => setVista('previa')}
                aria-pressed={vista === 'previa'}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-chip text-label font-semibold transition ${
                  vista === 'previa' ? 'bg-surface-3 text-ink' : 'text-ink-2 hover:text-ink'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Vista previa
              </button>
            </div>
          </div>

          {vista === 'html' ? (
            <textarea
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              rows={16}
              spellCheck={false}
              className="w-full px-3 py-2 border border-line rounded-control text-body-sm font-mono leading-relaxed"
            />
          ) : (
            <div className="rounded-control border border-line bg-surface-2 p-4 overflow-x-auto">
              {previa ? (
                <iframe
                  ref={marco}
                  srcDoc={previa}
                  title="Vista previa de la plantilla"
                  onLoad={medirPrevia}
                  className="w-full max-w-[680px] mx-auto border-0 rounded-control bg-white block"
                  style={{ height: altoPrevia }}
                  sandbox="allow-same-origin"
                />
              ) : (
                <p className="py-12 text-center text-body-sm text-ink-3">
                  Escribí el cuerpo para ver la vista previa.
                </p>
              )}
            </div>
          )}

          <p className="mt-2 text-label text-ink-3">
            La vista previa muestra el cuerpo dentro del sobre de QuieroMiSAS, con las variables
            rellenadas con datos de ejemplo.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-on-primary rounded-control text-body-sm font-semibold hover:bg-primary-hover disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  )
}
