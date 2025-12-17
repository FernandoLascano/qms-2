'use client'

import { useState } from 'react'
import CollapsibleCard from '@/components/admin/CollapsibleCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { DollarSign, CheckCircle, XCircle } from 'lucide-react'

interface Pago {
  id: string
  concepto: string
  monto: number
  estado: string
  fechaPago: Date | null
}

interface PagosControlProps {
  tramiteId: string
  userId: string
  pagos: Pago[]
}

export default function PagosControl({ tramiteId, userId, pagos }: PagosControlProps) {
  const router = useRouter()
  const [registrando, setRegistrando] = useState(false)
  const [nuevoPago, setNuevoPago] = useState({
    concepto: 'TASA_RETRIBUTIVA',
    monto: ''
  })

  const getConceptoTexto = (concepto: string) => {
    const mapa: Record<string, string> = {
      HONORARIOS_BASICO: 'Honorarios Básico',
      HONORARIOS_EMPRENDEDOR: 'Honorarios Emprendedor',
      HONORARIOS_PREMIUM: 'Honorarios Premium',
      DEPOSITO_CAPITAL: 'Depósito 25% del Capital',
      TASA_RESERVA_NOMBRE: 'Tasa Reserva de Nombre',
      TASA_RETRIBUTIVA: 'Tasa Retributiva (Final)',
      PUBLICACION_BOLETIN: 'Publicación en Boletín',
      CERTIFICACION_FIRMA: 'Certificación de Firma',
      OTROS: 'Otros'
    }

    return mapa[concepto] || concepto
  }

  const handleRegistrarPago = async () => {
    if (!nuevoPago.monto) {
      toast.error('Ingresa el monto del pago')
      return
    }

    setRegistrando(true)

    try {
      const response = await fetch(`/api/admin/tramites/${tramiteId}/pagos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concepto: nuevoPago.concepto,
          monto: parseFloat(nuevoPago.monto)
        })
      })

      if (response.ok) {
        toast.success('Pago registrado')
        setNuevoPago({ concepto: 'HONORARIOS_EMPRENDEDOR', monto: '' })
        router.refresh()
      } else {
        toast.error('Error al registrar pago')
      }
    } catch (error) {
      toast.error('Error al registrar pago')
    } finally {
      setRegistrando(false)
    }
  }

  const conceptosDisponibles = [
    { value: 'HONORARIOS_BASICO', label: 'Honorarios Básico' },
    { value: 'HONORARIOS_EMPRENDEDOR', label: 'Honorarios Emprendedor' },
    { value: 'HONORARIOS_PREMIUM', label: 'Honorarios Premium' },
    { value: 'DEPOSITO_CAPITAL', label: 'Depósito 25% del Capital' },
    { value: 'TASA_RESERVA_NOMBRE', label: 'Tasa Reserva de Nombre' },
    { value: 'TASA_RETRIBUTIVA', label: 'Tasa Retributiva (Final)' },
    { value: 'PUBLICACION_BOLETIN', label: 'Publicación en Boletín' },
    { value: 'CERTIFICACION_FIRMA', label: 'Certificación de Firma' },
    { value: 'OTROS', label: 'Otros' },
  ]

  return (
    <div className="border-green-200 bg-green-50 rounded-lg">
      <CollapsibleCard
        title="Control de Pagos"
        description="Registra y controla los pagos del cliente"
        icon={<DollarSign className="h-5 w-5" />}
      >
        <div className="space-y-4">
        {/* Pagos Registrados */}
        {pagos.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="font-medium text-sm text-gray-700">Pagos Registrados</h4>
            {pagos.map((pago) => (
              <div key={pago.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                <div className="flex items-center gap-3">
                  {pago.estado === 'APROBADO' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-orange-600" />
                  )}
                  <div>
                    <p className="font-medium text-sm text-gray-900">
                      {getConceptoTexto(pago.concepto)}
                    </p>
                    {pago.fechaPago && (
                      <p className="text-xs text-gray-500">
                        {new Date(pago.fechaPago).toLocaleDateString('es-AR')}
                      </p>
                    )}
                  </div>
                </div>
                <p className="font-bold text-green-900">
                  ${pago.monto.toLocaleString('es-AR')}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Registrar Nuevo Pago */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-sm text-gray-700 mb-3">Registrar Nuevo Pago</h4>
          <div className="space-y-3">
            <div>
              <Label htmlFor="concepto">Concepto</Label>
              <select
                id="concepto"
                value={nuevoPago.concepto}
                onChange={(e) => setNuevoPago(prev => ({ ...prev, concepto: e.target.value }))}
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                disabled={registrando}
              >
                {conceptosDisponibles.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="monto">Monto (ARS)</Label>
              <Input
                id="monto"
                type="number"
                value={nuevoPago.monto}
                onChange={(e) => setNuevoPago(prev => ({ ...prev, monto: e.target.value }))}
                placeholder="160000"
                disabled={registrando}
              />
            </div>
            <Button
              onClick={handleRegistrarPago}
              disabled={registrando || !nuevoPago.monto}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {registrando ? 'Registrando...' : 'Registrar Pago'}
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-900">
            💡 <strong>Tip:</strong> Registra cada pago que realice el cliente para llevar un control completo del trámite.
          </p>
        </div>
        </div>
      </CollapsibleCard>
    </div>
  )
}

