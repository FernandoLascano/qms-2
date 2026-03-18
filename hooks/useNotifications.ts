import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

interface Notificacion {
  id: string
  tipo: string
  titulo: string
  mensaje: string
  link: string | null
  leida: boolean
  createdAt: Date
  tramiteId: string | null
  tramite?: {
    denominacion: string
  } | null
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

  // Ref para rastrear el conteo previo y detectar nuevas notificaciones
  const prevCountRef = useRef<number>(0)
  const isInitialLoadRef = useRef<boolean>(true)

  useEffect(() => {
    if (!session?.user) {
      return
    }


    let eventSource: EventSource | null = null
    let reconnectTimer: NodeJS.Timeout | null = null

    const connect = () => {
      try {
        eventSource = new EventSource('/api/notificaciones/stream')

        eventSource.onopen = () => {
          setState(prev => ({ ...prev, isConnected: true, error: null }))
        }

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)

            if (data.type === 'notifications') {
              const newCount = data.count
              const newNotifications = data.notifications

              // Detectar nuevas notificaciones comparando conteos
              if (!isInitialLoadRef.current && newCount > prevCountRef.current) {
                // Hay nuevas notificaciones, mostrar toast
                const nuevasNotificaciones = newNotifications.filter((n: Notificacion) => !n.leida)

                if (nuevasNotificaciones.length > 0) {
                  const ultimaNotificacion = nuevasNotificaciones[0]

                  toast.info(ultimaNotificacion.titulo, {
                    description: ultimaNotificacion.mensaje,
                    duration: 5000,
                    action: ultimaNotificacion.link ? {
                      label: 'Ver',
                      onClick: () => {
                        window.location.href = ultimaNotificacion.link || '/dashboard/notificaciones'
                      }
                    } : undefined
                  })
                }
              }

              // Actualizar refs
              prevCountRef.current = newCount
              if (isInitialLoadRef.current) {
                isInitialLoadRef.current = false
              }

              setState(prev => ({
                ...prev,
                notifications: data.notifications,
                count: data.count
              }))
            }
          } catch {
          }
        }

        eventSource.onerror = () => {
          setState(prev => ({
            ...prev,
            isConnected: false,
            error: 'Error de conexión'
          }))

          eventSource?.close()

          // Reconectar después de 30 segundos con backoff exponencial
          // Esto reduce la carga en el servidor cuando hay problemas
          const reconnectDelay = Math.min(30000, 5000 * Math.pow(2, 0)) // Máximo 30s
          reconnectTimer = setTimeout(() => {
            connect()
          }, reconnectDelay)
        }
      } catch (error) {
        // EventSource creation failed
      }
    }

    connect()

    // Limpiar al desmontar
    return () => {
      eventSource?.close()
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
      }
      // Resetear refs al desmontar
      prevCountRef.current = 0
      isInitialLoadRef.current = true
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
