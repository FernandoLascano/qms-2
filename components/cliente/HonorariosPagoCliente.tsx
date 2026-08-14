'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DollarSign, ExternalLink, CheckCircle, Clock, Upload, Building2, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Pago {
  id: string
  concepto: string
  monto: number
  montoTransferencia?: number | null
  datosBancarios?: any
  estado: string
  createdAt: Date
  mercadoPagoLink?: string | null
  metodoPago?: string | null
  comprobanteTransferenciaId?: string | null
  fechaPago?: Date | null
  fechaVencimiento?: Date | null
}

interface HonorariosPagoClienteProps {
  pagos: Pago[]
}

export default function HonorariosPagoCliente({ pagos }: HonorariosPagoClienteProps) {
  const router = useRouter()
  const [mostrarTransferencia, setMostrarTransferencia] = useState<Record<string, boolean>>({})
  const [subiendoComprobante, setSubiendoComprobante] = useState<Record<string, boolean>>({})
  const [archivoComprobante, setArchivoComprobante] = useState<Record<string, File | null>>({})

  const pagosHonorarios = pagos.filter(p => 
    p.concepto.includes('HONORARIOS')
  )

  const pagosPendientes = pagosHonorarios.filter(p => p.estado === 'PENDIENTE')
  const pagosEnProceso = pagosHonorarios.filter(p => p.estado === 'PROCESANDO')
  const pagosPagados = pagosHonorarios.filter(p => p.estado === 'APROBADO')

  if (pagosHonorarios.length === 0) {
    return null
  }

  const getConceptoTexto = (concepto: string) => {
    return 'Honorarios Profesionales'
  }

  const handleFileChange = (pagoId: string, file: File | null) => {
    setArchivoComprobante({ ...archivoComprobante, [pagoId]: file })
  }

  const handleSubirComprobante = async (pagoId: string) => {
    const file = archivoComprobante[pagoId]
    if (!file) {
      toast.error('Selecciona un archivo')
      return
    }

    setSubiendoComprobante({ ...subiendoComprobante, [pagoId]: true })

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('pagoId', pagoId)

      const response = await fetch(`/api/pagos/${pagoId}/comprobante-transferencia`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        toast.success('Comprobante subido correctamente. El pago será validado por el administrador.')
        setArchivoComprobante({ ...archivoComprobante, [pagoId]: null })
        setMostrarTransferencia({ ...mostrarTransferencia, [pagoId]: false })
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al subir comprobante')
      }
    } catch (error) {
      toast.error('Error al subir comprobante')
    } finally {
      setSubiendoComprobante({ ...subiendoComprobante, [pagoId]: false })
    }
  }

  return (
    <Card id="pago-honorarios" className="scroll-mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Pago de Honorarios
        </CardTitle>
        <CardDescription>
          Pagos de honorarios profesionales con Mercado Pago
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pagos en Proceso (Esperando Validación) */}
        {pagosEnProceso.length > 0 && (
          <div className="space-y-4 mb-6">
            <h4 className="font-semibold text-body-sm text-info uppercase tracking-wider">Esperando Validación</h4>
            {pagosEnProceso.map((pago) => (
              <div
                key={pago.id}
                className="p-card border-2 rounded-control bg-info-soft border-info-line animate-pulse-slow"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-info-soft flex items-center justify-center shrink-0">
                    <Clock className="h-6 w-6 text-info" />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-ink text-heading mb-1">
                      {getConceptoTexto(pago.concepto)}
                    </h5>
                    <p className="text-body-sm text-info font-medium mb-2">
                      Comprobante recibido. Estamos validando tu transferencia.
                    </p>
                    <div className="flex items-center gap-4 text-label text-ink-2">
                      <span className="font-semibold bg-surface px-2 py-1 rounded border border-info-line">
                        Monto: ${pago.montoTransferencia?.toLocaleString('es-AR')}
                      </span>
                      <span>Subido: {new Date(pago.createdAt).toLocaleDateString('es-AR')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagos Pendientes */}
        {pagosPendientes.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-body-sm text-success uppercase tracking-wider">Pagos Pendientes</h4>
            {pagosPendientes.map((pago) => (
              <div
                key={pago.id}
                className="p-card border-2 rounded-control bg-success-soft border-success-line"
              >
                <div className="mb-4">
                  <h5 className="font-semibold text-ink mb-2">
                    {getConceptoTexto(pago.concepto)}
                  </h5>
                  <div className="flex items-center gap-2 text-label text-ink-2 mb-3">
                    <Clock className="h-3 w-3" />
                    <span>
                      Generado: {new Date(pago.createdAt).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                </div>

                {/* Opciones de Pago */}
                <div className="space-y-3">
                  {/* Opción 1: Mercado Pago */}
                  {pago.mercadoPagoLink && (
                    <div className="p-4 bg-surface rounded-control border border-line">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CreditCard className="h-5 w-5 text-info" />
                            <h6 className="font-semibold text-ink">Pago con Mercado Pago</h6>
                          </div>
                          <p className="text-title font-semibold text-ink mb-1">
                            ${pago.monto.toLocaleString('es-AR')}
                          </p>
                          <p className="text-label text-ink-2 mb-1">Precio regular (con tarjeta / Mercado Pago)</p>
                          <p className="text-label text-ink-2">
                            Tarjeta de crédito, débito, efectivo o transferencia
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => pago.mercadoPagoLink && window.open(pago.mercadoPagoLink, '_blank', 'noopener,noreferrer')}
                        className="w-full bg-success-solid hover:bg-success-solid"
                        size="lg"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <ExternalLink className="h-5 w-5" />
                          Pagar con Mercado Pago
                        </span>
                      </Button>
                    </div>
                  )}

                  {/* Opción 2: Transferencia Bancaria */}
                  {pago.montoTransferencia && pago.datosBancarios && (
                    <div className="p-4 bg-surface rounded-control border-2 border-success-line">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Building2 className="h-5 w-5 text-success" />
                            <h6 className="font-semibold text-ink">Pago por Transferencia</h6>
                            <span className="px-2 py-1 text-label font-semibold bg-success-soft text-success rounded-full">
                              💰 Precio promocional
                            </span>
                          </div>
                          <p className="text-title font-semibold text-success mb-1">
                            ${pago.montoTransferencia.toLocaleString('es-AR')}
                          </p>
                          <p className="text-label text-ink-2 line-through mb-1">
                            ${pago.monto.toLocaleString('es-AR')}
                          </p>
                          <p className="text-label text-success font-medium mb-3">
                            Ahorrás ${(pago.monto - (pago.montoTransferencia || 0)).toLocaleString('es-AR')}
                          </p>
                        </div>
                      </div>

                      {/* Datos Bancarios */}
                      <div className="bg-surface-2 rounded-control p-3 mb-3">
                        <p className="text-label font-semibold text-ink-2 mb-2">Datos para Transferencia:</p>
                        <div className="space-y-1 text-label text-ink-2">
                          <p><strong>Banco:</strong> {pago.datosBancarios.banco}</p>
                          <p><strong>CBU:</strong> {pago.datosBancarios.cbu}</p>
                          {pago.datosBancarios.alias && (
                            <p><strong>Alias:</strong> {pago.datosBancarios.alias}</p>
                          )}
                          <p><strong>Titular:</strong> {pago.datosBancarios.titular}</p>
                        </div>
                      </div>

                      {/* Subir Comprobante */}
                      {!mostrarTransferencia[pago.id] ? (
                        <Button
                          onClick={() => setMostrarTransferencia({ ...mostrarTransferencia, [pago.id]: true })}
                          className="w-full bg-success-solid hover:bg-success-solid"
                          size="lg"
                        >
                          <Upload className="h-5 w-5 mr-2" />
                          Ya realicé la transferencia
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-label font-medium text-ink-2 mb-2">
                              Subir Comprobante de Transferencia
                            </label>
                            <Input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) => handleFileChange(pago.id, e.target.files?.[0] || null)}
                              disabled={subiendoComprobante[pago.id]}
                              className="text-body-sm"
                            />
                            <p className="text-label text-ink-2 mt-1">
                              Formatos aceptados: JPG, PNG, PDF (máx. 5MB)
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleSubirComprobante(pago.id)}
                              disabled={!archivoComprobante[pago.id] || subiendoComprobante[pago.id]}
                              className="flex-1 bg-success-solid hover:bg-success-solid"
                            >
                              {subiendoComprobante[pago.id] ? 'Subiendo...' : 'Subir Comprobante'}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setMostrarTransferencia({ ...mostrarTransferencia, [pago.id]: false })
                                setArchivoComprobante({ ...archivoComprobante, [pago.id]: null })
                              }}
                              disabled={subiendoComprobante[pago.id]}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagos Completados */}
        {pagosPagados.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-body-sm text-ink-2">Pagos Completados</h4>
            {pagosPagados.map((pago) => (
              <div
                key={pago.id}
                className="p-4 border-2 rounded-control bg-info-soft border-info-line"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-info mt-0.5" />
                  <div className="flex-1">
                    <h5 className="font-semibold text-ink mb-1">
                      {getConceptoTexto(pago.concepto)}
                    </h5>
                    <p className="text-heading font-semibold text-info mb-1">
                      ${pago.monto.toLocaleString('es-AR')}
                    </p>
                    <p className="text-label text-ink-2">
                      ✅ Pagado el {new Date(pago.createdAt).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="bg-success-soft border border-success-line rounded-control p-3">
          <p className="text-label text-success">
            💳 <strong>Pago seguro:</strong> Elige la opción que prefieras. Si pagas por transferencia, 
            sube el comprobante y el administrador validará el pago.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

