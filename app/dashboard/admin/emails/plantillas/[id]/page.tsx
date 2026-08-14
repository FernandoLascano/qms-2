'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Save, Shield } from 'lucide-react'
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
    <div className="space-y-6 max-w-4xl">
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
          <label className="block text-label font-semibold text-ink-2 mb-1">Cuerpo HTML</label>
          <textarea
            value={bodyHtml}
            onChange={(e) => setBodyHtml(e.target.value)}
            rows={16}
            className="w-full px-3 py-2 border border-line rounded-control text-body-sm font-mono leading-relaxed"
          />
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
