'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck, X } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useNotifications } from '@/hooks/useNotifications'
import { Button } from '@/components/ui/button'
import { Badge, CountBadge, type Tone } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/states'
import { cn } from '@/lib/utils'

/** El tipo de notificación se traduce al mismo mapa de tonos que el resto del módulo. */
const TONO: Record<string, { tone: Tone; label: string }> = {
  EXITO: { tone: 'success', label: 'Listo' },
  ERROR: { tone: 'danger', label: 'Error' },
  ALERTA: { tone: 'warning', label: 'Alerta' },
  ACCION_REQUERIDA: { tone: 'warning', label: 'Acción requerida' },
  MENSAJE: { tone: 'info', label: 'Mensaje' },
  INFO: { tone: 'neutral', label: 'Info' },
}

export default function NotificationBell() {
  const router = useRouter()
  const { notifications, count, isConnected, markAsRead, markAllAsRead } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen])

  const abrirNotificacion = async (notification: any) => {
    await markAsRead(notification.id)
    setIsOpen(false)

    if (!notification.link) return

    const [basePath, hash] = notification.link.includes('#')
      ? notification.link.split('#')
      : [notification.link, null]
    const mismaPagina = window.location.pathname === basePath.split('?')[0]

    const irAlAncla = () => {
      if (!hash) return
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
    }

    if (mismaPagina) {
      router.refresh()
      irAlAncla()
    } else {
      router.push(notification.link)
      setTimeout(() => {
        router.refresh()
        irAlAncla()
      }, 400)
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={count > 0 ? `Notificaciones: ${count} sin leer` : 'Notificaciones'}
        className="relative flex h-9 w-9 items-center justify-center rounded-control text-ink-2 transition-colors hover:bg-surface-3 hover:text-ink"
      >
        <Bell className="h-5 w-5" aria-hidden />
        {count > 0 && (
          <span className="absolute -right-1 -top-1">
            <CountBadge count={count} />
          </span>
        )}
        <span
          className={cn(
            'absolute bottom-0.5 right-0.5 h-1.5 w-1.5 rounded-full',
            isConnected ? 'bg-success-solid' : 'bg-n-400',
          )}
          title={isConnected ? 'Conectado en tiempo real' : 'Sin conexión en tiempo real'}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} aria-hidden />

          <div
            ref={panelRef}
            role="dialog"
            aria-label="Notificaciones"
            className={cn(
              'fixed inset-x-3 top-16 z-50 flex max-h-[calc(100vh-5rem)] flex-col',
              'sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96',
              'overflow-hidden rounded-card border border-line bg-surface shadow-pop',
            )}
          >
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <div>
                <h2 className="text-heading text-ink">Notificaciones</h2>
                {count > 0 && <p className="text-label text-ink-2">{count} sin leer</p>}
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar"
                className="flex h-8 w-8 items-center justify-center rounded-control text-ink-2 hover:bg-surface-3"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title="Todo al día"
                  description="No tenés notificaciones nuevas."
                />
              ) : (
                <ul className="divide-y divide-line">
                  {notifications.map((n) => {
                    const cfg = TONO[n.tipo] ?? TONO.INFO
                    return (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => abrirNotificacion(n)}
                          className={cn(
                            'block w-full px-4 py-3 text-left transition-colors hover:bg-surface-2',
                            !n.leida && 'bg-primary-soft/40',
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <p
                              className={cn(
                                'flex-1 text-body-sm font-medium',
                                n.leida ? 'text-ink-2' : 'text-ink',
                              )}
                            >
                              {n.titulo}
                            </p>
                            {!n.leida && (
                              <span
                                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                                aria-label="Sin leer"
                              />
                            )}
                          </div>

                          <p className="mt-0.5 line-clamp-2 text-body-sm text-ink-2">
                            {n.mensaje}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <Badge tone={cfg.tone} size="sm">
                              {cfg.label}
                            </Badge>
                            {n.tramite && (
                              <Badge tone="neutral" size="sm">
                                {n.tramite.denominacion}
                              </Badge>
                            )}
                            <span className="text-label text-ink-3">
                              {format(new Date(n.createdAt), "d MMM, HH:mm", { locale: es })}
                            </span>
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="flex gap-2 border-t border-line p-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={markAllAsRead}
                  className="flex-1"
                >
                  <CheckCheck className="h-4 w-4" aria-hidden />
                  Marcar leídas
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    router.push('/dashboard/notificaciones')
                    setIsOpen(false)
                  }}
                >
                  Ver todas
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
