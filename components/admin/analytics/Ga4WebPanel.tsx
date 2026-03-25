'use client'

import { Globe, LineChart, MapPin, Megaphone, Radio, Timer, Users } from 'lucide-react'
import { MetricCard } from './MetricCard'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export interface Ga4DashboardData {
  periodo: string
  dateRange: { startDate: string; endDate: string }
  propertyId: string
  summary: {
    activeUsers: number
    sessions: number
    newUsers: number
    averageSessionDurationSeconds: number
    engagementRate: number
    userEngagementDurationSeconds: number
  }
  byCountry: { country: string; activeUsers: number; sessions: number }[]
  byChannel: { channel: string; sessions: number; activeUsers: number }[]
  bySourceMedium: { sourceMedium: string; sessions: number; activeUsers: number }[]
  byCampaign: { campaign: string; sessions: number; activeUsers: number }[]
  timeseries: { date: string; activeUsers: number; sessions: number }[]
}

function formatDuration(sec: number): string {
  if (sec == null || !Number.isFinite(sec) || sec <= 0) return '—'
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  if (m === 0) return `${s}s`
  return `${m} min ${s}s`
}

function engagementPercent(rate: number): string {
  if (rate == null || !Number.isFinite(rate)) return '—'
  const p = rate <= 1 ? rate * 100 : rate
  return `${p.toFixed(1)}%`
}

function formatTotalEngagement(sec: number): string {
  if (sec == null || !Number.isFinite(sec) || sec <= 0) return '—'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (h > 0) return `${h}h ${m}m tot. engagement`
  return `${m} min tot. engagement`
}

interface Ga4WebPanelProps {
  data: Ga4DashboardData | null
  loading: boolean
  error: string | null
}

export function Ga4WebPanel({ data, loading, error }: Ga4WebPanelProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <p className="text-gray-600 text-center">Cargando métricas de Google Analytics…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-amber-900 mb-2">Tráfico web (Google Analytics)</h3>
        <p className="text-amber-800 text-sm mb-2">{error}</p>
        <p className="text-amber-700 text-xs">
          Configurá OAuth en Vercel: GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET,
          GOOGLE_OAUTH_REFRESH_TOKEN (scope <code className="bg-amber-100 px-1 rounded">analytics.readonly</code>).
          Opcional: GA4_PROPERTY_ID (default 516402270).
        </p>
      </div>
    )
  }

  if (!data) return null

  const { summary, byCountry, byChannel, bySourceMedium, byCampaign, timeseries, dateRange } = data

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Tráfico web (Google Analytics 4)</h2>
        <p className="text-gray-500 text-sm">
          Rango GA4: {dateRange.startDate} → {dateRange.endDate} · Propiedad {data.propertyId}
        </p>
        {summary.activeUsers === 0 && summary.sessions === 0 && (
          <p className="text-amber-800 text-sm mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            GA4 respondió pero el período tiene <strong>0 usuarios / 0 sesiones</strong>. Probá el filtro{' '}
            <strong>«Última semana»</strong> o <strong>«Este año»</strong>. Si en GA4 (Informes → Tiempo real) sí ves visitas,
            revisá que en Vercel (Producción) esté <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_GA_ID=G-MPWZ19GYE7</code> y que
            el stream de esa propiedad sea el mismo sitio.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Usuarios activos"
          value={summary.activeUsers}
          icon={Users}
          subtitle={`${summary.newUsers} nuevos`}
          color="blue"
        />
        <MetricCard
          title="Sesiones"
          value={summary.sessions}
          icon={LineChart}
          subtitle="Visitas al sitio"
          color="purple"
        />
        <MetricCard
          title="Duración media / sesión"
          value={formatDuration(summary.averageSessionDurationSeconds)}
          icon={Timer}
          subtitle="Tiempo promedio en el sitio"
          color="green"
        />
        <MetricCard
          title="Tasa de engagement"
          value={engagementPercent(summary.engagementRate)}
          icon={Radio}
          subtitle={formatTotalEngagement(summary.userEngagementDurationSeconds)}
          color="yellow"
        />
      </div>

      {timeseries.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Usuarios y sesiones por día</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeseries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Bar dataKey="activeUsers" name="Usuarios" fill="#991D23" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sessions" name="Sesiones" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand-700" />
            Países (top)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-2 pr-4">País</th>
                  <th className="pb-2 pr-4 text-right">Usuarios</th>
                  <th className="pb-2 text-right">Sesiones</th>
                </tr>
              </thead>
              <tbody>
                {byCountry.map((row) => (
                  <tr key={row.country} className="border-b border-gray-50">
                    <td className="py-2 pr-4 font-medium text-gray-900">{row.country}</td>
                    <td className="py-2 pr-4 text-right text-gray-600">{row.activeUsers}</td>
                    <td className="py-2 text-right text-gray-600">{row.sessions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-brand-700" />
            Canal por defecto
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-2 pr-4">Canal</th>
                  <th className="pb-2 pr-4 text-right">Sesiones</th>
                  <th className="pb-2 text-right">Usuarios</th>
                </tr>
              </thead>
              <tbody>
                {byChannel.map((row) => (
                  <tr key={row.channel} className="border-b border-gray-50">
                    <td className="py-2 pr-4 font-medium text-gray-900">{row.channel}</td>
                    <td className="py-2 pr-4 text-right text-gray-600">{row.sessions}</td>
                    <td className="py-2 text-right text-gray-600">{row.activeUsers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Fuente / medio</h3>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-2 pr-4">Origen</th>
                  <th className="pb-2 pr-4 text-right">Sesiones</th>
                  <th className="pb-2 text-right">Usuarios</th>
                </tr>
              </thead>
              <tbody>
                {bySourceMedium.map((row) => (
                  <tr key={row.sourceMedium} className="border-b border-gray-50">
                    <td className="py-2 pr-4 font-medium text-gray-900 break-all">{row.sourceMedium}</td>
                    <td className="py-2 pr-4 text-right text-gray-600">{row.sessions}</td>
                    <td className="py-2 text-right text-gray-600">{row.activeUsers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-brand-700" />
            Campañas (session)
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Usá UTM en tus links (utm_source, utm_medium, utm_campaign) para ver resultados acá.
          </p>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-2 pr-4">Campaña</th>
                  <th className="pb-2 pr-4 text-right">Sesiones</th>
                  <th className="pb-2 text-right">Usuarios</th>
                </tr>
              </thead>
              <tbody>
                {byCampaign.map((row) => (
                  <tr key={row.campaign} className="border-b border-gray-50">
                    <td className="py-2 pr-4 font-medium text-gray-900">{row.campaign}</td>
                    <td className="py-2 pr-4 text-right text-gray-600">{row.sessions}</td>
                    <td className="py-2 text-right text-gray-600">{row.activeUsers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
