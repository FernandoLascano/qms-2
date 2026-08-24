'use client'

import { useState } from 'react'
import { Pencil, Save, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface InlineEditProps {
  tramiteId: string
  section: string
  children: (props: {
    editing: boolean
    saving: boolean
    onSave: (data: Record<string, any>) => Promise<void>
    onCancel: () => void
  }) => React.ReactNode
  onStartEdit?: () => void
}

export function InlineEditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className="p-2 rounded-control hover:bg-surface-3 text-ink-3 hover:text-warning transition cursor-pointer"
      title="Editar"
    >
      <Pencil className="w-4 h-4" />
    </button>
  )
}

export function InlineEditActions({ saving, onSave, onCancel }: {
  saving: boolean
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="flex gap-2 mt-4">
      <button
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-warning-solid text-on-primary rounded-control text-body-sm font-semibold hover:bg-warning-solid transition disabled:opacity-50 cursor-pointer"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Guardando...' : 'Guardar'}
      </button>
      <button
        onClick={onCancel}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 border border-line rounded-control text-body-sm font-medium text-ink-2 hover:bg-surface-2 transition cursor-pointer"
      >
        <X className="w-4 h-4" />
        Cancelar
      </button>
    </div>
  )
}

export function useInlineEdit(tramiteId: string) {
  const router = useRouter()
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const startEdit = (section: string) => setEditing(section)
  const cancelEdit = () => setEditing(null)
  const isEditing = (section: string) => editing === section

  const saveEdit = async (data: Record<string, any>) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/tramites/${tramiteId}/editar-formulario`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        toast.success('Información actualizada')
        setEditing(null)
        router.refresh()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Error al guardar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  return { editing, saving, startEdit, cancelEdit, isEditing, saveEdit }
}
