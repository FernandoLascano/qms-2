'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { Bell, Check } from 'lucide-react'

import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge, type Tone } from '@/components/ui/badge'
import { EmptyState, InlineLoading } from '@/components/ui/states'
import { cn } from '@/lib/utils'

type Notificacion = {
  id: string
  tipo: string
  titulo: string
  mensaje: string
  link: string | null
  leida: boolean
  createdAt: string
  tramiteId: string | null
  tramite?: { denominacion: string } | null
}

/** Mismo mapa de tonos que usa la campana del header. */
const TONO: Record<string, { tone: Tone; label: string }> = {
  EXITO: { tone: 'success', label: 'Listo' },
  ERROR: { tone: 'danger', label: 'Error' },
  ALERTA: { tone: 'warning', label: 'Alerta' },
  ACCION_REQUERIDA: { tone: 'warning', label: 'Acción requerida' },
  MENSAJE: { tone: 'info', label: 'Mensaje' },
  INFO: { tone: 'neutral', label: 'Info' },
}

const TIPOS = [
  { value: 'TODOS', label: 'Todas' },
  { value: 'ACCION_REQUERIDA', label: 'Acción requerida' },
  { value: 'ALERTA', label: 'Alertas' },
  { value: 'MENSAJE', label: 'Mensajes' },
  { value: 'EXITO', label: 'Listas' },
  { value: 'INFO', label: 'Info' },
]

const ESTADOS = [
  { value: 'todas', label: 'Todas' },
  { value: 'false', label: 'Sin leer' },
  { value: 'true', label: 'Leídas' },
]

export default function NotificacionesPage() {
  const router = useRouter()
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tipoFiltro, setTipoFiltro] = useState('TODOS')
  const [leidaFiltro, setLeidaFiltro] = useState('todas')

  const cargar = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (tipoFiltro !== 'TODOS') params.append('tipo', tipoFiltro)
      if (leidaFiltro !== 'todas') params.append('leida', leidaFiltro)

      const res = await fetch(`/api/notificaciones?${params.toString()}`)
      if (!res.ok) throw new Error('Error al cargar notificaciones')

      const data = await res.json()
      setNotificaciones(data.notificaciones)
      setCount(data.count)
    } catch (error) {
      console.error('Error al cargar notificaciones:', error)
      toast.error('No pudimos cargar las notificaciones')
    } finally {
      setLoading(false)
    }
  }, [tipoFiltro, leidaFiltro])

  useEffect(() => {
    cargar()
  }, [cargar])

  const marcarComoLeida = async (id: string) => {
    try {
      const res = await fetch(`/api/notificaciones/${id}/marcar-leida`, { method: 'PATCH' })
      if (!res.ok) throw new Error()
      setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)))
      setCount((prev) => Math.max(0, prev - 1))
    } catch {
      toast.error('No se pudo marcar como leída')
    }
  }

  const marcarTodas = async () => {
    try {
      const res = await fetch('/api/notificaciones/marcar-todas-leidas', { method: 'PATCH' })
      if (!res.ok) throw new Error()
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })))
      setCount(0)
      toast.success('Listo, marcamos todas como leídas')
    } catch {
      toast.error('No se pudieron marcar como leídas')
    }
  }

  const abrir = async (n: Notificacion) => {
    if (!n.leida) await marcarComoLeida(n.id)
    if (n.link) router.push(n.link)
  }

  const conFiltro = tipoFiltro !== 'TODOS' || leidaFiltro !== 'todas'

  return (
    <div className="space-y-section">
      <PageHeader
        title="Notificaciones"
        description={
          count > 0
            ? `Tenés ${count} sin leer.`
            : 'Estás al día: no hay notificaciones sin leer.'
        }
        actions={
          count > 0 ? (
            <Button variant="secondary" onClick={marcarTodas}>
              <Check className="h-4 w-4" aria-hidden />
              Marcar todas como leídas
            </Button>
          ) : undefined
        }
      />

      {/* Filtros */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="tablist" aria-label="Filtrar por tipo" className="flex flex-wrap gap-2">
          {TIPOS.map((t) => (
            <Chip
              key={t.value}
              seleccionado={tipoFiltro === t.value}
              onClick={() => setTipoFiltro(t.value)}
            >
              {t.label}
            </Chip>
          ))}
        </div>
        <div role="tablist" aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
          {ESTADOS.map((e) => (
            <Chip
              key={e.value}
              seleccionado={leidaFiltro === e.value}
              onClick={() => setLeidaFiltro(e.value)}
            >
              {e.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <Card>
          <InlineLoading label="Cargando notificaciones…" />
        </Card>
      ) : notificaciones.length === 0 ? (
        <Card>
          <EmptyState
            icon={Bell}
            title={conFiltro ? 'Sin resultados' : 'No tenés notificaciones'}
            description={
              conFiltro
                ? 'No encontramos notificaciones con estos filtros.'
                : 'Cuando pase algo con tus trámites te avisamos por acá.'
            }
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-line">
            {notificaciones.map((n) => {
              const cfg = TONO[n.tipo] ?? TONO.INFO
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => abrir(n)}
                    className={cn(
                      'block w-full px-card-sm py-4 text-left transition-colors hover:bg-surface-2',
                      !n.leida && 'bg-primary-soft/40',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <h2
                        className={cn(
                          'flex-1 text-body font-medium',
                          n.leida ? 'text-ink-2' : 'text-ink',
                        )}
                      >
                        {n.titulo}
                      </h2>
                      {!n.leida && (
                        <span
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
                          aria-label="Sin leer"
                        />
                      )}
                    </div>

                    <p className="mt-1 text-body-sm text-ink-2 text-pretty">{n.mensaje}</p>

                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <Badge tone={cfg.tone} size="sm">
                        {cfg.label}
                      </Badge>
                      {n.tramite && (
                        <Badge tone="neutral" size="sm">
                          {n.tramite.denominacion}
                        </Badge>
                      )}
                      <time
                        dateTime={n.createdAt}
                        className="text-label text-ink-3 tnum"
                      >
                        {format(new Date(n.createdAt), "d 'de' MMMM, HH:mm", { locale: es })}
                      </time>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      {notificaciones.length > 0 && (
        <p className="text-center text-body-sm text-ink-2">
          Mostrando {notificaciones.length}{' '}
          {notificaciones.length === 1 ? 'notificación' : 'notificaciones'}
        </p>
      )}
    </div>
  )
}

function Chip({
  seleccionado,
  onClick,
  children,
}: {
  seleccionado: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={seleccionado}
      onClick={onClick}
      className={cn(
        'inline-flex h-9 items-center rounded-control border px-3 text-body-sm transition-colors',
        seleccionado
          ? 'border-primary bg-primary text-on-primary'
          : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}
