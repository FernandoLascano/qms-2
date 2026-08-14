'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { PageSkeleton } from '@/components/ui/states'
import { MapPin, Save, Loader2, Plus, Trash2, GripVertical, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

interface GastoItem {
  concepto: string
  valor: string
}

interface Jurisdiccion {
  id: string
  jurisdiccion: string
  nombre: string
  habilitada: boolean
  gastos: GastoItem[]
  totalEstimado: string | null
  orden: number
  observaciones: string | null
}

export default function JurisdiccionesPage() {
  const [jurisdicciones, setJurisdicciones] = useState<Jurisdiccion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Estado local para edición
  const [editData, setEditData] = useState<Jurisdiccion | null>(null)

  // Estado para crear nueva
  const [showNew, setShowNew] = useState(false)
  const [newCodigo, setNewCodigo] = useState('')
  const [newNombre, setNewNombre] = useState('')
  const [creando, setCreando] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/jurisdicciones')
      const data = await res.json()
      setJurisdicciones(data)
    } catch {
      toast.error('Error al cargar jurisdicciones')
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (j: Jurisdiccion) => {
    setEditingId(j.id)
    setEditData(JSON.parse(JSON.stringify(j)))
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditData(null)
  }

  const handleSave = async () => {
    if (!editData) return
    setSaving(editData.id)
    try {
      const res = await fetch(`/api/admin/jurisdicciones/${editData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: editData.nombre,
          habilitada: editData.habilitada,
          gastos: editData.gastos,
          totalEstimado: editData.totalEstimado,
          observaciones: editData.observaciones,
        }),
      })
      if (res.ok) {
        toast.success(`${editData.nombre} actualizada`)
        setEditingId(null)
        setEditData(null)
        fetchData()
      } else {
        toast.error('Error al guardar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving(null)
    }
  }

  const toggleHabilitada = async (j: Jurisdiccion) => {
    setSaving(j.id)
    try {
      const res = await fetch(`/api/admin/jurisdicciones/${j.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habilitada: !j.habilitada }),
      })
      if (res.ok) {
        toast.success(`${j.nombre} ${!j.habilitada ? 'habilitada' : 'deshabilitada'}`)
        fetchData()
      }
    } catch {
      toast.error('Error')
    } finally {
      setSaving(null)
    }
  }

  const addGasto = () => {
    if (!editData) return
    setEditData({
      ...editData,
      gastos: [...editData.gastos, { concepto: '', valor: '' }],
    })
  }

  const removeGasto = (index: number) => {
    if (!editData) return
    setEditData({
      ...editData,
      gastos: editData.gastos.filter((_, i) => i !== index),
    })
  }

  const updateGasto = (index: number, field: 'concepto' | 'valor', value: string) => {
    if (!editData) return
    const gastos = [...editData.gastos]
    gastos[index] = { ...gastos[index], [field]: value }
    setEditData({ ...editData, gastos })
  }

  if (loading) {
    return (
      <div className="space-y-section">
        <PageHeader
          title="Jurisdicciones"
          description="Gastos y parámetros por jurisdicción."
          breadcrumbs={[{ label: 'Hoy', href: '/dashboard/admin' }, { label: 'Jurisdicciones' }]}
        />
        <PageSkeleton cards={2} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <span className="text-body-sm font-semibold text-primary uppercase tracking-wider">Configuración</span>
          <h1 className="text-title font-semibold text-ink mt-1">Jurisdicciones y Gastos</h1>
          <p className="text-ink-2 mt-1">Administrá las jurisdicciones disponibles y sus costos de inscripción</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-control text-body-sm font-semibold hover:bg-primary-hover transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nueva jurisdicción
        </button>
      </div>

      {/* Crear nueva jurisdicción */}
      {showNew && (
        <div className="bg-surface rounded-card border border-primary-line shadow-raise p-6">
          <h3 className="font-semibold text-ink mb-4">Nueva Jurisdicción</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-body-sm font-semibold text-ink-2 mb-1">Código (interno)</label>
              <input
                value={newCodigo}
                onChange={e => setNewCodigo(e.target.value.toUpperCase().replace(/[^A-Z_]/g, ''))}
                placeholder="Ej: MENDOZA, SANTA_FE"
                className="w-full px-3 py-2 border border-line-strong rounded-control text-body-sm text-ink focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-label text-ink-3 mt-1">Solo letras mayúsculas y guiones bajos</p>
            </div>
            <div>
              <label className="block text-body-sm font-semibold text-ink-2 mb-1">Nombre visible</label>
              <input
                value={newNombre}
                onChange={e => setNewNombre(e.target.value)}
                placeholder="Ej: Mendoza (DPJ)"
                className="w-full px-3 py-2 border border-line-strong rounded-control text-body-sm text-ink focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => { setShowNew(false); setNewCodigo(''); setNewNombre('') }}
              className="px-4 py-2 text-body-sm font-medium text-ink-2 hover:bg-surface-3 rounded-control cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={async () => {
                if (!newCodigo.trim() || !newNombre.trim()) { toast.error('Completá código y nombre'); return }
                setCreando(true)
                try {
                  const res = await fetch('/api/admin/jurisdicciones', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jurisdiccion: newCodigo, nombre: newNombre }),
                  })
                  if (res.ok) {
                    toast.success('Jurisdicción creada. Editá los gastos y habilitala cuando esté lista.')
                    setShowNew(false)
                    setNewCodigo('')
                    setNewNombre('')
                    fetchData()
                  } else {
                    const err = await res.json()
                    toast.error(err.error || 'Error al crear')
                  }
                } catch { toast.error('Error de conexión') }
                finally { setCreando(false) }
              }}
              disabled={creando || !newCodigo.trim() || !newNombre.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-control text-body-sm font-semibold hover:bg-primary-hover disabled:opacity-50 cursor-pointer"
            >
              {creando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Crear jurisdicción
            </button>
          </div>
        </div>
      )}

      {/* Lista de jurisdicciones */}
      <div className="space-y-6">
        {jurisdicciones.map(j => (
          <div key={j.id} className={`bg-surface rounded-card border shadow-raise overflow-hidden ${j.habilitada ? 'border-line' : 'border-line opacity-80'}`}>
            {/* Header de la jurisdicción */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-line">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-control flex items-center justify-center ${j.habilitada ? 'bg-success-soft' : 'bg-surface-3'}`}>
                  <MapPin className={`w-5 h-5 ${j.habilitada ? 'text-success' : 'text-ink-3'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-ink">{j.nombre}</h3>
                  <p className="text-label text-ink-2">{j.jurisdiccion}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Toggle habilitada */}
                <button
                  onClick={() => toggleHabilitada(j)}
                  disabled={saving === j.id}
                  className={`flex items-center gap-2 px-3 py-1 rounded-control text-label font-semibold transition cursor-pointer ${
                    j.habilitada
                      ? 'bg-success-soft text-success hover:bg-success-solid'
                      : 'bg-surface-3 text-ink-2 hover:bg-n-200'
                  }`}
                >
                  {j.habilitada ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {j.habilitada ? 'Habilitada' : 'Deshabilitada'}
                </button>

                {/* Editar */}
                {editingId !== j.id ? (
                  <button
                    onClick={() => startEdit(j)}
                    className="px-4 py-1 border border-line rounded-control text-label font-semibold text-ink-2 hover:bg-surface-2 transition cursor-pointer"
                  >
                    Editar gastos
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={cancelEdit} className="px-3 py-1 text-label font-medium text-ink-2 hover:bg-surface-3 rounded-control cursor-pointer">
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving === j.id}
                      className="flex items-center gap-1 px-4 py-1 bg-warning-solid text-on-primary rounded-control text-label font-semibold hover:bg-warning-solid disabled:opacity-50 cursor-pointer"
                    >
                      {saving === j.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      Guardar
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Gastos */}
            <div className="px-6 py-4">
              {editingId === j.id && editData ? (
                /* Modo edición */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div>
                      <label className="block text-label font-semibold text-ink-2 mb-1">Nombre visible</label>
                      <input
                        value={editData.nombre}
                        onChange={e => setEditData({ ...editData, nombre: e.target.value })}
                        className="w-full px-3 py-2 border border-line-strong rounded-control text-body-sm text-ink focus:outline-none focus:ring-2 focus:ring-warning-solid"
                      />
                    </div>
                    <div>
                      <label className="block text-label font-semibold text-ink-2 mb-1">Total estimado</label>
                      <input
                        value={editData.totalEstimado || ''}
                        onChange={e => setEditData({ ...editData, totalEstimado: e.target.value })}
                        placeholder="Ej: ~$166.850"
                        className="w-full px-3 py-2 border border-line-strong rounded-control text-body-sm text-ink focus:outline-none focus:ring-2 focus:ring-warning-solid"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-label font-semibold text-ink-2 mb-2">Conceptos de gastos</label>
                    <div className="space-y-2">
                      {editData.gastos.map((gasto, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            value={gasto.concepto}
                            onChange={e => updateGasto(i, 'concepto', e.target.value)}
                            placeholder="Concepto"
                            className="flex-1 px-3 py-2 border border-line-strong rounded-control text-body-sm text-ink focus:outline-none focus:ring-2 focus:ring-warning-solid"
                          />
                          <input
                            value={gasto.valor}
                            onChange={e => updateGasto(i, 'valor', e.target.value)}
                            placeholder="Valor"
                            className="w-48 px-3 py-2 border border-line-strong rounded-control text-body-sm text-ink focus:outline-none focus:ring-2 focus:ring-warning-solid"
                          />
                          <button onClick={() => removeGasto(i)} className="p-2 text-danger hover:bg-danger-soft rounded-control cursor-pointer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={addGasto}
                      className="mt-2 flex items-center gap-1 text-label font-medium text-warning hover:text-warning cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar concepto
                    </button>
                  </div>
                </div>
              ) : (
                /* Modo lectura */
                <div className="space-y-2">
                  {(j.gastos as GastoItem[]).map((gasto, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-line last:border-0">
                      <span className="text-body-sm text-ink-2">{gasto.concepto}</span>
                      <span className="text-body-sm font-semibold text-ink">{gasto.valor}</span>
                    </div>
                  ))}
                  {j.totalEstimado && (
                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-line">
                      <span className="text-body-sm font-semibold text-ink">Total estimado</span>
                      <span className="text-heading font-semibold text-primary">{j.totalEstimado}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
