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
    if (reportadoVencido) return 'bg-brand-50 border-brand-300'
    if (estado === 'PAGADO') return 'bg-green-50 border-green-300'
    if (estado === 'VENCIDO') return 'bg-orange-50 border-orange-300'
    return 'bg-blue-50 border-blue-300'
  }

  return (
    <div className="border-orange-200 bg-orange-50 rounded-lg">
      <CollapsibleCard
        title="Enlaces de Pago Externo"
        description="Envía enlaces del portal de Córdoba u otros sistemas externos"
        icon={<LinkIcon className="h-5 w-5 text-orange-700" />}
      >
        <div className="space-y-4">
        {/* Enlaces Enviados */}
        {enlaces && enlaces.length > 0 && (
          <div className="space-y-3 mb-4">
            <h4 className="font-medium text-sm text-gray-700">Enlaces Enviados</h4>
            {enlaces.map((enlace: any) => (
              <div
                key={enlace.id}
                className={`p-4 border-2 rounded-lg ${getEstadoColor(enlace.estado, enlace.reportadoVencido)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm text-gray-900">{enlace.concepto}</p>
                      {enlace.estado === 'PAGADO' && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      {enlace.reportadoVencido && (
                        <XCircle className="h-4 w-4 text-brand-600" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      Enviado: {new Date(enlace.fechaEnvio).toLocaleDateString('es-AR')}
                      {enlace.fechaVencimiento && (
                        <> • Vence: {new Date(enlace.fechaVencimiento).toLocaleDateString('es-AR')}</>
                      )}
                    </p>
                    {enlace.reportadoVencido && (
                      <p className="text-xs text-brand-600 font-medium">
                        ⚠️ Cliente reportó que el enlace está vencido
                      </p>
                    )}
                    <a
                      href={enlace.enlace}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline break-all"
                    >
                      {enlace.enlace}
                    </a>
                  </div>
                  {enlace.estado !== 'PAGADO' && (
                    <Button
                      size="sm"
                      onClick={() => handleMarcarPagado(enlace.id)}
                      className="ml-2 bg-green-600 hover:bg-green-700"
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
          <h4 className="font-medium text-sm text-gray-700 mb-3">Enviar Nuevo Enlace de Pago</h4>
          <div className="space-y-3 bg-white p-4 rounded-lg border">
            <div>
              <Label htmlFor="conceptoEnlace">Concepto *</Label>
              <select
                id="conceptoEnlace"
                value={nuevoEnlace.concepto}
                onChange={(e) => setNuevoEnlace(prev => ({ ...prev, concepto: e.target.value }))}
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
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
              <p className="text-xs text-gray-500 mt-1">
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
              className="w-full gap-2 bg-orange-600 hover:bg-orange-700"
            >
              <Send className="h-4 w-4" />
              {enviando ? 'Enviando...' : 'Enviar Enlace al Cliente'}
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-yellow-900">
            💡 <strong>Tip:</strong> El cliente verá este enlace en su panel y recibirá una notificación. 
            Si el enlace vence, puede reportarlo y recibirás una alerta para enviar uno nuevo.
          </p>
        </div>
        </div>
      </CollapsibleCard>
    </div>
  )
}

