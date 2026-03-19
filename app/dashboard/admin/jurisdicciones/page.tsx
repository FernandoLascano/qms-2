'use client'

import { useState, useEffect } from 'react'
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
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-700" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <span className="text-sm font-semibold text-brand-700 uppercase tracking-wider">Configuración</span>
          <h1 className="text-2xl font-black text-gray-900 mt-1">Jurisdicciones y Gastos</h1>
          <p className="text-gray-500 mt-1">Administrá las jurisdicciones disponibles y sus costos de inscripción</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-700 text-white rounded-xl text-sm font-semibold hover:bg-brand-800 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nueva jurisdicción
        </button>
      </div>

      {/* Crear nueva jurisdicción */}
      {showNew && (
        <div className="bg-white rounded-2xl border border-brand-200 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Nueva Jurisdicción</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Código (interno)</label>
              <input
                value={newCodigo}
                onChange={e => setNewCodigo(e.target.value.toUpperCase().replace(/[^A-Z_]/g, ''))}
                placeholder="Ej: MENDOZA, SANTA_FE"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-xs text-gray-400 mt-1">Solo letras mayúsculas y guiones bajos</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre visible</label>
              <input
                value={newNombre}
                onChange={e => setNewNombre(e.target.value)}
                placeholder="Ej: Mendoza (DPJ)"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => { setShowNew(false); setNewCodigo(''); setNewNombre('') }}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer"
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
              className="flex items-center gap-2 px-4 py-2 bg-brand-700 text-white rounded-xl text-sm font-semibold hover:bg-brand-800 disabled:opacity-50 cursor-pointer"
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
          <div key={j.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${j.habilitada ? 'border-gray-200' : 'border-gray-100 opacity-80'}`}>
            {/* Header de la jurisdicción */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${j.habilitada ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <MapPin className={`w-5 h-5 ${j.habilitada ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{j.nombre}</h3>
                  <p className="text-xs text-gray-500">{j.jurisdiccion}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Toggle habilitada */}
                <button
                  onClick={() => toggleHabilitada(j)}
                  disabled={saving === j.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    j.habilitada
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {j.habilitada ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {j.habilitada ? 'Habilitada' : 'Deshabilitada'}
                </button>

                {/* Editar */}
                {editingId !== j.id ? (
                  <button
                    onClick={() => startEdit(j)}
                    className="px-4 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                  >
                    Editar gastos
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={cancelEdit} className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer">
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving === j.id}
                      className="flex items-center gap-1 px-4 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-semibold hover:bg-orange-700 disabled:opacity-50 cursor-pointer"
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
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre visible</label>
                      <input
                        value={editData.nombre}
                        onChange={e => setEditData({ ...editData, nombre: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Total estimado</label>
                      <input
                        value={editData.totalEstimado || ''}
                        onChange={e => setEditData({ ...editData, totalEstimado: e.target.value })}
                        placeholder="Ej: ~$166.850"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">Conceptos de gastos</label>
                    <div className="space-y-2">
                      {editData.gastos.map((gasto, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            value={gasto.concepto}
                            onChange={e => updateGasto(i, 'concepto', e.target.value)}
                            placeholder="Concepto"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          <input
                            value={gasto.valor}
                            onChange={e => updateGasto(i, 'valor', e.target.value)}
                            placeholder="Valor"
                            className="w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          <button onClick={() => removeGasto(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={addGasto}
                      className="mt-2 flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar concepto
                    </button>
                  </div>
                </div>
              ) : (
                /* Modo lectura */
                <div className="space-y-2">
                  {(j.gastos as GastoItem[]).map((gasto, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-700">{gasto.concepto}</span>
                      <span className="text-sm font-semibold text-gray-900">{gasto.valor}</span>
                    </div>
                  ))}
                  {j.totalEstimado && (
                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-200">
                      <span className="text-sm font-bold text-gray-900">Total estimado</span>
                      <span className="text-lg font-black text-brand-700">{j.totalEstimado}</span>
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
