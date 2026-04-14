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
        <Loader2 className="w-8 h-8 animate-spin text-brand-700" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/dashboard/admin/emails/plantillas"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a plantillas
      </Link>

      <div className="flex items-start gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Editar plantilla</h1>
          <p className="text-sm text-gray-500 mt-1">{tpl.displayName}</p>
        </div>
        {tpl.isSystem && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-100 px-2 py-1 rounded-lg">
            <Shield className="w-3.5 h-3.5" />
            Sistema (no se puede eliminar ni cambiar la clave)
          </span>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Clave interna</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={tpl.isSystem}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre visible</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Asunto</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Activa
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Variables (coma)</label>
          <input
            value={variables}
            onChange={(e) => setVariables(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Cuerpo HTML</label>
          <textarea
            value={bodyHtml}
            onChange={(e) => setBodyHtml(e.target.value)}
            rows={16}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono leading-relaxed"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-700 text-white rounded-xl text-sm font-semibold hover:bg-brand-800 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  )
}
