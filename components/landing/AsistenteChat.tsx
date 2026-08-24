'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { leerAtribucion } from '@/lib/leads/atribucion-cliente'
import Script from 'next/script'
import { MessageCircle, Send, X, Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useTurnstileWidget } from '@/lib/hooks/use-turnstile-widget'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const mensajeInicial =
  'Hola, soy el Asistente QMS. Respondo consultas sobre constitución de S.A.S. y nuestro servicio. ¿En qué puedo ayudarte?'

export function AsistenteChat() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  // Captura de contacto. Es opcional y no corta la conversación: pedirle los
  // datos a alguien que todavía está entendiendo qué es una S.A.S. es la mejor
  // forma de que se vaya. Hasta ahora el chat era anónimo y no había manera de
  // responderle a nadie.
  const [emailLead, setEmailLead] = useState('')
  const [dejoEmail, setDejoEmail] = useState(false)
  const [ocultarCaptura, setOcultarCaptura] = useState(false)
  const [guardandoEmail, setGuardandoEmail] = useState(false)

  const respuestas = messages.filter((m) => m.role === 'assistant').length
  const mostrarCaptura = respuestas >= 2 && !dejoEmail && !ocultarCaptura

  const guardarEmail = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLead)) return
    setGuardandoEmail(true)
    try {
      const res = await fetch('/api/leads/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailLead,
          consulta: messages
            .filter((m) => m.role === 'user')
            .map((m) => m.content)
            .join('\n\n'),
          atribucion: leerAtribucion(),
        }),
      })
      if (res.ok) setDejoEmail(true)
    } catch {
      // Silencioso: es un extra, no puede arruinar la conversación.
    } finally {
      setGuardandoEmail(false)
    }
  }

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const captchaRequired = process.env.NODE_ENV === 'production' && !session?.user

  const onTurnstileToken = useCallback((token: string | null) => setTurnstileToken(token), [])
  const { setContainerRef, onScriptLoad } = useTurnstileWidget({
    siteKey,
    captchaRequired,
    onTokenChange: onTurnstileToken,
  })

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const enviar = async () => {
    const texto = input.trim()
    if (!texto || loading) return

    if (captchaRequired && (!siteKey || !turnstileToken)) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Completá la verificación anti-spam debajo del mensaje antes de enviar.',
        },
      ])
      return
    }

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: texto }])
    setLoading(true)

    try {
      const mensajesParaApi = [...messages, { role: 'user' as const, content: texto }].map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: mensajesParaApi,
          turnstileToken: turnstileToken || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al enviar')
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'No pude procesar tu consulta. Probá de nuevo o contactanos por WhatsApp o email.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {siteKey && captchaRequired && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={onScriptLoad}
        />
      )}

      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-brand-700 text-white shadow-pop hover:bg-brand-800 transition-all flex items-center justify-center cursor-pointer"
        aria-label="Abrir asistente"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {open && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[420px] max-w-[calc(100vw-32px)] bg-surface rounded-card shadow-modal border border-line overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-brand-700 to-brand-800 text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-surface/20 rounded-chip flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-sm">Asistente QMS</span>
                <p className="text-xs text-white/70">Respuestas al instante</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 hover:bg-surface/10 rounded-chip transition cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[400px] min-h-[200px] p-5 space-y-4 bg-surface-2">
            {messages.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 bg-brand-100 rounded-card flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-7 h-7 text-brand-700" />
                </div>
                <p className="text-n-700 text-sm font-medium leading-relaxed">{mensajeInicial}</p>
                <p className="text-xs text-n-400 mt-2">Solo respondo sobre S.A.S. y nuestro servicio</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-card text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-brand-700 text-white rounded-br-md'
                        : 'bg-surface border border-line text-n-800 rounded-bl-md shadow-card'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}

            {mostrarCaptura && (
              <div className="rounded-card border border-line bg-surface p-4 shadow-card">
                <p className="text-sm font-medium text-n-800">¿Querés que te sigamos por email?</p>
                <p className="mt-1 text-xs text-n-500">
                  Te escribimos para despejar lo que te haya quedado dando vueltas. Podés seguir
                  preguntando acá igual.
                </p>
                <div className="mt-3 flex gap-2">
                  <input
                    type="email"
                    value={emailLead}
                    onChange={(e) => setEmailLead(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') guardarEmail() }}
                    placeholder="tu@email.com"
                    aria-label="Tu email"
                    className="flex-1 rounded-control border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    onClick={guardarEmail}
                    disabled={guardandoEmail}
                    className="rounded-control bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
                  >
                    Enviar
                  </button>
                </div>
                <button
                  onClick={() => setOcultarCaptura(true)}
                  className="mt-2 text-xs text-n-400 underline underline-offset-2 hover:text-n-600"
                >
                  No, gracias
                </button>
              </div>
            )}

            {dejoEmail && (
              <div className="rounded-card border border-line bg-surface p-4 text-sm text-n-700 shadow-card">
                Listo, te vamos a escribir. Seguí preguntando lo que quieras.
              </div>
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-surface border border-line px-4 py-3 rounded-card rounded-bl-md shadow-card">
                  <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              enviar()
            }}
            className="p-4 border-t border-line bg-surface space-y-3"
          >
            {captchaRequired && siteKey && (
              <div className="flex justify-center min-h-[65px]" ref={setContainerRef} />
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribí tu consulta..."
                className="flex-1 px-4 py-3 border border-line-strong rounded-control text-sm text-ink placeholder:text-n-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-surface"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim() || (captchaRequired && (!siteKey || !turnstileToken))}
                className="p-3 bg-brand-700 text-white rounded-control hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
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
