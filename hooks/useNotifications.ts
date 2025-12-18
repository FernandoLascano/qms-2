import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface Notificacion {
  id: string
  tipo: string
  titulo: string
  mensaje: string
  link: string | null
  leida: boolean
  createdAt: Date
  tramiteId: string | null
}

interface NotificationsState {
  notifications: Notificacion[]
  count: number
  isConnected: boolean
  error: string | null
}

export function useNotifications() {
  const { data: session } = useSession()
  const [state, setState] = useState<NotificationsState>({
    notifications: [],
    count: 0,
    isConnected: false,
    error: null
  })

  useEffect(() => {
    if (!session?.user) {
      return
    }

    console.log('🔔 Iniciando conexión SSE para notificaciones...')

    let eventSource: EventSource | null = null
    let reconnectTimer: NodeJS.Timeout | null = null

    const connect = () => {
      try {
        eventSource = new EventSource('/api/notificaciones/stream')

        eventSource.onopen = () => {
          console.log('✅ SSE conectado')
          setState(prev => ({ ...prev, isConnected: true, error: null }))
        }

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)

            if (data.type === 'connected') {
              console.log('🔔 Servidor confirmó conexión')
            }

            if (data.type === 'notifications') {
              setState(prev => ({
                ...prev,
                notifications: data.notifications,
                count: data.count
              }))
            }
          } catch (error) {
            console.error('Error al parsear evento SSE:', error)
          }
        }

        eventSource.onerror = (error) => {
          console.error('❌ Error en SSE:', error)
          setState(prev => ({
            ...prev,
            isConnected: false,
            error: 'Error de conexión'
          }))

          eventSource?.close()

          // Reconectar después de 5 segundos
          reconnectTimer = setTimeout(() => {
            console.log('🔄 Reconectando SSE...')
            connect()
          }, 5000)
        }
      } catch (error) {
        console.error('Error al crear EventSource:', error)
      }
    }

    connect()

    // Limpiar al desmontar
    return () => {
      console.log('🔌 Cerrando conexión SSE')
      eventSource?.close()
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
      }
    }
  }, [session?.user])

  // Marcar notificación como leída
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notificaciones/${notificationId}/marcar-leida`, {
        method: 'PATCH'
      })

      if (response.ok) {
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(n =>
            n.id === notificationId ? { ...n, leida: true } : n
          ),
          count: Math.max(0, prev.count - 1)
        }))
      }
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error)
    }
  }, [])

  // Marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notificaciones/marcar-todas-leidas', {
        method: 'PATCH'
      })

      if (response.ok) {
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(n => ({ ...n, leida: true })),
          count: 0
        }))
      }
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error)
    }
  }, [])

  return {
    notifications: state.notifications,
    count: state.count,
    isConnected: state.isConnected,
    error: state.error,
    markAsRead,
    markAllAsRead
  }
}
