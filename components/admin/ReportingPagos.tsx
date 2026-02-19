'use client'

import CollapsibleCard from '@/components/admin/CollapsibleCard'
import { DollarSign, CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react'

interface Pago {
  id: string
  concepto: string
  monto: number
  estado: string
  fechaPago: Date | null
}

interface ReportingPagosProps {
  pagos: Pago[]
}

export default function ReportingPagos({ pagos }: ReportingPagosProps) {
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

  // Solo considerar como INGRESOS los honorarios (lo demás son gastos / tasas externas)
  const esHonorario = (concepto: string) =>
    concepto === 'HONORARIOS_BASICO' ||
    concepto === 'HONORARIOS_EMPRENDEDOR' ||
    concepto === 'HONORARIOS_PREMIUM'

  // Calcular estadísticas
  const pagosAprobados = pagos.filter(p => p.estado === 'APROBADO' && esHonorario(p.concepto))
  const pagosPendientes = pagos.filter(
    p => (p.estado === 'PENDIENTE' || p.estado === 'PROCESANDO') && esHonorario(p.concepto)
  )
  const pagosRechazados = pagos.filter(p => p.estado === 'RECHAZADO' && esHonorario(p.concepto))

  const totalAprobado = pagosAprobados.reduce((sum, p) => sum + p.monto, 0)
  const totalPendiente = pagosPendientes.reduce((sum, p) => sum + p.monto, 0)
  const totalRechazado = pagosRechazados.reduce((sum, p) => sum + p.monto, 0)

  // Agrupar por concepto
  const pagosPorConcepto = pagosAprobados.reduce((acc, pago) => {
    const concepto = getConceptoTexto(pago.concepto)
    if (!acc[concepto]) {
      acc[concepto] = { concepto, total: 0, cantidad: 0 }
    }
    acc[concepto].total += pago.monto
    acc[concepto].cantidad += 1
    return acc
  }, {} as Record<string, { concepto: string; total: number; cantidad: number }>)

  const conceptosArray = Object.values(pagosPorConcepto).sort((a, b) => b.total - a.total)

  return (
    <div className="border-brand-200 bg-brand-50 rounded-lg">
      <CollapsibleCard
        title="Reporte de Pagos (Honorarios)"
        description="Ingresos por honorarios de este trámite (las tasas y gastos externos no se contabilizan aquí)"
        icon={<DollarSign className="h-5 w-5 text-brand-700" />}
      >
        <div className="space-y-6">
        {/* Estadísticas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-100 border border-green-300 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-900">Cobrado</span>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-900">
              ${totalAprobado.toLocaleString('es-AR')}
            </p>
            <p className="text-xs text-green-700 mt-1">
              {pagosAprobados.length} pago{pagosAprobados.length !== 1 ? 's' : ''} aprobado{pagosAprobados.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-yellow-900">Pendiente</span>
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-yellow-900">
              ${totalPendiente.toLocaleString('es-AR')}
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              {pagosPendientes.length} pago{pagosPendientes.length !== 1 ? 's' : ''} pendiente{pagosPendientes.length !== 1 ? 's' : ''}
            </p>
          </div>

          {pagosRechazados.length > 0 && (
            <div className="bg-brand-100 border border-brand-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-brand-900">Rechazado</span>
                <AlertCircle className="h-5 w-5 text-brand-600" />
              </div>
              <p className="text-2xl font-bold text-brand-900">
                ${totalRechazado.toLocaleString('es-AR')}
              </p>
              <p className="text-xs text-brand-700 mt-1">
                {pagosRechazados.length} pago{pagosRechazados.length !== 1 ? 's' : ''} rechazado{pagosRechazados.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>

        {/* Resumen por Concepto */}
        {conceptosArray.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Desglose por Concepto
            </h4>
            <div className="space-y-2">
              {conceptosArray.map((item) => (
                <div key={item.concepto} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{item.concepto}</p>
                    <p className="text-xs text-gray-500">
                      {item.cantidad} pago{item.cantidad !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <p className="font-bold text-green-900">
                    ${item.total.toLocaleString('es-AR')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total General */}
        <div className="bg-gradient-to-r from-blue-100 to-blue-200 border-2 border-blue-300 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-blue-900">Total General</span>
            <span className="text-2xl font-bold text-blue-900">
              ${totalAprobado.toLocaleString('es-AR')}
            </span>
          </div>
          {totalPendiente > 0 && (
            <p className="text-sm text-blue-800 mt-2">
              + ${totalPendiente.toLocaleString('es-AR')} pendiente{totalPendiente > 0 ? 's' : ''}
            </p>
          )}
        </div>
        </div>
      </CollapsibleCard>
    </div>
  )
}

