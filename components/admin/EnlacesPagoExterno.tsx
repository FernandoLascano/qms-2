'use client'

import { useState } from 'react'
import CollapsibleCard from '@/components/admin/CollapsibleCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Link as LinkIcon, Clock, Send, CheckCircle, XCircle } from 'lucide-react'

interface EnlacePago {
  id: string
  concepto: string
  enlace: string
  estado: string
  fechaEnvio: Date
  fechaVencimiento: Date | null
  fechaPago: Date | null
  reportadoVencido: boolean
}

interface EnlacesPagoExternoProps {
  tramiteId: string
  enlaces: EnlacePago[]
}

export default function EnlacesPagoExterno({ tramiteId, enlaces }: EnlacesPagoExternoProps) {
  const router = useRouter()
  const [enviando, setEnviando] = useState(false)
  const [nuevoEnlace, setNuevoEnlace] = useState({
    concepto: 'TASA_RESERVA_NOMBRE',
    enlace: '',
    monto: '',
    fechaVencimiento: ''
  })

  const handleEnviarEnlace = async () => {
    if (!nuevoEnlace.enlace || !nuevoEnlace.monto) {
      toast.error('Completa todos los campos')
      return
    }

    setEnviando(true)

    try {
      const response = await fetch(`/api/admin/tramites/${tramiteId}/enlaces-pago`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoEnlace)
      })

      if (response.ok) {
        toast.success('Enlace de pago enviado al cliente')
        setNuevoEnlace({
          concepto: 'TASA_RESERVA_NOMBRE',
          enlace: '',
          monto: '',
          fechaVencimiento: ''
        })
        router.refresh()
      } else {
        toast.error('Error al enviar enlace')
      }
    } catch (error) {
      toast.error('Error al enviar enlace')
    } finally {
      setEnviando(false)
    }
  }

  const handleMarcarPagado = async (enlaceId: string) => {
    try {
      const response = await fetch(`/api/admin/enlaces-pago/${enlaceId}/marcar-pagado`, {
        method: 'PATCH'
      })

      if (response.ok) {
        toast.success('Enlace marcado como pagado')
        router.refresh()
      } else {
        toast.error('Error al marcar como pagado')
      }
    } catch (error) {
      toast.error('Error al marcar como pagado')
    }
  }

  const conceptosDisponibles = [
    { value: 'TASA_RESERVA_NOMBRE', label: 'Tasa Reserva de Nombre' },
    { value: 'TASA_RETRIBUTIVA', label: 'Tasa Retributiva (Final)' },
    { value: 'PUBLICACION_BOLETIN', label: 'Publicación en Boletín' },
    { value: 'OTROS', label: 'Otro pago externo' },
  ]

  const getEstadoColor = (estado: string, reportadoVencido: boolean) => {
    if (reportadoVencido) return 'bg-primary-soft border-primary-line'
    if (estado === 'PAGADO') return 'bg-success-soft border-success-line'
    if (estado === 'VENCIDO') return 'bg-warning-soft border-warning-line'
    return 'bg-info-soft border-info-line'
  }

  return (
    <div className="border-warning-line bg-warning-soft rounded-control">
      <CollapsibleCard
        title="Enlaces de Pago Externo"
        description="Envía enlaces del portal de Córdoba u otros sistemas externos"
        icon={<LinkIcon className="h-5 w-5 text-warning" />}
      >
        <div className="space-y-4">
        {/* Enlaces Enviados */}
        {enlaces && enlaces.length > 0 && (
          <div className="space-y-3 mb-4">
            <h4 className="font-medium text-body-sm text-ink-2">Enlaces Enviados</h4>
            {enlaces.map((enlace: any) => (
              <div
                key={enlace.id}
                className={`p-4 border-2 rounded-control ${getEstadoColor(enlace.estado, enlace.reportadoVencido)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-body-sm text-ink">{enlace.concepto}</p>
                      {enlace.estado === 'PAGADO' && (
                        <CheckCircle className="h-4 w-4 text-success" />
                      )}
                      {enlace.reportadoVencido && (
                        <XCircle className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-label text-ink-2 mb-2">
                      Enviado: {new Date(enlace.fechaEnvio).toLocaleDateString('es-AR')}
                      {enlace.fechaVencimiento && (
                        <> • Vence: {new Date(enlace.fechaVencimiento).toLocaleDateString('es-AR')}</>
                      )}
                    </p>
                    {enlace.reportadoVencido && (
                      <p className="text-label text-primary font-medium">
                        ⚠️ Cliente reportó que el enlace está vencido
                      </p>
                    )}
                    <a
                      href={enlace.enlace}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-label text-info hover:underline break-all"
                    >
                      {enlace.enlace}
                    </a>
                  </div>
                  {enlace.estado !== 'PAGADO' && (
                    <Button
                      size="sm"
                      onClick={() => handleMarcarPagado(enlace.id)}
                      className="ml-2 bg-success-solid hover:bg-success-solid"
                    >
                      Marcar Pagado
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enviar Nuevo Enlace */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-body-sm text-ink-2 mb-3">Enviar Nuevo Enlace de Pago</h4>
          <div className="space-y-3 bg-surface p-4 rounded-control border">
            <div>
              <Label htmlFor="conceptoEnlace">Concepto *</Label>
              <select
                id="conceptoEnlace"
                value={nuevoEnlace.concepto}
                onChange={(e) => setNuevoEnlace(prev => ({ ...prev, concepto: e.target.value }))}
                className="flex h-10 w-full rounded-control border border-line-strong bg-surface px-3 py-2 text-body-sm text-ink focus:outline-none focus:ring-2 focus:ring-info-solid"
                disabled={enviando}
              >
                {conceptosDisponibles.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="montoEnlace">Monto a Pagar (ARS) *</Label>
              <Input
                id="montoEnlace"
                type="number"
                value={nuevoEnlace.monto}
                onChange={(e) => setNuevoEnlace(prev => ({ ...prev, monto: e.target.value }))}
                placeholder="15000"
                disabled={enviando}
              />
            </div>

            <div>
              <Label htmlFor="enlace">Enlace de Pago *</Label>
              <Input
                id="enlace"
                type="url"
                value={nuevoEnlace.enlace}
                onChange={(e) => setNuevoEnlace(prev => ({ ...prev, enlace: e.target.value }))}
                placeholder="https://pagos.cba.gov.ar/..."
                disabled={enviando}
              />
              <p className="text-label text-ink-2 mt-1">
                Enlace del portal de pagos de Córdoba u otro sistema
              </p>
            </div>

            <div>
              <Label htmlFor="fechaVencimiento">Fecha de Vencimiento (opcional)</Label>
              <Input
                id="fechaVencimiento"
                type="date"
                value={nuevoEnlace.fechaVencimiento}
                onChange={(e) => setNuevoEnlace(prev => ({ ...prev, fechaVencimiento: e.target.value }))}
                disabled={enviando}
              />
            </div>

            <Button
              onClick={handleEnviarEnlace}
              disabled={enviando || !nuevoEnlace.enlace || !nuevoEnlace.monto}
              className="w-full gap-2 bg-warning-solid hover:bg-warning-solid"
            >
              <Send className="h-4 w-4" />
              {enviando ? 'Enviando...' : 'Enviar Enlace al Cliente'}
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="bg-warning-soft border border-warning-line rounded-control p-3">
          <p className="text-label text-warning">
            💡 <strong>Tip:</strong> El cliente verá este enlace en su panel y recibirá una notificación. 
            Si el enlace vence, puede reportarlo y recibirás una alerta para enviar uno nuevo.
          </p>
        </div>
        </div>
      </CollapsibleCard>
    </div>
  )
}

