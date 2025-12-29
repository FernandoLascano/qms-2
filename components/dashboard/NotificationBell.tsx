'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Check, CheckCheck, X } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function NotificationBell() {
  const router = useRouter()
  const { notifications, count, isConnected, markAsRead, markAllAsRead } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)

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

  const handleNotificationClick = async (notification: any) => {
    // Marcar como leída
    await markAsRead(notification.id)

    // Cerrar el panel primero
    setIsOpen(false)

    // Navegar al link si existe
    if (notification.link) {
      const currentPath = window.location.pathname
      const hasHash = notification.link.includes('#')
      const [basePath, hash] = hasHash ? notification.link.split('#') : [notification.link, null]
      const basePathClean = basePath.split('?')[0]
      const isSamePage = currentPath === basePathClean

      if (isSamePage) {
        // Ya estamos en la misma página - refrescar datos
        router.refresh()

        // Si hay hash, hacer scroll después del refresh
        if (hash) {
          setTimeout(() => {
            const element = document.getElementById(hash)
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          }, 500)
        }
      } else {
        // Navegar a otra página - siempre refrescar después para cargar datos actualizados
        router.push(notification.link)

        // Refrescar después de navegar para asegurar datos actualizados
        setTimeout(() => {
          router.refresh()
          // Si hay hash, hacer scroll después del refresh
          if (hash) {
            setTimeout(() => {
              const element = document.getElementById(hash)
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            }, 300)
          }
        }, 500)
      }
    }
  }

  return (
    <div className="relative">
      {/* Botón de campana */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <Bell className="h-6 w-6 text-gray-700" />

        {/* Badge con contador */}
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {count > 9 ? '9+' : count}
          </span>
        )}

        {/* Indicador de conexión */}
        <span className={`absolute bottom-0 right-0 h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
      </button>

      {/* Panel de notificaciones */}
      {isOpen && (
        <>
          {/* Overlay para cerrar al hacer clic fuera */}
          <div
            className="fixed inset-0 z-40 cursor-pointer"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 mt-2 w-[420px] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[calc(100vh-100px)] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Bell className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Notificaciones</h3>
                  {count > 0 && (
                    <p className="text-xs text-gray-500">{count} sin leer</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Lista de notificaciones */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Bell className="h-10 w-10 text-gray-300" />
                  </div>
                  <p className="font-semibold text-gray-700 mb-1">Todo al día</p>
                  <p className="text-sm text-gray-500">No tienes notificaciones nuevas</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map((notification) => {
                    const config = getTipoConfig(notification.tipo)
                    return (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-4 cursor-pointer transition-all hover:shadow-sm ${
                          !notification.leida ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50/50'
                        }`}
                      >
                        <div className="flex gap-3">
                          {/* Icono */}
                          <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center text-lg font-bold`}>
                            {config.icon}
                          </div>

                          {/* Contenido */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className={`font-semibold text-sm leading-tight ${!notification.leida ? 'text-gray-900' : 'text-gray-700'}`}>
                                {notification.titulo}
                              </p>
                              {!notification.leida && (
                                <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                              )}
                            </div>

                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                              {notification.mensaje}
                            </p>

                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-md font-medium border ${config.badge}`}>
                                {notification.tipo.replace('_', ' ')}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">
                                {format(new Date(notification.createdAt), "d MMM, HH:mm", { locale: es })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-100 bg-white flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="flex-1 gap-2 text-gray-700 border-gray-200 hover:bg-gray-50"
                >
                  <CheckCheck className="h-4 w-4" />
                  Marcar leídas
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    router.push('/dashboard/notificaciones')
                    setIsOpen(false)
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
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
