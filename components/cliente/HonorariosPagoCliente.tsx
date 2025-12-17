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

  const pagosPendientes = pagosHonorarios.filter(p => 
    p.estado === 'PENDIENTE' || p.estado === 'PROCESANDO'
  )
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
        {/* Pagos Pendientes */}
        {pagosPendientes.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-gray-700">Pago de Honorarios Pendiente</h4>
            {pagosPendientes.map((pago) => (
              <div
                key={pago.id}
                className="p-5 border-2 rounded-lg bg-green-50 border-green-300"
              >
                <div className="mb-4">
                  <h5 className="font-semibold text-gray-900 mb-2">
                    {getConceptoTexto(pago.concepto)}
                  </h5>
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
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
                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CreditCard className="h-5 w-5 text-blue-600" />
                            <h6 className="font-semibold text-gray-900">Pago con Mercado Pago</h6>
                          </div>
                          <p className="text-2xl font-bold text-green-600 mb-1">
                            ${pago.monto.toLocaleString('es-AR')}
                          </p>
                          <p className="text-xs text-gray-600">
                            Tarjeta de crédito, débito, efectivo o transferencia
                          </p>
                        </div>
                      </div>
                      <Button
                        asChild
                        className="w-full bg-green-600 hover:bg-green-700"
                        size="lg"
                      >
                        <a
                          href={pago.mercadoPagoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2"
                        >
                          <ExternalLink className="h-5 w-5" />
                          Pagar con Mercado Pago
                        </a>
                      </Button>
                    </div>
                  )}

                  {/* Opción 2: Transferencia Bancaria */}
                  {pago.montoTransferencia && pago.datosBancarios && (
                    <div className="p-4 bg-white rounded-lg border-2 border-green-500">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Building2 className="h-5 w-5 text-green-600" />
                            <h6 className="font-semibold text-gray-900">Pago por Transferencia</h6>
                            <span className="px-2 py-1 text-xs font-bold bg-green-100 text-green-700 rounded-full">
                              💰 Precio Diferencial
                            </span>
                          </div>
                          <p className="text-2xl font-bold text-green-600 mb-1">
                            ${pago.montoTransferencia.toLocaleString('es-AR')}
                          </p>
                          <p className="text-xs text-gray-500 line-through mb-1">
                            ${pago.monto.toLocaleString('es-AR')}
                          </p>
                          <p className="text-xs text-green-700 font-medium mb-3">
                            Ahorrás ${(pago.monto - (pago.montoTransferencia || 0)).toLocaleString('es-AR')}
                          </p>
                        </div>
                      </div>

                      {/* Datos Bancarios */}
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Datos para Transferencia:</p>
                        <div className="space-y-1 text-xs text-gray-600">
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
                          className="w-full bg-green-600 hover:bg-green-700"
                          size="lg"
                        >
                          <Upload className="h-5 w-5 mr-2" />
                          Ya realicé la transferencia
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-2">
                              Subir Comprobante de Transferencia
                            </label>
                            <Input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) => handleFileChange(pago.id, e.target.files?.[0] || null)}
                              disabled={subiendoComprobante[pago.id]}
                              className="text-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Formatos aceptados: JPG, PNG, PDF (máx. 5MB)
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleSubirComprobante(pago.id)}
                              disabled={!archivoComprobante[pago.id] || subiendoComprobante[pago.id]}
                              className="flex-1 bg-green-600 hover:bg-green-700"
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
            <h4 className="font-medium text-sm text-gray-700">Pagos Completados</h4>
            {pagosPagados.map((pago) => (
              <div
                key={pago.id}
                className="p-4 border-2 rounded-lg bg-blue-50 border-blue-300"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900 mb-1">
                      {getConceptoTexto(pago.concepto)}
                    </h5>
                    <p className="text-lg font-bold text-blue-600 mb-1">
                      ${pago.monto.toLocaleString('es-AR')}
                    </p>
                    <p className="text-xs text-gray-600">
                      ✅ Pagado el {new Date(pago.createdAt).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs text-green-900">
            💳 <strong>Pago seguro:</strong> Elige la opción que prefieras. Si pagas por transferencia, 
            sube el comprobante y el administrador validará el pago.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

