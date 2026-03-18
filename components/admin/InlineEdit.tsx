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
      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-orange-600 transition cursor-pointer"
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
        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 transition disabled:opacity-50 cursor-pointer"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Guardando...' : 'Guardar'}
      </button>
      <button
        onClick={onCancel}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
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
