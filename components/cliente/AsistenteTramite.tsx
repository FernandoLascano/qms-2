'use client'

import { useEffect, useRef, useState } from 'react'
import { Sparkles, Send, Loader2 } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Mensaje {
  role: 'user' | 'assistant'
  content: string
}

const PREGUNTAS = ['¿Qué me falta hacer?', '¿Qué sigue ahora?', '¿Cómo hago el depósito del capital?']

// Asistente con IA que conoce el estado de este trámite. Responde al instante
// lo que ya está a la vista; lo que necesita a una persona lo deriva al chat
// con el equipo, que está más abajo.
export default function AsistenteTramite({ tramiteId }: { tramiteId: string }) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [texto, setTexto] = useState('')
  const [cargando, setCargando] = useState(false)
  const finRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (mensajes.length > 0) finRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [mensajes, cargando])

  const preguntar = async (pregunta: string) => {
    const consulta = pregunta.trim()
    if (!consulta || cargando) return

    const conversacion: Mensaje[] = [...mensajes, { role: 'user', content: consulta }]
    setMensajes(conversacion)
    setTexto('')
    setCargando(true)

    let respuesta = 'No pude responderte ahora. Probá de nuevo o escribile al equipo acá abajo.'
    try {
      const res = await fetch(`/api/tramites/${tramiteId}/asistente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversacion }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.message) respuesta = data.message
      else if (res.status === 429) respuesta = 'Hiciste muchas consultas seguidas. Esperá un minuto y probá de nuevo.'
    } catch {
      // Queda el mensaje genérico.
    }
    setMensajes([...conversacion, { role: 'assistant', content: respuesta }])
    setCargando(false)
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-info-soft text-info">
            <Sparkles className="h-4.5 w-4.5" aria-hidden />
          </span>
          <div>
            <p className="text-body font-semibold text-ink">Preguntale al asistente</p>
            <p className="text-body-sm text-ink-2">
              Responde al instante sobre tu trámite. Es un asistente automático: para lo que necesite a una
              persona, escribile al equipo más abajo.
            </p>
          </div>
        </div>

        {mensajes.length === 0 ? (
          <div className="flex flex-wrap gap-2">
            {PREGUNTAS.map((p) => (
              <Button key={p} variant="secondary" size="sm" onClick={() => preguntar(p)} disabled={cargando}>
                {p}
              </Button>
            ))}
          </div>
        ) : (
          <div className="max-h-96 space-y-3 overflow-y-auto rounded-control bg-surface-2 p-3" aria-live="polite">
            {mensajes.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <p
                  className={`max-w-[85%] whitespace-pre-wrap break-words rounded-control px-4 py-2 text-body-sm ${
                    m.role === 'user' ? 'bg-info-solid text-on-primary' : 'border border-line bg-surface text-ink'
                  }`}
                >
                  {m.content}
                </p>
              </div>
            ))}
            {cargando && (
              <div className="flex justify-start">
                <span className="rounded-control border border-line bg-surface px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-ink-2" aria-label="Pensando" />
                </span>
              </div>
            )}
            <div ref={finRef} />
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            preguntar(texto)
          }}
          className="flex gap-2"
        >
          <Input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribí tu consulta…"
            aria-label="Tu consulta para el asistente"
            maxLength={500}
            disabled={cargando}
            className="flex-1"
          />
          <Button type="submit" disabled={cargando || !texto.trim()} aria-label="Enviar consulta">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardBody>
    </Card>
  )
}
