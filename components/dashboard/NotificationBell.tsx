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

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'EXITO':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'ERROR':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'ALERTA':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'ACCION_REQUERIDA':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'MENSAJE':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleNotificationClick = async (notification: any) => {
    // Marcar como leída
    await markAsRead(notification.id)

    // Navegar al link si existe
    if (notification.link) {
      router.push(notification.link)
    }

    // Cerrar el panel
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {/* Botón de campana */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
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
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-gray-700" />
                <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                {count > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {count}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            {/* Lista de notificaciones */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No tienes notificaciones</p>
                  <p className="text-sm">Te avisaremos cuando haya novedades</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 cursor-pointer transition-colors ${
                        !notification.leida ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`px-2 py-1 rounded text-xs font-medium border ${getTipoColor(notification.tipo)}`}>
                          {notification.tipo}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm ${!notification.leida ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.titulo}
                          </p>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.mensaje}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {format(new Date(notification.createdAt), "d 'de' MMM, HH:mm", { locale: es })}
                          </p>
                        </div>
                        {!notification.leida && (
                          <div className="h-2 w-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="flex-1 gap-2"
                >
                  <CheckCheck className="h-4 w-4" />
                  Marcar todas como leídas
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    router.push('/dashboard/notificaciones')
                    setIsOpen(false)
                  }}
                  className="flex-1"
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
