'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { pedirIA, mensajeDeError } from '@/lib/ai/pedir'
import type { ExplicacionObservacion } from '@/lib/ai/tramite'

const QUIEN: Record<ExplicacionObservacion['quienLoResuelve'], string> = {
  qms: 'Lo resuelve QMS',
  cliente: 'Necesita al cliente',
  ambos: 'QMS y el cliente',
}

interface Props {
  tramiteId: string
  /** El texto de la observación tal como está escrito en el formulario (guardado o no). */
  observacion: string
}

// Explica una observación del organismo y propone el mensaje para el cliente.
// El mensaje se manda recién cuando el admin lo revisa y aprieta Enviar.
export default function ObservacionIA({ tramiteId, observacion }: Props) {
  const [cargando, setCargando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [explicacion, setExplicacion] = useState<ExplicacionObservacion | null>(null)
  const [mensaje, setMensaje] = useState('')

  const explicar = async () => {
    setCargando(true)
    try {
      const data = await pedirIA<ExplicacionObservacion>(`/api/admin/tramites/${tramiteId}/ia`, {
        accion: 'explicar-observacion',
        observacion,
      })
      setExplicacion(data)
      setMensaje(data.mensajeCliente)
    } catch (error) {
      toast.error(mensajeDeError(error))
    } finally {
      setCargando(false)
    }
  }

  const enviar = async () => {
    setEnviando(true)
    try {
      const res = await fetch(`/api/admin/tramites/${tramiteId}/observacion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje }),
      })
      if (!res.ok) throw new Error()
      toast.success('Mensaje enviado al cliente')
    } catch {
      toast.error('No se pudo enviar el mensaje')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={explicar}
        disabled={cargando || !observacion.trim()}
        className="gap-2"
      >
        {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {cargando ? 'Analizando…' : 'Explicar la observación con IA'}
      </Button>

      {explicacion && (
        <div className="rounded-control border border-line bg-surface p-4 space-y-3">
          <div>
            <p className="text-label font-semibold text-ink-2">En simple · {QUIEN[explicacion.quienLoResuelve]}</p>
            <p className="text-body-sm text-ink">{explicacion.enSimple}</p>
          </div>
          <div>
            <p className="text-label font-semibold text-ink-2">Qué hay que hacer</p>
            <ol className="list-decimal pl-5 space-y-1 text-body-sm text-ink">
              {explicacion.queHayQueHacer.map((paso, i) => (
                <li key={i}>{paso}</li>
              ))}
            </ol>
          </div>
          {explicacion.dudas && (
            <div className="rounded-chip border border-warning-line bg-warning-soft p-3">
              <p className="text-label font-semibold text-warning">Para confirmar antes de responder</p>
              <p className="text-body-sm text-ink">{explicacion.dudas}</p>
            </div>
          )}
          <div>
            <label htmlFor="mensajeObservacionIA" className="block text-label font-semibold text-ink-2 mb-1">
              Mensaje para el cliente (editalo antes de enviar)
            </label>
            <Textarea
              id="mensajeObservacionIA"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows={10}
            />
          </div>
          <Button type="button" size="sm" onClick={enviar} disabled={enviando || !mensaje.trim()} className="gap-2">
            <Send className="h-4 w-4" />
            {enviando ? 'Enviando…' : 'Enviar al cliente'}
          </Button>
          <p className="text-label text-ink-3">
            Es una ayuda: verificá los pasos contra el expediente. El cliente recibe el mensaje como notificación y por mail.
          </p>
        </div>
      )}
    </div>
  )
}
