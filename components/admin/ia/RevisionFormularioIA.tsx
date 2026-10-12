'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge, type Tone } from '@/components/ui/badge'
import { pedirIA, mensajeDeError } from '@/lib/ai/pedir'
import type { RevisionFormulario } from '@/lib/ai/tramite'

const GRAVEDAD: Record<RevisionFormulario['observaciones'][number]['gravedad'], { label: string; tone: Tone }> = {
  bloqueante: { label: 'Pedir corrección', tone: 'danger' },
  revisar: { label: 'Revisar', tone: 'warning' },
  sugerencia: { label: 'Sugerencia', tone: 'neutral' },
}

interface Props {
  tramiteId: string
  /** Pasa el mensaje para el cliente al cuadro de observaciones. */
  onUsarMensaje?: (texto: string) => void
}

// Primera lectura del formulario hecha por IA. No valida ni pide nada: deja la
// lista de lo que hay que mirar y un mensaje de correcciones para editar.
export default function RevisionFormularioIA({ tramiteId, onUsarMensaje }: Props) {
  const [cargando, setCargando] = useState(false)
  const [revision, setRevision] = useState<RevisionFormulario | null>(null)

  const revisar = async () => {
    setCargando(true)
    try {
      setRevision(await pedirIA(`/api/admin/tramites/${tramiteId}/ia`, { accion: 'revisar-formulario' }))
    } catch (error) {
      toast.error(mensajeDeError(error))
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="rounded-control border border-line bg-surface p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-body-sm font-semibold text-ink flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-info" aria-hidden />
            Revisión con IA
          </p>
          <p className="text-label text-ink-2">
            Lee el formulario completo y marca lo que conviene mirar. Tarda unos 30 segundos.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={revisar} disabled={cargando} className="gap-2">
          {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {cargando ? 'Revisando…' : revision ? 'Volver a revisar' : 'Revisar formulario'}
        </Button>
      </div>

      {revision && (
        <div className="space-y-3">
          <p className="text-body-sm text-ink">{revision.resumen}</p>

          {revision.observaciones.length === 0 ? (
            <p className="text-body-sm text-success font-medium">No encontró nada para observar.</p>
          ) : (
            <ul className="divide-y divide-line border border-line rounded-control">
              {revision.observaciones.map((o, i) => (
                <li key={i} className="p-3 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={GRAVEDAD[o.gravedad].tone}>{GRAVEDAD[o.gravedad].label}</Badge>
                    <span className="text-body-sm font-semibold text-ink">{o.campo}</span>
                  </div>
                  <p className="text-body-sm text-ink">{o.detalle}</p>
                  <p className="text-label text-ink-2">{o.sugerencia}</p>
                </li>
              ))}
            </ul>
          )}

          {revision.mensajeCliente && onUsarMensaje && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onUsarMensaje(revision.mensajeCliente)
                toast.success('Mensaje copiado a las observaciones. Revisalo antes de enviar.')
              }}
            >
              Usar el mensaje sugerido para pedir correcciones
            </Button>
          )}

          <p className="text-label text-ink-3">
            Es una ayuda: puede equivocarse o pasar algo por alto. La validación la decidís vos.
          </p>
        </div>
      )}
    </div>
  )
}
