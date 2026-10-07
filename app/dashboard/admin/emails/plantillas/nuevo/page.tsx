'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/page-header'
import { Select } from '@/components/ui/select'

const CATEGORIES = ['general', 'tramite', 'pago', 'notificacion'] as const

export default function NuevaPlantillaPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('<p>Hola {{nombre}},</p>\n<p></p>\n<p>Saludos,<br/>QuieroMiSAS</p>')
  const [variables, setVariables] = useState('nombre')
  const [category, setCategory] = useState<string>('general')
  const [isActive, setIsActive] = useState(true)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
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
      toast.success('Plantilla creada')
      router.push(`/dashboard/admin/emails/plantillas/${data.id}`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">

      <PageHeader
        title="Nueva plantilla"
        description="Clave interna única: minúsculas, números y guiones; empieza con una letra."
        breadcrumbs={[{ label: 'Hoy', href: '/dashboard/admin' }, { label: 'Emails', href: '/dashboard/admin/emails' }, { label: 'Plantillas', href: '/dashboard/admin/emails/plantillas' }, { label: 'Nueva' }]}
      />

      <div className="bg-surface rounded-card border border-line shadow-raise p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-label font-semibold text-ink-2 mb-1">Clave interna (name)</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej. recordatorio_documentacion"
              className="w-full px-3 py-2 border border-line rounded-control text-body-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-label font-semibold text-ink-2 mb-1">Nombre visible</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="ej. Recordatorio de documentación"
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
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-body-sm font-medium text-ink-2 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Activa (visible al redactar)
            </label>
          </div>
        </div>

        <div>
          <label className="block text-label font-semibold text-ink-2 mb-1">Variables (separadas por coma)</label>
          <input
            value={variables}
            onChange={(e) => setVariables(e.target.value)}
            placeholder="nombre, tramiteId"
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
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
