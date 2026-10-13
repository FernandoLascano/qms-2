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

type Recomendacion = 'validar' | 'revisar' | 'corregir'

const RECOMENDACION: Record<Recomendacion, { texto: string; clase: string }> = {
  validar: { texto: 'Recomendación: validar', clase: 'border-success-line bg-success-soft text-success' },
  revisar: { texto: 'Recomendación: mirar los puntos marcados antes de validar', clase: 'border-warning-line bg-warning-soft text-warning' },
  corregir: { texto: 'Recomendación: no validar, pedir correcciones', clase: 'border-danger-line bg-danger-soft text-danger' },
}

// La recomendación sale de la gravedad de las observaciones, no de otra opinión
// del modelo: así nunca contradice la lista que se muestra abajo.
function recomendacion(revision: RevisionFormulario): Recomendacion {
  if (revision.observaciones.some((o) => o.gravedad === 'bloqueante')) return 'corregir'
  if (revision.observaciones.some((o) => o.gravedad === 'revisar')) return 'revisar'
  return 'validar'
}

/** La revisión guardada llega como JSON de la base: se usa sólo si tiene la forma esperada. */
function revisionValida(valor: unknown): RevisionFormulario | null {
  const r = valor as RevisionFormulario | null
  return r && typeof r === 'object' && typeof r.resumen === 'string' && Array.isArray(r.observaciones) ? r : null
}

interface Props {
  tramiteId: string
  /** Revisión hecha al llegar el formulario, si ya está. */
  inicial?: unknown
  /** Pasa el mensaje para el cliente al cuadro de observaciones. */
  onUsarMensaje?: (texto: string) => void
}

// Primera lectura del formulario hecha por IA. Corre sola cuando el cliente lo
// envía (`inicial`); el botón la repite. No valida ni pide nada: deja una
// recomendación, lo que hay que mirar y un mensaje de correcciones para editar.
export default function RevisionFormularioIA({ tramiteId, inicial, onUsarMensaje }: Props) {
  const [cargando, setCargando] = useState(false)
  const [revision, setRevision] = useState<RevisionFormulario | null>(() => revisionValida(inicial))

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
            {revision
              ? 'Se hizo sola al llegar el formulario. Si cambiaste datos, volvé a revisar.'
              : 'Lee el formulario completo y marca lo que conviene mirar. Tarda unos 30 segundos.'}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={revisar} disabled={cargando} className="gap-2">
          {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {cargando ? 'Revisando…' : revision ? 'Volver a revisar' : 'Revisar formulario'}
        </Button>
      </div>

      {revision && (
        <div className="space-y-3">
          <p className={`rounded-control border px-3 py-2 text-body-sm font-semibold ${RECOMENDACION[recomendacion(revision)].clase}`}>
            {RECOMENDACION[recomendacion(revision)].texto}
          </p>
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
