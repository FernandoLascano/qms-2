'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { ExternalLink, AlertCircle, CheckCircle, Clock, Upload, X } from 'lucide-react'

interface EnlacePago {
  id: string
  concepto: string
  monto: number
  enlace: string
  estado: string
  fechaEnvio: Date
  fechaVencimiento: Date | null
  fechaPago: Date | null
  reportadoVencido: boolean
}

interface EnlacesPagoClienteProps {
  enlaces: EnlacePago[]
}

export default function EnlacesPagoCliente({ enlaces }: EnlacesPagoClienteProps) {
  const router = useRouter()
  const [reportando, setReportando] = useState<string | null>(null)
  const [confirmandoPago, setConfirmandoPago] = useState<string | null>(null)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [subiendoComprobante, setSubiendoComprobante] = useState(false)

  const handleReportarVencido = async (enlaceId: string) => {
    setReportando(enlaceId)

    try {
      const response = await fetch(`/api/enlaces-pago/${enlaceId}/reportar-vencido`, {
        method: 'PATCH'
      })

      if (response.ok) {
        toast.success('Hemos notificado al equipo. Te enviaremos un nuevo enlace pronto.')
        router.refresh()
      } else {
        toast.error('Error al reportar enlace vencido')
      }
    } catch (error) {
      toast.error('Error al reportar enlace vencido')
    } finally {
      setReportando(null)
    }
  }

  const handleConfirmarPago = async (enlaceId: string) => {
    if (!archivo) {
      toast.error('Por favor adjunta el comprobante de pago')
      return
    }

    setSubiendoComprobante(true)

    try {
      const formData = new FormData()
      formData.append('comprobante', archivo)

      const response = await fetch(`/api/enlaces-pago/${enlaceId}/confirmar-pago`, {
        method: 'PATCH',
        body: formData
      })

      if (response.ok) {
        toast.success('¡Pago confirmado! El equipo revisará tu comprobante.')
        setConfirmandoPago(null)
        setArchivo(null)
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al confirmar el pago')
      }
    } catch (error) {
      toast.error('Error al confirmar el pago')
    } finally {
      setSubiendoComprobante(false)
    }
  }

  const enlacesPendientes = enlaces.filter(e => e.estado === 'PENDIENTE')
  const enlacesEnProceso = enlaces.filter(e => e.estado === 'PROCESANDO')
  const enlacesPagados = enlaces.filter(e => e.estado === 'PAGADO')

  if (enlaces.length === 0) {
    return null
  }

  const getConceptoTexto = (concepto: string) => {
    const conceptos: Record<string, string> = {
      'TASA_RESERVA_NOMBRE': 'Tasa de Reserva de Nombre',
      'TASA_RETRIBUTIVA': 'Tasa Retributiva (Final)',
      'PUBLICACION_BOLETIN': 'Publicación en Boletín',
      'OTROS': 'Otro Pago'
    }
    return conceptos[concepto] || concepto
  }

  return (
    <Card id="enlaces-pago" className="scroll-mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          Enlaces de Pago
        </CardTitle>
        <CardDescription>
          Enlaces para realizar pagos de tasas y otros conceptos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enlaces en Proceso (Esperando Validación) */}
        {enlacesEnProceso.length > 0 && (
          <div className="space-y-4 mb-6">
            <h4 className="font-bold text-sm text-blue-700 uppercase tracking-wider">Esperando Validación</h4>
            {enlacesEnProceso.map((enlace) => (
              <div
                key={enlace.id}
                className="p-5 border-2 rounded-lg bg-blue-50 border-blue-200"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-bold text-gray-900 text-lg mb-1">
                      {getConceptoTexto(enlace.concepto)}
                    </h5>
                    <p className="text-sm text-blue-800 font-medium mb-2">
                      Comprobante recibido. Estamos validando el pago externo.
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="font-bold bg-white px-2 py-1 rounded border border-blue-100">
                        Monto: ${enlace.monto.toLocaleString('es-AR')}
                      </span>
                      <span>Enviado: {new Date(enlace.fechaEnvio).toLocaleDateString('es-AR')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enlaces Pendientes */}
        {enlacesPendientes.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-green-700 uppercase tracking-wider">Pagos Pendientes</h4>
            {enlacesPendientes.map((enlace) => (
              <div
                key={enlace.id}
                className={`p-4 border-2 rounded-lg ${
                  enlace.reportadoVencido 
                    ? 'bg-yellow-50 border-yellow-300' 
                    : 'bg-blue-50 border-blue-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900 mb-1">
                      {getConceptoTexto(enlace.concepto)}
                    </h5>
                    <p className="text-2xl font-bold text-blue-600 mb-2">
                      ${enlace.monto.toLocaleString('es-AR')}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-600 mb-2">
                      <span>
                        📅 Enviado: {new Date(enlace.fechaEnvio).toLocaleDateString('es-AR')}
                      </span>
                      {enlace.fechaVencimiento && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Vence: {new Date(enlace.fechaVencimiento).toLocaleDateString('es-AR')}
                        </span>
                      )}
                    </div>
                    {enlace.reportadoVencido && (
                      <div className="bg-yellow-100 border border-yellow-300 rounded p-2 mb-2">
                        <p className="text-xs text-yellow-900 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Ya reportaste este enlace como vencido. Estamos generando uno nuevo.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Formulario de confirmación de pago */}
                {confirmandoPago === enlace.id ? (
                  <div className="space-y-3 bg-white border border-blue-300 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h6 className="text-sm font-semibold text-gray-900">
                        Confirmar Pago Realizado
                      </h6>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setConfirmandoPago(null)
                          setArchivo(null)
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-3">
                      Adjunta el comprobante de pago para que podamos verificarlo
                    </p>
                    
                    <div>
                      <Label htmlFor={`comprobante-${enlace.id}`} className="text-sm font-medium mb-2 block">
                        Comprobante (PDF, JPG, PNG)
                      </Label>
                      <Input
                        id={`comprobante-${enlace.id}`}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                        className="mb-2"
                      />
                      
                      {archivo && (
                        <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                          <CheckCircle className="h-3 w-3" />
                          {archivo.name}
                        </p>
                      )}
                    </div>

                    <Button
                      onClick={() => handleConfirmarPago(enlace.id)}
                      disabled={!archivo || subiendoComprobante}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {subiendoComprobante ? 'Subiendo...' : 'Confirmar Pago'}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => window.open(enlace.enlace, '_blank', 'noopener,noreferrer')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ir a Pagar
                    </Button>
                    
                    <Button
                      onClick={() => setConfirmandoPago(enlace.id)}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Ya Pagué
                    </Button>

                    {!enlace.reportadoVencido && (
                      <Button
                        variant="outline"
                        onClick={() => handleReportarVencido(enlace.id)}
                        disabled={reportando === enlace.id}
                        className="w-full border-brand-300 text-brand-700 hover:bg-brand-50"
                      >
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {reportando === enlace.id ? 'Reportando...' : 'Enlace Vencido'}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Enlaces Pagados */}
        {enlacesPagados.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-700">Pagos Confirmados</h4>
            {enlacesPagados.map((enlace) => (
              <div
                key={enlace.id}
                className="p-4 border-2 rounded-lg bg-green-50 border-green-300"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900 mb-1">
                      {getConceptoTexto(enlace.concepto)}
                    </h5>
                    <p className="text-lg font-bold text-green-600 mb-1">
                      ${enlace.monto.toLocaleString('es-AR')}
                    </p>
                    <p className="text-xs text-gray-600">
                      ✅ Pagado el {new Date(enlace.fechaEnvio).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-900">
            💡 <strong>Importante:</strong> Después de realizar el pago, usa el botón "Ya Pagué" 
            para adjuntar tu comprobante y que podamos verificarlo.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
