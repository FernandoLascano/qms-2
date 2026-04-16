'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

type PartnerData = {
  id: string
  nombre: string
  slug: string
  logoUrl: string | null
  beneficios: string[]
  activo: boolean
  aplicaDescuento: boolean
  descuentoTipo: 'MONTO' | 'PORCENTAJE' | null
  descuentoValor: number | null
  aplicaComision: boolean
  comisionPorcentaje: number | null
  condicionesNotas: string | null
}

type PartnerStats = {
  clicks: number
  referredUsers: number
  conversions: number
  conversionRate: number
  totalCobrado: number
  totalComisionEstimada: number
  referredUsersList: Array<{
    id: string
    name: string | null
    email: string
    referredAt: string | null
  }>
  conversionsList: Array<{
    id: string
    convertedAt: string
    montoCobrado: number
    user: {
      id: string
      name: string | null
      email: string
    }
  }>
}

function moneyArs(value: number) {
  return `$${Number(value || 0).toLocaleString('es-AR')}`
}

export default function PartnerDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id

  const [partner, setPartner] = useState<PartnerData | null>(null)
  const [stats, setStats] = useState<PartnerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        setLoading(true)
        const [partnerRes, statsRes] = await Promise.all([
          fetch(`/api/admin/partners/${id}`),
          fetch(`/api/admin/partners/${id}/stats`),
        ])
        if (!partnerRes.ok) throw new Error('No se pudo cargar el partner')
        const partnerPayload = (await partnerRes.json()) as PartnerData
        const statsPayload = statsRes.ok ? ((await statsRes.json()) as PartnerStats) : null
        if (cancelled) return
        setPartner(partnerPayload)
        setStats(statsPayload)
        setError(null)
      } catch (e: unknown) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Error al cargar')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!partner) return
    setSaving(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/partners/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...partner,
          beneficios: partner.beneficios,
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Error al guardar')
      setPartner(payload as PartnerData)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

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

      const saveResponse = await fetch(`/api/admin/partners/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoUrl: payload.url }),
      })
      const saved = await saveResponse.json()
      if (!saveResponse.ok) throw new Error(saved.error || 'No se pudo guardar el logo')
      setPartner(saved as PartnerData)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al subir logo')
    } finally {
      setUploading(false)
    }
  }

  if (loading || !partner) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-sm text-gray-500">
        Cargando partner...
      </div>
    )
  }

  const hasEconomicConfig = partner.aplicaDescuento || partner.aplicaComision

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
            Partner
          </span>
          <h1 className="mt-1 text-3xl font-black text-gray-900">{partner.nombre}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Landing publica:{' '}
            <span className="font-mono text-xs text-gray-700">/partners/{partner.slug}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
              partner.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {partner.activo ? 'Activo' : 'Inactivo'}
          </span>
          <Link
            href={`/partners/${partner.slug}`}
            target="_blank"
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-brand-300"
          >
            Ver landing
          </Link>
        </div>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'Clicks', value: stats.clicks },
            { label: 'Referidos', value: stats.referredUsers },
            { label: 'Conversiones', value: stats.conversions },
            { label: 'Tasa', value: `${stats.conversionRate.toFixed(1)}%` },
            { label: 'Cobrado', value: moneyArs(stats.totalCobrado) },
            { label: 'Comision est.', value: moneyArs(stats.totalComisionEstimada) },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{item.label}</p>
              <p className="mt-1 text-2xl font-black text-gray-900">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle variant="section">Configuracion general</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="partner-nombre">Nombre</Label>
                  <Input
                    id="partner-nombre"
                    value={partner.nombre}
                    onChange={(e) => setPartner({ ...partner, nombre: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="partner-slug">Slug</Label>
                  <Input
                    id="partner-slug"
                    value={partner.slug}
                    onChange={(e) => setPartner({ ...partner, slug: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Partner activo</p>
                  <p className="text-xs text-gray-500">Controla si la landing queda publica.</p>
                </div>
                <Switch
                  checked={partner.activo}
                  onCheckedChange={(checked) => setPartner({ ...partner, activo: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label>Logo</Label>
                {partner.logoUrl && (
                  <img
                    src={partner.logoUrl}
                    alt={partner.nombre}
                    className="h-16 rounded-lg border border-gray-200 bg-white object-contain"
                  />
                )}
                <label className="inline-flex cursor-pointer items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:border-brand-300">
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
                <p className="text-xs text-gray-500">Formatos sugeridos: PNG/JPG/WebP/SVG.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="partner-beneficios">Beneficios (uno por linea)</Label>
                <Textarea
                  id="partner-beneficios"
                  value={partner.beneficios?.join('\n') || ''}
                  onChange={(e) =>
                    setPartner({
                      ...partner,
                      beneficios: e.target.value
                        .split('\n')
                        .map((x) => x.trim())
                        .filter(Boolean),
                    })
                  }
                  rows={4}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="partner-notas">Notas de condiciones</Label>
                <Textarea
                  id="partner-notas"
                  value={partner.condicionesNotas || ''}
                  onChange={(e) => setPartner({ ...partner, condicionesNotas: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <p className="text-xs text-gray-500">Los cambios impactan en la landing y en metricas futuras.</p>
                <Button
                  type="submit"
                  disabled={saving}
                  className="h-10 rounded-xl bg-brand-700 px-5 text-sm font-semibold text-white shadow-lg shadow-brand-200 hover:-translate-y-0.5 hover:bg-brand-800"
                >
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle variant="section">Condiciones economicas</CardTitle>
              {!hasEconomicConfig && (
                <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-800">
                  Sin configurar
                </span>
              )}
            </div>
            <CardDescription>Configuracion interna del convenio para este partner.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Aplicar descuento</p>
                  <p className="text-xs text-gray-500">Visible para el cliente en landing y planes.</p>
                </div>
                <Switch
                  checked={partner.aplicaDescuento}
                  onCheckedChange={(checked) => setPartner({ ...partner, aplicaDescuento: checked })}
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Aplicar comision interna</p>
                  <p className="text-xs text-gray-500">Solo para reportes internos de partner.</p>
                </div>
                <Switch
                  checked={partner.aplicaComision}
                  onCheckedChange={(checked) => setPartner({ ...partner, aplicaComision: checked })}
                />
              </div>
            </div>

            {partner.aplicaDescuento && (
              <div className="grid gap-4 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)]">
                <div className="space-y-1.5">
                  <Label htmlFor="descuento-tipo">Tipo</Label>
                  <select
                    id="descuento-tipo"
                    value={partner.descuentoTipo || 'PORCENTAJE'}
                    onChange={(e) =>
                      setPartner({ ...partner, descuentoTipo: e.target.value as 'MONTO' | 'PORCENTAJE' })
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-900"
                  >
                    <option value="PORCENTAJE">Porcentaje</option>
                    <option value="MONTO">Monto fijo</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="descuento-valor">Valor</Label>
                  <Input
                    id="descuento-valor"
                    type="number"
                    min="0"
                    step="0.01"
                    value={partner.descuentoValor ?? ''}
                    onChange={(e) =>
                      setPartner({ ...partner, descuentoValor: e.target.value ? Number(e.target.value) : null })
                    }
                  />
                </div>
              </div>
            )}

            {partner.aplicaComision && (
              <div className="max-w-xs space-y-1.5">
                <Label htmlFor="comision-porcentaje">Comision (%)</Label>
                <Input
                  id="comision-porcentaje"
                  type="number"
                  min="0"
                  step="0.01"
                  value={partner.comisionPorcentaje ?? ''}
                  onChange={(e) =>
                    setPartner({ ...partner, comisionPorcentaje: e.target.value ? Number(e.target.value) : null })
                  }
                />
                <p className="mt-1 text-xs text-gray-500">Solo visible internamente; no se muestra en la landing.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {stats && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">Referidos identificados</h3>
            <p className="mb-3 text-xs text-gray-500">Ultimos 20</p>
            {stats.referredUsersList.length === 0 ? (
              <p className="text-sm text-gray-500">Sin referidos.</p>
            ) : (
              <div className="space-y-2">
                {stats.referredUsersList.map((user) => (
                  <div key={user.id} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                    <div className="text-sm font-semibold text-gray-900">{user.name || 'Sin nombre'}</div>
                    <div className="text-xs text-gray-600">{user.email}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">Conversiones identificadas</h3>
            <p className="mb-3 text-xs text-gray-500">Ultimas 20</p>
            {stats.conversionsList.length === 0 ? (
              <p className="text-sm text-gray-500">Sin conversiones.</p>
            ) : (
              <div className="space-y-2">
                {stats.conversionsList.map((conversion) => (
                  <div key={conversion.id} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                    <div className="text-sm font-semibold text-gray-900">
                      {conversion.user.name || 'Sin nombre'} - {moneyArs(conversion.montoCobrado)}
                    </div>
                    <div className="text-xs text-gray-600">{conversion.user.email}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

