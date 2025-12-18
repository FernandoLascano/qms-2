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

      // Función para enviar evento
      const sendEvent = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(message))
      }

      // Enviar evento inicial de conexión
      sendEvent({ type: 'connected', timestamp: new Date().toISOString() })

      // Función para verificar nuevas notificaciones
      const checkNotifications = async () => {
        try {
          // Obtener notificaciones no leídas
          const notificaciones = await prisma.notificacion.findMany({
            where: {
              userId,
              leida: false
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 10,
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
        }
      }

      // Verificar notificaciones cada 5 segundos
      const interval = setInterval(checkNotifications, 5000)

      // Verificar inmediatamente
      await checkNotifications()

      // Limpiar al cerrar la conexión
      request.signal.addEventListener('abort', () => {
        console.log(`📡 SSE desconectado para usuario ${userId}`)
        clearInterval(interval)
        controller.close()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}
