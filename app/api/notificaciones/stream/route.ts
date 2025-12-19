import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// SSE endpoint para notificaciones en tiempo real
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const userId = session.user.id

  // Configurar headers para SSE
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      console.log(`📡 SSE conectado para usuario ${userId}`)

      let interval: NodeJS.Timeout | null = null
      let isClosed = false

      // Función para enviar evento
      const sendEvent = (data: any) => {
        if (isClosed) return

        try {
          const message = `data: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(message))
        } catch (error) {
          console.error('Error al enviar evento SSE:', error)
          cleanup()
        }
      }

      // Función de limpieza
      const cleanup = () => {
        if (isClosed) return
        isClosed = true

        if (interval) {
          clearInterval(interval)
          interval = null
        }

        try {
          controller.close()
        } catch (error) {
          // El controller ya podría estar cerrado
        }

        console.log(`📡 SSE desconectado para usuario ${userId}`)
      }

      // Enviar evento inicial de conexión
      sendEvent({ type: 'connected', timestamp: new Date().toISOString() })

      // Función para verificar nuevas notificaciones
      const checkNotifications = async () => {
        if (isClosed) return

        try {
          // Obtener últimas 5 notificaciones no leídas
          const notificaciones = await prisma.notificacion.findMany({
            where: {
              userId,
              leida: false
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 5,
            select: {
              id: true,
              tipo: true,
              titulo: true,
              mensaje: true,
              link: true,
              leida: true,
              createdAt: true,
              tramiteId: true
            }
          })

          // Contar notificaciones no leídas
          const count = await prisma.notificacion.count({
            where: {
              userId,
              leida: false
            }
          })

          // Enviar actualización
          sendEvent({
            type: 'notifications',
            count,
            notifications: notificaciones,
            timestamp: new Date().toISOString()
          })
        } catch (error) {
          console.error('Error al obtener notificaciones:', error)
          // No cerrar la conexión por un error de DB temporal
        }
      }

      // Verificar notificaciones cada 5 segundos
      interval = setInterval(checkNotifications, 5000)

      // Verificar inmediatamente
      await checkNotifications()

      // Limpiar al cerrar la conexión
      request.signal.addEventListener('abort', cleanup)
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  })
}
