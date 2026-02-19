'use client'

import { useState, useEffect } from 'react'
import CollapsibleCard from '@/components/admin/CollapsibleCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { DollarSign, Send, CheckCircle } from 'lucide-react'

interface Pago {
  id: string
  concepto: string
  monto: number
  montoTransferencia?: number | null
  datosBancarios?: any
  estado: string
  createdAt: Date
  mercadoPagoId?: string | null
  mercadoPagoLink?: string | null
  metodoPago?: string | null
  comprobanteTransferenciaId?: string | null
  fechaPago?: Date | null
  fechaVencimiento?: Date | null
}

interface HonorariosMercadoPagoProps {
  tramiteId: string
  pagos: Pago[]
  plan?: 'BASICO' | 'EMPRENDEDOR' | 'PREMIUM'
}

// Montos de honorarios por plan (ajustar según corresponda)
const MONTOS_POR_PLAN = {
  BASICO: { mercadoPago: 250000, transferencia: 240000 },
  EMPRENDEDOR: { mercadoPago: 320000, transferencia: 310000 },
  PREMIUM: { mercadoPago: 390000, transferencia: 380000 }
}

interface CuentaBancaria {
  id: string
  nombre: string
  banco: string
  cbu: string
  alias?: string
  titular: string
}

export default function HonorariosMercadoPago({ tramiteId, pagos, plan }: HonorariosMercadoPagoProps) {
  const router = useRouter()
  const [generando, setGenerando] = useState(false)
  const [planSeleccionado, setPlanSeleccionado] = useState<'BASICO' | 'EMPRENDEDOR' | 'PREMIUM'>(plan || 'EMPRENDEDOR')
  const [monto, setMonto] = useState('')
  const [montoTransferencia, setMontoTransferencia] = useState('')
  const [cuentasPreConfiguradas, setCuentasPreConfiguradas] = useState<CuentaBancaria[]>([])
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<string>('')
  const [datosBancarios, setDatosBancarios] = useState({
    banco: '',
    cbu: '',
    alias: '',
    titular: ''
  })

  // Inicializar montos según el plan
  useEffect(() => {
    if (plan) {
      const montos = MONTOS_POR_PLAN[plan]
      setMonto(montos.mercadoPago.toString())
      setMontoTransferencia(montos.transferencia.toString())
      setPlanSeleccionado(plan)
    }
  }, [plan])

  // Cargar cuentas bancarias pre-configuradas
  useEffect(() => {
    const cargarCuentas = async () => {
      try {
        const response = await fetch('/api/admin/cuentas-bancarias')
        if (response.ok) {
          const data = await response.json()
          setCuentasPreConfiguradas(data.cuentas || [])
        }
      } catch (error) {
        console.error('Error al cargar cuentas bancarias:', error)
      }
    }
    cargarCuentas()
  }, [])

  // Cuando se selecciona una cuenta, cargar sus datos
  useEffect(() => {
    if (cuentaSeleccionada) {
      const cuenta = cuentasPreConfiguradas.find(c => c.id === cuentaSeleccionada)
      if (cuenta) {
        setDatosBancarios({
          banco: cuenta.banco,
          cbu: cuenta.cbu,
          alias: cuenta.alias || '',
          titular: cuenta.titular
        })
      }
    }
  }, [cuentaSeleccionada, cuentasPreConfiguradas])

  const handleGenerarLinkPago = async () => {
    if (!monto || parseFloat(monto) <= 0) {
      toast.error('Ingresa un monto válido para Mercado Pago')
      return
    }

    if (!montoTransferencia || parseFloat(montoTransferencia) <= 0) {
      toast.error('Ingresa un monto válido para transferencia')
      return
    }

    if (!datosBancarios.cbu || !datosBancarios.banco || !datosBancarios.titular) {
      toast.error('Completa todos los datos bancarios')
      return
    }

    setGenerando(true)

    try {
      const response = await fetch(`/api/admin/tramites/${tramiteId}/honorarios-mp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concepto: 'HONORARIOS_COMPLETO',
          monto: parseFloat(monto),
          montoTransferencia: parseFloat(montoTransferencia),
          datosBancarios
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Link de pago generado y enviado al cliente')
        setMonto('')
        setMontoTransferencia('')
        setDatosBancarios({ banco: '', cbu: '', alias: '', titular: '' })
        router.refresh()
      } else {
        let errorMessage = 'Error al generar link de pago'
        try {
          const error = await response.json()
          errorMessage = error.error || error.message || errorMessage
          console.error('Error al generar link:', error)
        } catch (parseError) {
          // Si no se puede parsear el JSON, usar el texto de la respuesta
          const text = await response.text()
          console.error('Error al parsear respuesta:', text)
          errorMessage = text || `Error ${response.status}: ${response.statusText}`
        }
        toast.error(errorMessage)
      }
    } catch (error: any) {
      console.error('Error de red al generar link:', error)
      const errorMessage = error?.message || 'Error de conexión al generar link de pago'
      toast.error(errorMessage)
    } finally {
      setGenerando(false)
    }
  }

  const pagosHonorarios = pagos.filter(p => 
    p.concepto.includes('HONORARIOS')
  )

  return (
    <div className="border-green-200 bg-green-50 rounded-lg">
      <CollapsibleCard
        title="Pago de Honorarios"
        description="Genera link de pago único con opción de Mercado Pago o Transferencia Bancaria"
        icon={<DollarSign className="h-5 w-5 text-green-700" />}
      >
        <div className="space-y-4">
        {/* Pagos Generados */}
        {pagosHonorarios.length > 0 && (
          <div className="space-y-3 mb-4">
            <h4 className="font-medium text-sm text-gray-700">Links de Pago Generados</h4>
            {pagosHonorarios.map((pago) => (
              <div
                key={pago.id}
                className={`p-4 border-2 rounded-lg ${
                  pago.estado === 'PAGADO' 
                    ? 'bg-green-100 border-green-400' 
                    : 'bg-blue-50 border-blue-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm text-gray-900">{pago.concepto}</p>
                      {pago.estado === 'PAGADO' && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div className="space-y-1 mb-2">
                      {pago.mercadoPagoLink && (
                        <p className="text-lg font-bold text-green-600">
                          Mercado Pago: ${pago.monto.toLocaleString('es-AR')}
                        </p>
                      )}
                      {pago.montoTransferencia && (
                        <p className="text-lg font-bold text-blue-600">
                          Transferencia: ${pago.montoTransferencia.toLocaleString('es-AR')}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      Generado: {new Date(pago.createdAt).toLocaleDateString('es-AR')}
                    </p>
                    {pago.estado !== 'APROBADO' && pago.mercadoPagoLink && (
                      <a
                        href={pago.mercadoPagoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline break-all block mb-1"
                      >
                        Link Mercado Pago: {pago.mercadoPagoLink.substring(0, 50)}...
                      </a>
                    )}
                    {pago.estado !== 'APROBADO' && pago.montoTransferencia && (
                      <p className="text-xs text-green-700 font-medium mt-2">
                        💰 Opción de transferencia disponible (precio diferencial)
                      </p>
                    )}
                    {pago.estado === 'PROCESANDO' && (
                      <p className="text-xs text-orange-700 font-medium mt-2">
                        ⏳ Comprobante subido, esperando validación
                      </p>
                    )}
                    {pago.estado === 'APROBADO' && (
                      <p className="text-xs text-green-700 font-medium">✅ Pagado</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Generar Nuevo Link */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-sm text-gray-700 mb-3">Generar Link de Pago de Honorarios</h4>
          <div className="space-y-4 bg-white p-4 rounded-lg border">
            {/* Selector de Plan */}
            <div>
              <Label htmlFor="planHonorarios">Plan *</Label>
              <select
                id="planHonorarios"
                value={planSeleccionado}
                onChange={(e) => {
                  const nuevoPlan = e.target.value as 'BASICO' | 'EMPRENDEDOR' | 'PREMIUM'
                  setPlanSeleccionado(nuevoPlan)
                  const montos = MONTOS_POR_PLAN[nuevoPlan]
                  setMonto(montos.mercadoPago.toString())
                  setMontoTransferencia(montos.transferencia.toString())
                }}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-600"
                disabled={generando}
              >
                <option value="BASICO">Básico - ${MONTOS_POR_PLAN.BASICO.mercadoPago.toLocaleString('es-AR')}</option>
                <option value="EMPRENDEDOR">Emprendedor - ${MONTOS_POR_PLAN.EMPRENDEDOR.mercadoPago.toLocaleString('es-AR')}</option>
                <option value="PREMIUM">Premium - ${MONTOS_POR_PLAN.PREMIUM.mercadoPago.toLocaleString('es-AR')}</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Los montos se cargarán automáticamente según el plan seleccionado</p>
            </div>

            {/* Montos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="montoHonorarios">Monto Mercado Pago (ARS) *</Label>
                <Input
                  id="montoHonorarios"
                  type="number"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="320000"
                  disabled={generando}
                />
                <p className="text-xs text-gray-500 mt-1">Precio con tarjeta/crédito</p>
              </div>

              <div>
                <Label htmlFor="montoTransferencia">Monto Transferencia (ARS) *</Label>
                <Input
                  id="montoTransferencia"
                  type="number"
                  value={montoTransferencia}
                  onChange={(e) => setMontoTransferencia(e.target.value)}
                  placeholder="155000"
                  disabled={generando}
                />
                <p className="text-xs text-green-600 mt-1">💰 Precio diferencial (descuento por transferencia)</p>
              </div>
            </div>

            {/* Datos Bancarios */}
            <div className="border-t pt-4">
              <h5 className="font-medium text-sm text-gray-700 mb-3">Datos Bancarios para Transferencia</h5>
              <div className="space-y-3">
                {/* Selector de cuenta pre-configurada */}
                {cuentasPreConfiguradas.length > 0 && (
                  <div>
                    <Label htmlFor="cuentaPreConfigurada">Seleccionar Cuenta Pre-configurada</Label>
                    <select
                      id="cuentaPreConfigurada"
                      value={cuentaSeleccionada}
                      onChange={(e) => setCuentaSeleccionada(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-600"
                      disabled={generando}
                    >
                      <option value="">-- Seleccionar cuenta --</option>
                      {cuentasPreConfiguradas.map((cuenta) => (
                        <option key={cuenta.id} value={cuenta.id}>
                          {cuenta.nombre} - {cuenta.banco}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">O completa los datos manualmente abajo</p>
                  </div>
                )}

                <div>
                  <Label htmlFor="banco">Banco *</Label>
                  <Input
                    id="banco"
                    value={datosBancarios.banco}
                    onChange={(e) => setDatosBancarios({ ...datosBancarios, banco: e.target.value })}
                    placeholder="Banco Nación, Banco Provincia, etc."
                    disabled={generando}
                  />
                </div>

                <div>
                  <Label htmlFor="cbu">CBU *</Label>
                  <Input
                    id="cbu"
                    value={datosBancarios.cbu}
                    onChange={(e) => setDatosBancarios({ ...datosBancarios, cbu: e.target.value })}
                    placeholder="0000000000000000000000"
                    disabled={generando}
                    maxLength={22}
                  />
                </div>

                <div>
                  <Label htmlFor="alias">Alias (opcional)</Label>
                  <Input
                    id="alias"
                    value={datosBancarios.alias}
                    onChange={(e) => setDatosBancarios({ ...datosBancarios, alias: e.target.value })}
                    placeholder="QUIEROMISAS.SAS"
                    disabled={generando}
                  />
                </div>

                <div>
                  <Label htmlFor="titular">Titular de la Cuenta *</Label>
                  <Input
                    id="titular"
                    value={datosBancarios.titular}
                    onChange={(e) => setDatosBancarios({ ...datosBancarios, titular: e.target.value })}
                    placeholder="QuieroMiSAS S.A.S."
                    disabled={generando}
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleGenerarLinkPago}
              disabled={generando || !monto || !montoTransferencia || !datosBancarios.cbu || !datosBancarios.banco || !datosBancarios.titular}
              className="w-full gap-2 bg-green-600 hover:bg-green-700"
            >
              <Send className="h-4 w-4" />
              {generando ? 'Generando...' : 'Generar Link de Pago'}
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-900">
            💡 <strong>Tip:</strong> El link de Mercado Pago se enviará automáticamente al cliente. 
            Cuando pague, recibirás una notificación y el pago se marcará como completado.
          </p>
        </div>

        {/* Advertencia si no está configurado */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-yellow-900">
            ⚠️ <strong>Configuración requerida:</strong> Asegúrate de tener configurado tu Access Token 
            de Mercado Pago en las variables de entorno (MERCADOPAGO_ACCESS_TOKEN).
          </p>
        </div>
        </div>
      </CollapsibleCard>
    </div>
  )
}

