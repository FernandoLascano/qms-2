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

const POLL_MS = 60_000

export function useNotifications() {
  const { data: session } = useSession()
  const [state, setState] = useState<NotificationsState>({
    notifications: [],
    count: 0,
    isConnected: false,
    error: null,
  })

  const prevCountRef = useRef<number>(0)
  const isInitialLoadRef = useRef<boolean>(true)

  useEffect(() => {
    if (!session?.user) {
      return
    }

    let cancelled = false
    let intervalId: ReturnType<typeof setInterval> | null = null

    const applyPayload = (data: {
      type: string
      count: number
      notifications: Notificacion[]
    }) => {
      if (data.type !== 'notifications') return

      const newCount = data.count
      const newNotifications = data.notifications

      if (!isInitialLoadRef.current && newCount > prevCountRef.current) {
        const nuevasNotificaciones = newNotifications.filter((n: Notificacion) => !n.leida)

        if (nuevasNotificaciones.length > 0) {
          const ultimaNotificacion = nuevasNotificaciones[0]

          toast.info(ultimaNotificacion.titulo, {
            description: ultimaNotificacion.mensaje,
            duration: 5000,
            action: ultimaNotificacion.link
              ? {
                  label: 'Ver',
                  onClick: () => {
                    window.location.href = ultimaNotificacion.link || '/dashboard/notificaciones'
                  },
                }
              : undefined,
          })
        }
      }

      prevCountRef.current = newCount
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false
      }

      setState((prev) => ({
        ...prev,
        notifications: data.notifications,
        count: data.count,
        isConnected: true,
        error: null,
      }))
    }

    const poll = async () => {
      if (cancelled || (typeof document !== 'undefined' && document.hidden)) return

      try {
        const res = await fetch('/api/notificaciones/poll', { cache: 'no-store' })
        if (!res.ok) {
          setState((prev) => ({
            ...prev,
            isConnected: false,
            error: res.status === 401 ? null : 'Error al cargar notificaciones',
          }))
          return
        }
        const data = await res.json()
        applyPayload(data)
      } catch {
        setState((prev) => ({ ...prev, isConnected: false, error: 'Error de conexión' }))
      }
    }

    void poll()
    intervalId = setInterval(() => void poll(), POLL_MS)

    const onVisibility = () => {
      if (!document.hidden) void poll()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      if (intervalId) clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisibility)
      prevCountRef.current = 0
      isInitialLoadRef.current = true
    }
  }, [session?.user])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notificaciones/${notificationId}/marcar-leida`, {
        method: 'PATCH',
      })

      if (response.ok) {
        setState((prev) => ({
          ...prev,
          notifications: prev.notifications.map((n) =>
            n.id === notificationId ? { ...n, leida: true } : n
          ),
          count: Math.max(0, prev.count - 1),
        }))
      }
    } catch {
      // ignore
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notificaciones/marcar-todas-leidas', {
        method: 'PATCH',
      })

      if (response.ok) {
        setState((prev) => ({
          ...prev,
          notifications: prev.notifications.map((n) => ({ ...n, leida: true })),
          count: 0,
        }))
      }
    } catch {
      // ignore
    }
  }, [])

  return {
    notifications: state.notifications,
    count: state.count,
    isConnected: state.isConnected,
    error: state.error,
    markAsRead,
    markAllAsRead,
  }
}
