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
  ok: 'bg-success-solid',
  down: 'bg-danger-solid',
  unconfigured: 'bg-n-300',
}

const STATUS_LABEL: Record<ServiceStatus, string> = {
  ok: 'Operativo',
  down: 'Caído',
  unconfigured: 'Sin configurar',
}

const STATUS_TEXT: Record<ServiceStatus, string> = {
  ok: 'text-success',
  down: 'text-danger',
  unconfigured: 'text-ink-3',
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
    <Card className={degraded ? 'border-2 border-danger-line' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <div
            className={`h-10 w-10 rounded-control flex items-center justify-center ${
              degraded ? 'bg-danger-soft' : 'bg-success-soft'
            }`}
          >
            {degraded ? (
              <AlertTriangle className="h-5 w-5 text-danger" />
            ) : (
              <Activity className="h-5 w-5 text-success" />
            )}
          </div>
          <div>
            <CardTitle className="text-body font-semibold text-ink">Estado de servicios</CardTitle>
            <p className="text-label text-ink-2">
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
            <span className="text-label text-ink-3 hidden sm:inline">
              hace {secondsAgo < 60 ? `${secondsAgo}s` : `${Math.floor(secondsAgo / 60)}min`}
            </span>
          )}
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-control border border-line px-3 py-1 text-label font-medium text-ink-2 hover:bg-surface-2 transition disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="rounded-control bg-danger-soft border border-danger-line px-4 py-3 text-body-sm text-danger">
            No se pudo obtener el estado de los servicios ({error}).
          </div>
        ) : (
          <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {(services.length ? services : placeholderRows()).map((s) => (
              <div key={s.key} className="flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                  {s.status === 'ok' && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-solid opacity-60" />
                  )}
                  <span
                    className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                      loading && !data ? 'bg-n-200 animate-pulse' : DOT[s.status]
                    }`}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm font-medium text-ink truncate">{s.label}</p>
                  {s.detail && s.status !== 'ok' && (
                    <p className="text-label text-ink-3 truncate" title={s.detail}>
                      {s.detail}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-label font-semibold ${STATUS_TEXT[s.status]}`}>
                    {loading && !data ? '—' : STATUS_LABEL[s.status]}
                  </p>
                  {s.status === 'ok' && s.latencyMs != null && (
                    <p className="text-[11px] text-ink-3">{s.latencyMs} ms</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!error && !degraded && data && (
          <div className="mt-4 flex items-center gap-2 text-label text-success">
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
