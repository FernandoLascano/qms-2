'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react'

type ServiceStatus = 'ok' | 'down' | 'unconfigured'

interface ServiceResult {
  key: string
  label: string
  status: ServiceStatus
  latencyMs: number | null
  detail: string | null
}

interface HealthResponse {
  overall: 'ok' | 'degraded'
  checkedAt: string
  services: ServiceResult[]
}

// Refresco espaciado para no consumir CPU de Vercel; el monitoreo real va por
// el email 2×/día. Además pausamos cuando la pestaña no está visible.
const REFRESH_MS = 300_000

const DOT: Record<ServiceStatus, string> = {
  ok: 'bg-green-500',
  down: 'bg-red-500',
  unconfigured: 'bg-gray-300',
}

const STATUS_LABEL: Record<ServiceStatus, string> = {
  ok: 'Operativo',
  down: 'Caído',
  unconfigured: 'Sin configurar',
}

const STATUS_TEXT: Record<ServiceStatus, string> = {
  ok: 'text-green-700',
  down: 'text-red-700',
  unconfigured: 'text-gray-400',
}

export function ServiceStatus() {
  const [data, setData] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [secondsAgo, setSecondsAgo] = useState(0)
  const lastFetch = useRef<number>(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/health', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: HealthResponse = await res.json()
      setData(json)
      lastFetch.current = Date.now()
      setSecondsAgo(0)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al chequear el estado')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    // Solo refresca automáticamente si la pestaña está visible.
    const refresh = setInterval(() => {
      if (document.visibilityState === 'visible') load()
    }, REFRESH_MS)
    const tick = setInterval(() => {
      if (lastFetch.current) setSecondsAgo(Math.round((Date.now() - lastFetch.current) / 1000))
    }, 1000)
    return () => {
      clearInterval(refresh)
      clearInterval(tick)
    }
  }, [load])

  const services = data?.services ?? []
  const degraded = data?.overall === 'degraded'
  const downCount = services.filter((s) => s.status === 'down').length

  return (
    <Card className={degraded ? 'border-2 border-red-300' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center ${
              degraded ? 'bg-red-100' : 'bg-green-100'
            }`}
          >
            {degraded ? (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            ) : (
              <Activity className="h-5 w-5 text-green-600" />
            )}
          </div>
          <div>
            <CardTitle className="text-base font-bold text-gray-900">Estado de servicios</CardTitle>
            <p className="text-xs text-gray-500">
              {loading && !data
                ? 'Verificando…'
                : error
                  ? 'No se pudo verificar'
                  : degraded
                    ? `${downCount} servicio${downCount !== 1 ? 's' : ''} con problemas`
                    : 'Todos los sistemas operativos'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {data && !error && (
            <span className="text-xs text-gray-400 hidden sm:inline">
              hace {secondsAgo < 60 ? `${secondsAgo}s` : `${Math.floor(secondsAgo / 60)}min`}
            </span>
          )}
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            No se pudo obtener el estado de los servicios ({error}).
          </div>
        ) : (
          <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {(services.length ? services : placeholderRows()).map((s) => (
              <div key={s.key} className="flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                  {s.status === 'ok' && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
                  )}
                  <span
                    className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                      loading && !data ? 'bg-gray-200 animate-pulse' : DOT[s.status]
                    }`}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{s.label}</p>
                  {s.detail && s.status !== 'ok' && (
                    <p className="text-xs text-gray-400 truncate" title={s.detail}>
                      {s.detail}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-xs font-semibold ${STATUS_TEXT[s.status]}`}>
                    {loading && !data ? '—' : STATUS_LABEL[s.status]}
                  </p>
                  {s.status === 'ok' && s.latencyMs != null && (
                    <p className="text-[11px] text-gray-400">{s.latencyMs} ms</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!error && !degraded && data && (
          <div className="mt-4 flex items-center gap-1.5 text-xs text-green-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Sin incidencias detectadas
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Filas placeholder mientras carga el primer chequeo.
function placeholderRows(): ServiceResult[] {
  return [
    'Base de datos',
    'Inteligencia Artificial',
    'MercadoPago (pagos)',
    'Emails (SMTP)',
    'Almacenamiento (Supabase)',
    'Rate limiting (Redis)',
  ].map((label, i) => ({
    key: `ph-${i}`,
    label,
    status: 'unconfigured' as ServiceStatus,
    latencyMs: null,
    detail: null,
  }))
}
