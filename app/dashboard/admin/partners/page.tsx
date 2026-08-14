'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface PartnerItem {
  id: string
  nombre: string
  slug: string
  activo: boolean
  logoUrl: string | null
  _count: {
    clicks: number
    users: number
    conversions: number
  }
  conversionRate: number
}

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<PartnerItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchPartners() {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/partners')
      if (!response.ok) throw new Error('No se pudo obtener partners')
      const data = await response.json()
      setPartners(data)
      setError(null)
    } catch {
      setError('Error al cargar partners')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPartners()
  }, [])

  if (loading) {
    return <div className="py-10 text-body-sm text-ink-2">Cargando partners...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title font-semibold text-ink">Partners</h1>
          <p className="text-ink-2">Gestioná referidos, links y conversiones.</p>
        </div>
        <Link
          href="/dashboard/admin/partners/nuevo"
          className="rounded-control bg-primary px-4 py-2 text-body-sm font-semibold text-on-primary hover:bg-primary-hover"
        >
          Nuevo partner
        </Link>
      </div>

      {error && (
        <div className="rounded-control border border-danger-line bg-danger-soft px-4 py-3 text-body-sm text-danger">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {partners.map((partner) => (
          <Link
            key={partner.id}
            href={`/dashboard/admin/partners/${partner.id}`}
            className="rounded-card border border-line bg-surface p-card hover:border-primary-line"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {partner.logoUrl ? (
                  <div className="flex h-12 w-24 items-center justify-center rounded-control border border-line bg-surface p-1">
                    <img
                      src={partner.logoUrl}
                      alt={partner.nombre}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-12 w-24 items-center justify-center rounded-control border border-line bg-surface-2 text-[10px] font-medium text-ink-3">
                    SIN LOGO
                  </div>
                )}
                <div>
                  <h2 className="font-semibold text-ink">{partner.nombre}</h2>
                  <p className="text-label text-ink-2">/partners/{partner.slug}</p>
                </div>
              </div>
              <span className={`rounded-full px-2 py-1 text-label font-semibold ${partner.activo ? 'bg-success-soft text-success' : 'bg-surface-3 text-ink-2'}`}>
                {partner.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2 text-center text-label">
              <div className="rounded-control bg-surface-2 p-2">
                <div className="font-semibold text-ink">{partner._count.clicks}</div>
                <div className="text-ink-2">Clicks</div>
              </div>
              <div className="rounded-control bg-surface-2 p-2">
                <div className="font-semibold text-ink">{partner._count.users}</div>
                <div className="text-ink-2">Referidos</div>
              </div>
              <div className="rounded-control bg-surface-2 p-2">
                <div className="font-semibold text-ink">{partner._count.conversions}</div>
                <div className="text-ink-2">Conv.</div>
              </div>
              <div className="rounded-control bg-surface-2 p-2">
                <div className="font-semibold text-ink">{partner.conversionRate.toFixed(1)}%</div>
                <div className="text-ink-2">Tasa</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
