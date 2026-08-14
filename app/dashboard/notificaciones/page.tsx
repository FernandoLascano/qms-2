'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Filter, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'

type Notificacion = {
  id: string
  tipo: string
  titulo: string
  mensaje: string
  link: string | null
  leida: boolean
  createdAt: string
  tramiteId: string | null
  tramite?: {
    denominacion: string
  } | null
}

const TIPOS_NOTIFICACION = [
  { value: 'TODOS', label: 'Todas', color: 'bg-surface-3 text-ink-2 border-line-strong' },
  { value: 'INFO', label: 'Info', color: 'bg-surface-3 text-ink-2 border-line-strong' },
  { value: 'EXITO', label: 'Éxito', color: 'bg-success-soft text-success border-success-line' },
  { value: 'ALERTA', label: 'Alerta', color: 'bg-warning-soft text-warning border-warning-line' },
  { value: 'ERROR', label: 'Error', color: 'bg-primary-soft text-primary border-primary-line' },
  { value: 'ACCION_REQUERIDA', label: 'Acción Requerida', color: 'bg-info-soft text-info border-info-line' },
  { value: 'MENSAJE', label: 'Mensaje', color: 'bg-info-soft text-info border-info-line' }
]

const FILTROS_LEIDA = [
  { value: 'todas', label: 'Todas' },
  { value: 'false', label: 'No leídas' },
  { value: 'true', label: 'Leídas' }
]

export default function NotificacionesPage() {
  const router = useRouter()
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tipoFiltro, setTipoFiltro] = useState('TODOS')
  const [leidaFiltro, setLeidaFiltro] = useState('todas')

  const getTipoConfig = (tipo: string) => {
    switch (tipo) {
      case 'EXITO':
        return {
          badge: 'bg-success-soft text-success border-success-line',
          bg: 'bg-success-soft',
          icon: '✓'
        }
      case 'ERROR':
        return {
          badge: 'bg-primary-soft text-primary border-primary-line',
          bg: 'bg-primary-soft',
          icon: '✕'
        }
      case 'ALERTA':
        return {
          badge: 'bg-warning-soft text-warning border-warning-line',
          bg: 'bg-warning-soft',
          icon: '⚠'
        }
      case 'ACCION_REQUERIDA':
        return {
          badge: 'bg-info-soft text-info border-info-line',
          bg: 'bg-info-soft',
          icon: '!'
        }
      case 'MENSAJE':
        return {
          badge: 'bg-info-soft text-info border-info-line',
          bg: 'bg-info-soft',
          icon: '💬'
        }
      default:
        return {
          badge: 'bg-surface-3 text-ink-2 border-line',
          bg: 'bg-surface-2',
          icon: 'ℹ'
        }
    }
  }

  const cargarNotificaciones = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (tipoFiltro !== 'TODOS') {
        params.append('tipo', tipoFiltro)
      }

      if (leidaFiltro !== 'todas') {
        params.append('leida', leidaFiltro)
      }

      const response = await fetch(`/api/notificaciones?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Error al cargar notificaciones')
      }

      const data = await response.json()
      setNotificaciones(data.notificaciones)
      setCount(data.count)
    } catch (error) {
      console.error('Error al cargar notificaciones:', error)
      toast.error('Error al cargar las notificaciones')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarNotificaciones()
  }, [tipoFiltro, leidaFiltro])

  const marcarComoLeida = async (id: string) => {
    try {
      const response = await fetch(`/api/notificaciones/${id}/marcar-leida`, {
        method: 'PATCH'
      })

      if (!response.ok) {
        throw new Error('Error al marcar como leída')
      }

      // Actualizar estado local
      setNotificaciones(prev =>
        prev.map(n => n.id === id ? { ...n, leida: true } : n)
      )
      setCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error)
      toast.error('Error al marcar como leída')
    }
  }

  const marcarTodasComoLeidas = async () => {
    try {
      const response = await fetch('/api/notificaciones/marcar-todas-leidas', {
        method: 'PATCH'
      })

      if (!response.ok) {
        throw new Error('Error al marcar todas como leídas')
      }

      // Actualizar estado local
      setNotificaciones(prev =>
        prev.map(n => ({ ...n, leida: true }))
      )
      setCount(0)
      toast.success('Todas las notificaciones marcadas como leídas')
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error)
      toast.error('Error al marcar todas como leídas')
    }
  }

  const handleNotificacionClick = async (notificacion: Notificacion) => {
    // Marcar como leída si no lo está
    if (!notificacion.leida) {
      await marcarComoLeida(notificacion.id)
    }

    // Navegar al link si existe
    if (notificacion.link) {
      router.push(notificacion.link)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-display text-ink">
          Notificaciones
        </h1>
        <p className="mt-1 text-body text-ink-2">
          {count > 0 ? `Tenés ${count} notificación${count > 1 ? 'es' : ''} sin leer` : 'Todas las notificaciones leídas'}
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-surface rounded-card border border-line p-6 shadow-raise">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-ink-2" />
          <h2 className="font-semibold text-ink">Filtros</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Filtro por tipo */}
          <div>
            <label className="block text-body-sm font-medium text-ink-2 mb-2">
              Tipo de notificación
            </label>
            <div className="flex flex-wrap gap-2">
              {TIPOS_NOTIFICACION.map((tipo) => (
                <button
                  key={tipo.value}
                  onClick={() => setTipoFiltro(tipo.value)}
                  className={`px-3 py-1 rounded-control text-body-sm font-medium border transition-all cursor-pointer ${
                    tipoFiltro === tipo.value
                      ? tipo.color + ' ring-2 ring-offset-2 ring-line-strong'
                      : 'bg-surface text-ink-2 border-line-strong hover:bg-surface-2'
                  }`}
                >
                  {tipo.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro por estado */}
          <div>
            <label className="block text-body-sm font-medium text-ink-2 mb-2">
              Estado
            </label>
            <div className="flex flex-wrap gap-2">
              {FILTROS_LEIDA.map((filtro) => (
                <button
                  key={filtro.value}
                  onClick={() => setLeidaFiltro(filtro.value)}
                  className={`px-3 py-1 rounded-control text-body-sm font-medium border transition-all cursor-pointer ${
                    leidaFiltro === filtro.value
                      ? 'bg-primary-soft text-primary border-primary-line ring-2 ring-offset-2 ring-ring'
                      : 'bg-surface text-ink-2 border-line-strong hover:bg-surface-2'
                  }`}
                >
                  {filtro.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Botón marcar todas como leídas */}
        {count > 0 && (
          <div className="mt-4 pt-4 border-t border-line">
            <Button
              variant="outline"
              size="sm"
              onClick={marcarTodasComoLeidas}
              className="gap-2 text-ink-2 border-line hover:bg-surface-2"
            >
              <Check className="h-4 w-4" />
              Marcar todas como leídas
            </Button>
          </div>
        )}
      </div>

      {/* Lista de notificaciones */}
      <div className="bg-surface rounded-card border border-line overflow-hidden shadow-raise">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-ink-3 animate-spin" />
          </div>
        ) : notificaciones.length === 0 ? (
          <div className="p-12 text-center text-ink-2">
            <div className="w-20 h-20 mx-auto mb-4 bg-surface-3 rounded-full flex items-center justify-center">
              <Bell className="h-10 w-10 text-ink-3" />
            </div>
            <p className="font-semibold text-ink-2 mb-1">No hay notificaciones</p>
            <p className="text-body-sm text-ink-2">
              {tipoFiltro !== 'TODOS' || leidaFiltro !== 'todas'
                ? 'No se encontraron notificaciones con los filtros seleccionados'
                : 'No tienes notificaciones en este momento'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {notificaciones.map((notificacion) => {
              const config = getTipoConfig(notificacion.tipo)
              return (
                <div
                  key={notificacion.id}
                  onClick={() => handleNotificacionClick(notificacion)}
                  className={`p-card cursor-pointer transition-all hover:shadow-raise ${
                    !notificacion.leida
                      ? 'bg-info-soft/50 border-l-4 border-l-blue-500'
                      : 'hover:bg-surface-2/50'
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Icono - Mejorado para mayor visibilidad */}
                    <div
                      className={`flex-shrink-0 w-14 h-14 rounded-control ${config.bg} flex items-center justify-center text-title font-semibold shadow-raise border-2 ${config.badge.includes('green') ? 'border-success-line' : config.badge.includes('brand') ? 'border-primary-line' : config.badge.includes('orange') ? 'border-warning-line' : config.badge.includes('purple') ? 'border-info-line' : 'border-line-strong'}`}
                    >
                      {config.icon}
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3
                          className={`font-semibold text-body leading-tight ${
                            !notificacion.leida ? 'text-ink' : 'text-ink-2'
                          }`}
                        >
                          {notificacion.titulo}
                        </h3>
                        {!notificacion.leida && (
                          <div className="h-2.5 w-2.5 bg-info-solid rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>

                      <p className="text-body-sm text-ink-2 mb-3 leading-relaxed">
                        {notificacion.mensaje}
                      </p>

                      <div className="flex items-center gap-3 flex-wrap">
                        {notificacion.tramite && (
                          <>
                            <span className="text-label px-3 py-1 rounded-control font-semibold bg-info-soft text-info border border-info-line">
                              📋 {notificacion.tramite.denominacion}
                            </span>
                            <span className="text-label text-ink-3">•</span>
                          </>
                        )}
                        <span
                          className={`text-label px-3 py-1 rounded-control font-medium border ${config.badge}`}
                        >
                          {notificacion.tipo.replace('_', ' ')}
                        </span>
                        <span className="text-label text-ink-3">•</span>
                        <span className="text-label text-ink-2">
                          {format(new Date(notificacion.createdAt), "d 'de' MMMM 'de' yyyy, HH:mm", {
                            locale: es
                          })}
                        </span>
                        {notificacion.leida && (
                          <>
                            <span className="text-label text-ink-3">•</span>
                            <span className="text-label text-ink-2 flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              Leída
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer info */}
      {notificaciones.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-body-sm text-ink-2">
            Mostrando {notificaciones.length} {notificaciones.length === 1 ? 'notificación' : 'notificaciones'}
          </p>
        </div>
      )}
    </div>
  )
}

