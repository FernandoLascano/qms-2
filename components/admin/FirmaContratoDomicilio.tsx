'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Ban, RefreshCw } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/card'
import { Badge, type Tone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EVENTO_FIRMA_ACTUALIZADA } from '@/components/admin/ContratoDomicilio'
import type { EstadoFirma, Evento } from '@/lib/contrato-domicilio-firma'

const ETIQUETA: Record<EstadoFirma, string> = {
  PENDIENTE: 'Esperando la firma del cliente',
  PROCESANDO: 'Firmado por el cliente · armando el PDF',
  FIRMADO: 'Firmado por las partes',
  ANULADA: 'Anulada',
}
const TONO: Record<EstadoFirma, Tone> = {
  PENDIENTE: 'warning',
  PROCESANDO: 'info',
  FIRMADO: 'success',
  ANULADA: 'neutral',
}

type Resumen = {
  id: string
  estado: EstadoFirma
  version: number
  enviadoPor: string | null
  createdAt: string
  firmantes: { nombre: string }[]
  eventos: Evento[]
}

const fechaHora = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', dateStyle: 'short', timeStyle: 'short' })

/** Estado de la firma electrónica del contrato, con su registro de auditoría. */
export default function FirmaContratoDomicilio({ tramiteId }: { tramiteId: string }) {
  const [firma, setFirma] = useState<Resumen | null>(null)
  const [ocupado, setOcupado] = useState<'anular' | 'reintentar' | null>(null)
  const [anulando, setAnulando] = useState(false)

  const cargar = useCallback(async () => {
    const res = await fetch(`/api/admin/tramites/${tramiteId}/contrato-domicilio/firma`).catch(() => null)
    if (res?.ok) setFirma((await res.json()).firma)
  }, [tramiteId])

  useEffect(() => {
    cargar()
    window.addEventListener(EVENTO_FIRMA_ACTUALIZADA, cargar)
    return () => window.removeEventListener(EVENTO_FIRMA_ACTUALIZADA, cargar)
  }, [cargar])

  // Mientras se arma el PDF final, se vuelve a mirar cada tanto.
  useEffect(() => {
    if (firma?.estado !== 'PROCESANDO') return
    const t = setInterval(cargar, 10_000)
    return () => clearInterval(t)
  }, [firma?.estado, cargar])

  async function accion(a: 'anular' | 'reintentar') {
    setOcupado(a)
    try {
      const res = await fetch(`/api/admin/tramites/${tramiteId}/contrato-domicilio/firma`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: a }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || 'No se pudo')
      setFirma(json.firma)
      setAnulando(false)
      toast.success(a === 'anular' ? 'Solicitud anulada' : 'Contrato firmado guardado')
      // El bloque de contrato firmado se entera recargando la ficha.
      if (a === 'reintentar') window.location.reload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo')
    } finally {
      setOcupado(null)
    }
  }

  if (!firma) return null

  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-heading text-ink">Firma electrónica del contrato</h3>
              <Badge tone={TONO[firma.estado]} dot size="sm">{ETIQUETA[firma.estado]}</Badge>
            </div>
            <p className="text-body-sm text-ink-2">
              v{firma.version} enviada el {fechaHora(firma.createdAt)}
              {firma.enviadoPor ? ` por ${firma.enviadoPor}` : ''} · firma{firma.firmantes.length > 1 ? 'n' : ''}{' '}
              {firma.firmantes.map((f) => f.nombre).join(' y ')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {firma.estado === 'PENDIENTE' && (
              <Button size="sm" variant="ghost" onClick={() => setAnulando(true)}>
                <Ban className="h-4 w-4" aria-hidden /> Anular
              </Button>
            )}
            {firma.estado === 'PROCESANDO' && (
              <Button size="sm" variant="secondary" onClick={() => accion('reintentar')} loading={ocupado === 'reintentar'}>
                {ocupado !== 'reintentar' && <RefreshCw className="h-4 w-4" aria-hidden />} Reintentar el PDF
              </Button>
            )}
          </div>
        </div>

        <details className="border-t border-line pt-3">
          <summary className="cursor-pointer text-label font-medium text-ink-2">Registro de auditoría ({firma.eventos.length})</summary>
          <ul className="mt-2 space-y-1 text-body-sm">
            {firma.eventos.map((e, i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 tabular-nums text-ink-3">{fechaHora(e.fecha)}</span>
                <span className="min-w-0 break-words text-ink-2">
                  {e.accion}
                  {e.detalle ? ` · ${e.detalle}` : ''}
                  {e.ip ? ` · IP ${e.ip}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </details>
      </CardBody>

      <ConfirmDialog
        open={anulando}
        onOpenChange={setAnulando}
        title="¿Anular el contrato enviado?"
        description="El cliente ya no lo va a poder firmar. Después podés mandar uno nuevo."
        confirmLabel="Anular"
        onConfirm={() => accion('anular')}
        loading={ocupado === 'anular'}
        destructive
      />
    </Card>
  )
}
