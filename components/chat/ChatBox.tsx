'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Mensaje {
  id: string
  contenido: string
  esAdmin: boolean
  leido: boolean
  createdAt: Date
  user: {
    name: string
    email: string
  }
}

interface ChatBoxProps {
  tramiteId: string
  mensajesIniciales: Mensaje[]
}

export default function ChatBox({ tramiteId, mensajesIniciales }: ChatBoxProps) {
  const { data: session } = useSession()
  const [mensajes, setMensajes] = useState<Mensaje[]>(mensajesIniciales)
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [isOpen, setIsOpen] = useState(false) // Estado para controlar si está abierto o cerrado
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isAdmin = session?.user?.rol === 'ADMIN'

  // Auto-scroll al último mensaje (solo cuando hay cambios en mensajes, no al cargar)
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    // Solo hacer scroll si hay mensajes Y el componente ya se montó
    if (mensajes.length > 0 && mensajes.length !== mensajesIniciales.length) {
      scrollToBottom()
    }
  }, [mensajes.length])

  const marcarComoLeidos = useCallback(async () => {
    try {
      // Crear AbortController para timeout manual
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // Timeout de 5 segundos

      await fetch(`/api/tramites/${tramiteId}/mensajes/marcar-leidos`, {
        method: 'PATCH',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
    } catch (error) {
      // Ignorar errores de abort (timeout)
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error al marcar mensajes como leídos:', error)
      }
    }
  }, [tramiteId])

  const cargarMensajes = useCallback(async () => {
    try {
      // Crear AbortController para timeout manual
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // Timeout de 8 segundos

      const response = await fetch(`/api/tramites/${tramiteId}/mensajes`, {
        cache: 'no-store',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        setMensajes(data)
        
        // Solo marcar como leídos si hay mensajes nuevos no leídos
        const hayMensajesNoLeidos = data.some((m: Mensaje) => !m.leido && m.esAdmin !== isAdmin)
        if (hayMensajesNoLeidos) {
          await marcarComoLeidos()
        }
      }
    } catch (error) {
      // Ignorar errores de abort (timeout)
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error al cargar mensajes:', error)
      }
    }
  }, [tramiteId, isAdmin, marcarComoLeidos])

  // Polling para nuevos mensajes cada 30 segundos (optimizado para reducir carga en servidor)
  // Solo hacer polling si el chat está abierto
  useEffect(() => {
    if (!isOpen) return // No hacer polling si el chat está cerrado

    const interval = setInterval(() => {
      cargarMensajes()
    }, 30000) // Aumentado de 5s a 30s

    // Cargar mensajes inmediatamente al abrir
    cargarMensajes()

    return () => clearInterval(interval)
  }, [tramiteId, isOpen, cargarMensajes])

  const enviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!nuevoMensaje.trim()) return

    setEnviando(true)

    try {
      const response = await fetch(`/api/tramites/${tramiteId}/mensajes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenido: nuevoMensaje })
      })

      if (response.ok) {
        const mensaje = await response.json()
        setMensajes([...mensajes, mensaje])
        setNuevoMensaje('')
        toast.success('Mensaje enviado')
      } else {
        toast.error('Error al enviar mensaje')
      }
    } catch (error) {
      toast.error('Error al enviar mensaje')
    } finally {
      setEnviando(false)
    }
  }

  const mensajesNoLeidos = mensajes.filter(m => !m.leido && m.esAdmin !== isAdmin).length

  return (
    <Card>
      <CardHeader 
        className="border-b cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            <CardTitle>Chat del Trámite</CardTitle>
            {mensajesNoLeidos > 0 && (
              <span className="px-2 py-0.5 bg-brand-500 text-white text-xs font-bold rounded-full">
                {mensajesNoLeidos}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(!isOpen)
            }}
            className="h-8 w-8 p-0"
          >
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
        <CardDescription>
          Comunícate directamente con {isAdmin ? 'el cliente' : 'nuestro equipo'}
        </CardDescription>
      </CardHeader>

      {isOpen && (
        <div className="flex flex-col h-[600px]">

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {mensajes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <MessageCircle className="h-12 w-12 mb-3 text-gray-300" />
            <p className="text-sm">No hay mensajes aún</p>
            <p className="text-xs mt-1">Inicia la conversación</p>
          </div>
        ) : (
          <>
            {mensajes.map((mensaje) => {
              const esMio = isAdmin ? mensaje.esAdmin : !mensaje.esAdmin
              
              return (
                <div
                  key={mensaje.id}
                  className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${esMio ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        esMio
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {!esMio && (
                        <p className="text-xs font-semibold mb-1 opacity-70">
                          {mensaje.user.name}
                        </p>
                      )}
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {mensaje.contenido}
                      </p>
                    </div>
                    <p className={`text-xs text-gray-500 mt-1 ${esMio ? 'text-right' : 'text-left'}`}>
                      {format(new Date(mensaje.createdAt), "d MMM, HH:mm", { locale: es })}
                      {esMio && mensaje.leido && (
                        <span className="ml-2 text-blue-600">✓✓</span>
                      )}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </CardContent>

          <div className="border-t p-4">
            <form onSubmit={enviarMensaje} className="flex gap-2">
              <Input
                value={nuevoMensaje}
                onChange={(e) => setNuevoMensaje(e.target.value)}
                placeholder="Escribe un mensaje..."
                disabled={enviando}
                className="flex-1"
                maxLength={1000}
              />
              <Button type="submit" disabled={enviando || !nuevoMensaje.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-xs text-gray-500 mt-2">
              Los mensajes se actualizan automáticamente
            </p>
          </div>
        </div>
      )}
    </Card>
  )
}

