'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, Send, X, Loader2 } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const mensajeInicial = 'Hola, soy el Asistente QMS. Respondo consultas sobre constitución de S.A.S. y nuestro servicio. ¿En qué puedo ayudarte?'

export function AsistenteChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const enviar = async () => {
    const texto = input.trim()
    if (!texto || loading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: texto }])
    setLoading(true)

    try {
      const mensajesParaApi = [...messages, { role: 'user' as const, content: texto }].map(m => ({
        role: m.role,
        content: m.content
      }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: mensajesParaApi })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al enviar')
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'No pude procesar tu consulta. Probá de nuevo o contactanos por WhatsApp o email.'
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-brand-700 text-white shadow-lg hover:bg-brand-800 transition-all flex items-center justify-center"
        aria-label="Abrir asistente"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Panel de chat */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-brand-700 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold">Asistente QMS</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 hover:bg-brand-800 rounded transition"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto max-h-[320px] p-4 space-y-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 text-sm">{mensajeInicial}</p>
                <p className="text-xs text-gray-500 mt-1">Solo respondo sobre S.A.S. y nuestro servicio</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-brand-700 text-white rounded-br-md'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 px-4 py-2 rounded-2xl rounded-bl-md">
                  <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); enviar() }}
            className="p-4 border-t border-gray-200 bg-white"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribí tu consulta..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2 bg-brand-700 text-white rounded-xl hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
