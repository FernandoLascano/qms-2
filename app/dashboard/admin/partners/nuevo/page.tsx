'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NuevoPartnerPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')
  const [slug, setSlug] = useState('')
  const [beneficios, setBeneficios] = useState('')
  const [condicionesNotas, setCondicionesNotas] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [aplicaDescuento, setAplicaDescuento] = useState(true)
  const [descuentoTipo, setDescuentoTipo] = useState<'MONTO' | 'PORCENTAJE'>('PORCENTAJE')
  const [descuentoValor, setDescuentoValor] = useState('')
  const [aplicaComision, setAplicaComision] = useState(false)
  const [comisionPorcentaje, setComisionPorcentaje] = useState('')

  const handleLogoUpload = async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/admin/partners/upload-logo', {
        method: 'POST',
        body: formData,
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'No se pudo subir el logo')
      setLogoUrl(payload.url)
    } catch (err: any) {
      setError(err.message || 'Error al subir logo')
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          slug,
          beneficios: beneficios.split('\n').map((item) => item.trim()).filter(Boolean),
          condicionesNotas,
          logoUrl: logoUrl || null,
          aplicaDescuento,
          descuentoTipo,
          descuentoValor: descuentoValor ? Number(descuentoValor) : null,
          aplicaComision,
          comisionPorcentaje: comisionPorcentaje ? Number(comisionPorcentaje) : null,
        }),
      })

      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'No se pudo crear el partner')

      router.push(`/dashboard/admin/partners/${payload.id}`)
    } catch (err: any) {
      setError(err.message || 'Error inesperado')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-title font-semibold text-ink">Nuevo partner</h1>
        <p className="text-ink-2">Configurá condiciones económicas y beneficios.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-card border border-line bg-surface p-6">
        {error && <div className="rounded-control bg-danger-soft px-3 py-2 text-body-sm text-danger">{error}</div>}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-body-sm font-medium text-ink-2">
            Nombre
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="mt-1 w-full rounded-control border border-line-strong px-3 py-2 text-ink" required />
          </label>
          <label className="text-body-sm font-medium text-ink-2">
            Slug (opcional)
            <input value={slug} onChange={(e) => setSlug(e.target.value)} className="mt-1 w-full rounded-control border border-line-strong px-3 py-2 text-ink" />
          </label>
        </div>

        <label className="block text-body-sm font-medium text-ink-2">
          Beneficios (uno por línea)
          <textarea value={beneficios} onChange={(e) => setBeneficios(e.target.value)} rows={5} className="mt-1 w-full rounded-control border border-line-strong px-3 py-2 text-ink" />
        </label>

        <label className="block text-body-sm font-medium text-ink-2">
          Notas de condiciones
          <textarea value={condicionesNotas} onChange={(e) => setCondicionesNotas(e.target.value)} rows={3} className="mt-1 w-full rounded-control border border-line-strong px-3 py-2 text-ink" />
        </label>

        <div className="space-y-2">
          <p className="text-body-sm font-medium text-ink-2">Logo del partner</p>
          {logoUrl && (
            <div className="flex h-12 max-w-xs items-center justify-start rounded-control border border-line bg-surface px-2">
              <img src={logoUrl} alt="Logo partner" className="h-full w-full object-contain object-left" />
            </div>
          )}
          <label className="inline-flex cursor-pointer items-center rounded-control border border-line-strong bg-surface px-3 py-2 text-body-sm text-ink-2 hover:border-primary-line">
            {uploading ? 'Subiendo logo...' : 'Seleccionar logo'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleLogoUpload(file)
              }}
            />
          </label>
          <p className="text-label text-ink-2">Opcional. Podés subirlo ahora o después desde el detalle.</p>
        </div>

        <div className="space-y-4 rounded-control border border-line p-4">
          <h2 className="font-semibold text-ink">Condiciones económicas</h2>

          <label className="flex items-center gap-2 text-body-sm text-ink-2">
            <input type="checkbox" checked={aplicaDescuento} onChange={(e) => setAplicaDescuento(e.target.checked)} />
            Aplicar descuento sobre valores actuales
          </label>

          {aplicaDescuento && (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-body-sm text-ink-2">
                Tipo de descuento
                <select value={descuentoTipo} onChange={(e) => setDescuentoTipo(e.target.value as 'MONTO' | 'PORCENTAJE')} className="mt-1 w-full rounded-control border border-line-strong px-3 py-2 text-ink">
                  <option value="PORCENTAJE">Porcentaje</option>
                  <option value="MONTO">Monto fijo</option>
                </select>
              </label>
              <label className="text-body-sm text-ink-2">
                Valor
                <input type="number" min="0" step="0.01" value={descuentoValor} onChange={(e) => setDescuentoValor(e.target.value)} className="mt-1 w-full rounded-control border border-line-strong px-3 py-2 text-ink" />
              </label>
            </div>
          )}

          <label className="flex items-center gap-2 text-body-sm text-ink-2">
            <input type="checkbox" checked={aplicaComision} onChange={(e) => setAplicaComision(e.target.checked)} />
            Aplicar comisión sobre lo cobrado
          </label>

          {aplicaComision && (
            <label className="text-body-sm text-ink-2">
              Comisión (%)
              <input type="number" min="0" step="0.01" value={comisionPorcentaje} onChange={(e) => setComisionPorcentaje(e.target.value)} className="mt-1 w-full rounded-control border border-line-strong px-3 py-2 text-ink" />
            </label>
          )}
        </div>

        <button disabled={saving} className="rounded-control bg-primary px-4 py-2 text-body-sm font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-50">
          {saving ? 'Guardando...' : 'Crear partner'}
        </button>
      </form>
    </div>
  )
}
