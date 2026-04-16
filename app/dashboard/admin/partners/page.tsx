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
    return <div className="py-10 text-sm text-gray-500">Cargando partners...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Partners</h1>
          <p className="text-gray-500">Gestioná referidos, links y conversiones.</p>
        </div>
        <Link
          href="/dashboard/admin/partners/nuevo"
          className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
        >
          Nuevo partner
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {partners.map((partner) => (
          <Link
            key={partner.id}
            href={`/dashboard/admin/partners/${partner.id}`}
            className="rounded-2xl border border-gray-200 bg-white p-5 hover:border-brand-300"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {partner.logoUrl ? (
                  <div className="flex h-12 w-24 items-center justify-center rounded-lg border border-gray-200 bg-white p-1">
                    <img
                      src={partner.logoUrl}
                      alt={partner.nombre}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-12 w-24 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-[10px] font-medium text-gray-400">
                    SIN LOGO
                  </div>
                )}
                <div>
                  <h2 className="font-bold text-gray-900">{partner.nombre}</h2>
                  <p className="text-xs text-gray-500">/partners/{partner.slug}</p>
                </div>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${partner.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {partner.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
              <div className="rounded-lg bg-gray-50 p-2">
                <div className="font-bold text-gray-900">{partner._count.clicks}</div>
                <div className="text-gray-500">Clicks</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-2">
                <div className="font-bold text-gray-900">{partner._count.users}</div>
                <div className="text-gray-500">Referidos</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-2">
                <div className="font-bold text-gray-900">{partner._count.conversions}</div>
                <div className="text-gray-500">Conv.</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-2">
                <div className="font-bold text-gray-900">{partner.conversionRate.toFixed(1)}%</div>
                <div className="text-gray-500">Tasa</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
