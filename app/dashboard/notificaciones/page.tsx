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
  { value: 'TODOS', label: 'Todas', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  { value: 'INFO', label: 'Info', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  { value: 'EXITO', label: 'Éxito', color: 'bg-green-100 text-green-700 border-green-300' },
  { value: 'ALERTA', label: 'Alerta', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  { value: 'ERROR', label: 'Error', color: 'bg-red-100 text-red-700 border-red-300' },
  { value: 'ACCION_REQUERIDA', label: 'Acción Requerida', color: 'bg-purple-100 text-purple-700 border-purple-300' },
  { value: 'MENSAJE', label: 'Mensaje', color: 'bg-blue-100 text-blue-700 border-blue-300' }
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
          badge: 'bg-green-100 text-green-700 border-green-200',
          bg: 'bg-green-50',
          icon: '✓'
        }
      case 'ERROR':
        return {
          badge: 'bg-red-100 text-red-700 border-red-200',
          bg: 'bg-red-50',
          icon: '✕'
        }
      case 'ALERTA':
        return {
          badge: 'bg-orange-100 text-orange-700 border-orange-200',
          bg: 'bg-orange-50',
          icon: '⚠'
        }
      case 'ACCION_REQUERIDA':
        return {
          badge: 'bg-purple-100 text-purple-700 border-purple-200',
          bg: 'bg-purple-50',
          icon: '!'
        }
      case 'MENSAJE':
        return {
          badge: 'bg-blue-100 text-blue-700 border-blue-200',
          bg: 'bg-blue-50',
          icon: '💬'
        }
      default:
        return {
          badge: 'bg-gray-100 text-gray-700 border-gray-200',
          bg: 'bg-gray-50',
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
        <span className="inline-block text-red-700 font-semibold text-sm tracking-wider uppercase mb-2">
          Centro de alertas
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900">
          <span className="text-red-700">Notificaciones</span>
        </h1>
        <p className="text-gray-500 mt-2 text-lg">
          {count > 0 ? `Tenés ${count} notificación${count > 1 ? 'es' : ''} sin leer` : 'Todas las notificaciones leídas'}
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Filtros</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Filtro por tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de notificación
            </label>
            <div className="flex flex-wrap gap-2">
              {TIPOS_NOTIFICACION.map((tipo) => (
                <button
                  key={tipo.value}
                  onClick={() => setTipoFiltro(tipo.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
                    tipoFiltro === tipo.value
                      ? tipo.color + ' ring-2 ring-offset-2 ring-gray-300'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {tipo.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro por estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <div className="flex flex-wrap gap-2">
              {FILTROS_LEIDA.map((filtro) => (
                <button
                  key={filtro.value}
                  onClick={() => setLeidaFiltro(filtro.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
                    leidaFiltro === filtro.value
                      ? 'bg-red-100 text-red-700 border-red-300 ring-2 ring-offset-2 ring-red-300'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
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
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              onClick={marcarTodasComoLeidas}
              className="gap-2 text-gray-700 border-gray-200 hover:bg-gray-50"
            >
              <Check className="h-4 w-4" />
              Marcar todas como leídas
            </Button>
          </div>
        )}
      </div>

      {/* Lista de notificaciones */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
          </div>
        ) : notificaciones.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Bell className="h-10 w-10 text-gray-300" />
            </div>
            <p className="font-semibold text-gray-700 mb-1">No hay notificaciones</p>
            <p className="text-sm text-gray-500">
              {tipoFiltro !== 'TODOS' || leidaFiltro !== 'todas'
                ? 'No se encontraron notificaciones con los filtros seleccionados'
                : 'No tienes notificaciones en este momento'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notificaciones.map((notificacion) => {
              const config = getTipoConfig(notificacion.tipo)
              return (
                <div
                  key={notificacion.id}
                  onClick={() => handleNotificacionClick(notificacion)}
                  className={`p-5 cursor-pointer transition-all hover:shadow-sm ${
                    !notificacion.leida
                      ? 'bg-blue-50/50 border-l-4 border-l-blue-500'
                      : 'hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Icono - Mejorado para mayor visibilidad */}
                    <div
                      className={`flex-shrink-0 w-14 h-14 rounded-xl ${config.bg} flex items-center justify-center text-2xl font-bold shadow-md border-2 ${config.badge.includes('green') ? 'border-green-300' : config.badge.includes('red') ? 'border-red-300' : config.badge.includes('orange') ? 'border-orange-300' : config.badge.includes('purple') ? 'border-purple-300' : 'border-gray-300'}`}
                    >
                      {config.icon}
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3
                          className={`font-semibold text-base leading-tight ${
                            !notificacion.leida ? 'text-gray-900' : 'text-gray-700'
                          }`}
                        >
                          {notificacion.titulo}
                        </h3>
                        {!notificacion.leida && (
                          <div className="h-2.5 w-2.5 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                        {notificacion.mensaje}
                      </p>

                      <div className="flex items-center gap-3 flex-wrap">
                        {notificacion.tramite && (
                          <>
                            <span className="text-xs px-2.5 py-1 rounded-lg font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                              📋 {notificacion.tramite.denominacion}
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                          </>
                        )}
                        <span
                          className={`text-xs px-2.5 py-1 rounded-lg font-medium border ${config.badge}`}
                        >
                          {notificacion.tipo.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(notificacion.createdAt), "d 'de' MMMM 'de' yyyy, HH:mm", {
                            locale: es
                          })}
                        </span>
                        {notificacion.leida && (
                          <>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
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
          <p className="text-sm text-gray-500">
            Mostrando {notificaciones.length} {notificaciones.length === 1 ? 'notificación' : 'notificaciones'}
          </p>
        </div>
      )}
    </div>
  )
}

