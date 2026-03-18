'use client'

import { useState } from 'react'
import { Pencil, Save, X, Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface EditableSectionsProps {
  tramiteId: string
  tramite: {
    denominacionSocial1: string
    denominacionSocial2: string | null
    denominacionSocial3: string | null
    objetoSocial: string
    domicilioLegal: string
    capitalSocial: number
    socios: any[]
    administradores: any[]
    datosUsuario: any
  }
}

// Botón de editar para el header de CollapsibleCard
export function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className="p-1.5 rounded-lg hover:bg-orange-100 text-gray-400 hover:text-orange-600 transition cursor-pointer"
      title="Editar"
    >
      <Pencil className="w-4 h-4" />
    </button>
  )
}

// Hook para manejar la edición
function useEdit(tramiteId: string) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const save = async (data: Record<string, any>, onSuccess?: () => void) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/tramites/${tramiteId}/editar-formulario`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        toast.success('Información actualizada')
        onSuccess?.()
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

  return { saving, save }
}

// ===== MODAL DE EDICIÓN DE DENOMINACIONES =====
export function EditDenominaciones({ tramiteId, tramite }: EditableSectionsProps) {
  const [open, setOpen] = useState(false)
  const [d1, setD1] = useState(tramite.denominacionSocial1)
  const [d2, setD2] = useState(tramite.denominacionSocial2 || '')
  const [d3, setD3] = useState(tramite.denominacionSocial3 || '')
  const { saving, save } = useEdit(tramiteId)

  const handleSave = () => {
    if (!d1.trim()) { toast.error('La denominación 1 es obligatoria'); return }
    save({
      denominacionSocial1: d1.trim(),
      denominacionSocial2: d2.trim() || null,
      denominacionSocial3: d3.trim() || null,
    }, () => setOpen(false))
  }

  const handleCancel = () => {
    setD1(tramite.denominacionSocial1)
    setD2(tramite.denominacionSocial2 || '')
    setD3(tramite.denominacionSocial3 || '')
    setOpen(false)
  }

  if (!open) return <EditButton onClick={() => setOpen(true)} />

  return (
    <>
      <EditButton onClick={() => setOpen(false)} />
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => handleCancel()}>
        <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <h3 className="text-lg font-bold text-gray-900">Editar Denominaciones</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Denominación 1 (Preferida) *</label>
              <input value={d1} onChange={e => setD1(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Denominación 2</label>
              <input value={d2} onChange={e => setD2(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Denominación 3</label>
              <input value={d3} onChange={e => setD3(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={handleCancel} disabled={saving} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 cursor-pointer">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ===== MODAL DE EDICIÓN DE OBJETO SOCIAL =====
export function EditObjetoSocial({ tramiteId, tramite }: EditableSectionsProps) {
  const [open, setOpen] = useState(false)
  const [valor, setValor] = useState(tramite.objetoSocial)
  const { saving, save } = useEdit(tramiteId)

  const handleSave = () => {
    if (!valor.trim()) { toast.error('El objeto social es obligatorio'); return }
    save({ objetoSocial: valor.trim() }, () => setOpen(false))
  }

  if (!open) return <EditButton onClick={() => setOpen(true)} />

  return (
    <>
      <EditButton onClick={() => setOpen(false)} />
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setValor(tramite.objetoSocial); setOpen(false) }}>
        <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <h3 className="text-lg font-bold text-gray-900">Editar Objeto Social</h3>
          <textarea value={valor} onChange={e => setValor(e.target.value)} rows={10} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
          <div className="flex justify-end gap-2">
            <button onClick={() => { setValor(tramite.objetoSocial); setOpen(false) }} disabled={saving} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 cursor-pointer">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ===== MODAL DE EDICIÓN DE DOMICILIO =====
export function EditDomicilio({ tramiteId, tramite }: EditableSectionsProps) {
  const [open, setOpen] = useState(false)
  const [valor, setValor] = useState(tramite.domicilioLegal)
  const { saving, save } = useEdit(tramiteId)

  const handleSave = () => {
    if (!valor.trim()) { toast.error('El domicilio es obligatorio'); return }
    save({ domicilioLegal: valor.trim() }, () => setOpen(false))
  }

  if (!open) return <EditButton onClick={() => setOpen(true)} />

  return (
    <>
      <EditButton onClick={() => setOpen(false)} />
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setValor(tramite.domicilioLegal); setOpen(false) }}>
        <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
          <h3 className="text-lg font-bold text-gray-900">Editar Domicilio Legal</h3>
          <input value={valor} onChange={e => setValor(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <div className="flex justify-end gap-2">
            <button onClick={() => { setValor(tramite.domicilioLegal); setOpen(false) }} disabled={saving} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 cursor-pointer">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ===== MODAL DE EDICIÓN DE INFO GENERAL (capital, cierre, etc.) =====
export function EditInfoGeneral({ tramiteId, tramite }: EditableSectionsProps) {
  const [open, setOpen] = useState(false)
  const [capital, setCapital] = useState(String(tramite.capitalSocial))
  const datosUsuario = tramite.datosUsuario || {}
  const [fechaCierre, setFechaCierre] = useState(datosUsuario.fechaCierre || '')
  const { saving, save } = useEdit(tramiteId)

  const handleSave = () => {
    const capitalNum = parseFloat(capital.replace(/\./g, '').replace(',', '.'))
    if (isNaN(capitalNum) || capitalNum <= 0) { toast.error('Capital social inválido'); return }
    save({
      capitalSocial: capitalNum,
      datosUsuario: { fechaCierre },
    }, () => setOpen(false))
  }

  if (!open) return <EditButton onClick={() => setOpen(true)} />

  return (
    <>
      <EditButton onClick={() => setOpen(false)} />
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
        <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
          <h3 className="text-lg font-bold text-gray-900">Editar Información General</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Capital Social (ARS)</label>
              <input value={capital} onChange={e => setCapital(e.target.value.replace(/[^\d.,]/g, ''))} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Cierre de Ejercicio</label>
              <input value={fechaCierre} onChange={e => setFechaCierre(e.target.value)} placeholder="Ej: 31/12" className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setOpen(false)} disabled={saving} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 cursor-pointer">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ===== MODAL DE EDICIÓN DE SOCIOS =====
export function EditSocios({ tramiteId, tramite }: EditableSectionsProps) {
  const [open, setOpen] = useState(false)
  const [socios, setSocios] = useState<any[]>(JSON.parse(JSON.stringify(tramite.socios)))
  const { saving, save } = useEdit(tramiteId)

  const campos = [
    { key: 'nombre', label: 'Nombre', required: true },
    { key: 'apellido', label: 'Apellido', required: true },
    { key: 'dni', label: 'DNI', required: true },
    { key: 'cuit', label: 'CUIT', required: true },
    { key: 'email', label: 'Email' },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'domicilio', label: 'Domicilio' },
    { key: 'ciudad', label: 'Ciudad' },
    { key: 'provincia', label: 'Provincia' },
    { key: 'nacionalidad', label: 'Nacionalidad' },
    { key: 'estadoCivil', label: 'Estado Civil' },
    { key: 'profesion', label: 'Profesión' },
    { key: 'fechaNacimiento', label: 'Fecha Nacimiento' },
    { key: 'aporteCapital', label: 'Aporte Capital' },
    { key: 'aportePorcentaje', label: 'Porcentaje (%)' },
  ]

  const updateSocio = (index: number, field: string, value: string) => {
    const updated = [...socios]
    updated[index] = { ...updated[index], [field]: value }
    setSocios(updated)
  }

  const handleSave = () => {
    for (const socio of socios) {
      if (!socio.nombre?.trim() || !socio.apellido?.trim()) {
        toast.error('Nombre y apellido son obligatorios para cada socio')
        return
      }
    }
    save({ socios }, () => setOpen(false))
  }

  const handleCancel = () => {
    setSocios(JSON.parse(JSON.stringify(tramite.socios)))
    setOpen(false)
  }

  if (!open) return <EditButton onClick={() => setOpen(true)} />

  return (
    <>
      <EditButton onClick={() => setOpen(false)} />
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={handleCancel}>
        <div className="bg-white rounded-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Editar Socios / Accionistas</h3>
          <div className="space-y-6">
            {socios.map((socio, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900">Socio #{index + 1}</h4>
                  {socios.length > 1 && (
                    <button onClick={() => setSocios(socios.filter((_, i) => i !== index))} className="p-1 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {campos.map(campo => (
                    <div key={campo.key}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{campo.label}{campo.required ? ' *' : ''}</label>
                      <input
                        value={socio[campo.key] || ''}
                        onChange={e => updateSocio(index, campo.key, e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setSocios([...socios, { nombre: '', apellido: '', dni: '', cuit: '' }])}
            className="mt-4 flex items-center gap-2 text-sm font-medium text-orange-600 hover:text-orange-700 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Agregar socio
          </button>
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <button onClick={handleCancel} disabled={saving} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 cursor-pointer">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ===== MODAL DE EDICIÓN DE ADMINISTRADORES =====
export function EditAdministradores({ tramiteId, tramite }: EditableSectionsProps) {
  const [open, setOpen] = useState(false)
  const [admins, setAdmins] = useState<any[]>(JSON.parse(JSON.stringify(tramite.administradores)))
  const { saving, save } = useEdit(tramiteId)

  const campos = [
    { key: 'nombre', label: 'Nombre', required: true },
    { key: 'apellido', label: 'Apellido', required: true },
    { key: 'dni', label: 'DNI' },
    { key: 'cuit', label: 'CUIT' },
    { key: 'cargo', label: 'Cargo', required: true },
    { key: 'email', label: 'Email' },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'domicilio', label: 'Domicilio' },
    { key: 'nacionalidad', label: 'Nacionalidad' },
    { key: 'estadoCivil', label: 'Estado Civil' },
    { key: 'profesion', label: 'Profesión' },
  ]

  const updateAdmin = (index: number, field: string, value: string) => {
    const updated = [...admins]
    updated[index] = { ...updated[index], [field]: value }
    setAdmins(updated)
  }

  const handleSave = () => {
    for (const admin of admins) {
      if (!admin.nombre?.trim() || !admin.apellido?.trim()) {
        toast.error('Nombre y apellido son obligatorios')
        return
      }
    }
    save({ administradores: admins }, () => setOpen(false))
  }

  const handleCancel = () => {
    setAdmins(JSON.parse(JSON.stringify(tramite.administradores)))
    setOpen(false)
  }

  if (!open) return <EditButton onClick={() => setOpen(true)} />

  return (
    <>
      <EditButton onClick={() => setOpen(false)} />
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={handleCancel}>
        <div className="bg-white rounded-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Editar Administradores</h3>
          <div className="space-y-6">
            {admins.map((admin, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900">Administrador #{index + 1}</h4>
                  {admins.length > 1 && (
                    <button onClick={() => setAdmins(admins.filter((_, i) => i !== index))} className="p-1 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {campos.map(campo => (
                    <div key={campo.key}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{campo.label}{campo.required ? ' *' : ''}</label>
                      <input
                        value={admin[campo.key] || ''}
                        onChange={e => updateAdmin(index, campo.key, e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setAdmins([...admins, { nombre: '', apellido: '', cargo: '' }])}
            className="mt-4 flex items-center gap-2 text-sm font-medium text-orange-600 hover:text-orange-700 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Agregar administrador
          </button>
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <button onClick={handleCancel} disabled={saving} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 cursor-pointer">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
