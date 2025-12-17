'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { CheckCircle, Clock, ListChecks } from 'lucide-react'

interface EtapasManagerProps {
  tramiteId: string
  etapas: {
    formularioCompleto: boolean
    denominacionReservada: boolean
    capitalDepositado: boolean
    tasaPagada: boolean
    documentosRevisados: boolean
    documentosFirmados: boolean
    tramiteIngresado: boolean
    sociedadInscripta: boolean
  }
}

export default function EtapasManager({ tramiteId, etapas }: EtapasManagerProps) {
  const router = useRouter()
  const [actualizando, setActualizando] = useState<string | null>(null)

  const handleToggleEtapa = async (etapa: string, valorActual: boolean) => {
    setActualizando(etapa)

    try {
      const response = await fetch(`/api/admin/tramites/${tramiteId}/etapas`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          etapa, 
          valor: !valorActual 
        })
      })

      if (response.ok) {
        toast.success(!valorActual ? 'Etapa marcada como completada' : 'Etapa desmarcada')
        router.refresh()
      } else {
        toast.error('Error al actualizar la etapa')
      }
    } catch (error) {
      toast.error('Error al actualizar la etapa')
    } finally {
      setActualizando(null)
    }
  }

  const etapasLista = [
    { 
      key: 'formularioCompleto', 
      label: '1. Formulario Completo', 
      valor: etapas.formularioCompleto,
      descripcion: 'Cliente completó formulario de 7 pasos'
    },
    { 
      key: 'denominacionReservada', 
      label: '2. Reserva de Nombre', 
      valor: etapas.denominacionReservada,
      descripcion: 'Tasa pagada y nombre reservado en IPJ/IGJ'
    },
    { 
      key: 'capitalDepositado', 
      label: '3. Capital Depositado (25%)', 
      valor: etapas.capitalDepositado,
      descripcion: 'Cliente depositó 25% del capital social'
    },
    { 
      key: 'tasaPagada', 
      label: '4. Tasa Final Pagada', 
      valor: etapas.tasaPagada,
      descripcion: 'Tasa retributiva final abonada'
    },
    { 
      key: 'documentosRevisados', 
      label: '5. Documentos Enviados', 
      valor: etapas.documentosRevisados,
      descripcion: 'Estatutos y actas enviados para firma'
    },
    { 
      key: 'documentosFirmados', 
      label: '6. Documentos Firmados', 
      valor: etapas.documentosFirmados,
      descripcion: 'Cliente firmó y envió docs escaneados'
    },
    { 
      key: 'tramiteIngresado', 
      label: '7. Trámite Ingresado', 
      valor: etapas.tramiteIngresado,
      descripcion: 'Trámite ingresado en IPJ/IGJ'
    },
    { 
      key: 'sociedadInscripta', 
      label: '8. Sociedad Inscripta', 
      valor: etapas.sociedadInscripta,
      descripcion: 'CUIT asignado y resolución obtenida'
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
            <ListChecks className="h-4 w-4 text-emerald-700" />
          </span>
          <span>Control de Etapas del Trámite</span>
        </CardTitle>
        <CardDescription>
          Marca cada etapa a medida que avanza el proceso
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-3">
          {etapasLista.map((etapa) => (
            <button
              key={etapa.key}
              onClick={() => handleToggleEtapa(etapa.key, etapa.valor)}
              disabled={actualizando === etapa.key}
              className={`flex items-start gap-3 p-4 border-2 rounded-lg transition-all text-left ${
                etapa.valor
                  ? 'bg-green-50 border-green-300 hover:bg-green-100'
                  : 'bg-white border-gray-300 hover:bg-gray-50'
              } ${actualizando === etapa.key ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
            >
              <div className="mt-0.5">
                {etapa.valor ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <Clock className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <p className={`font-medium mb-1 ${etapa.valor ? 'text-green-900' : 'text-gray-900'}`}>
                  {etapa.label}
                </p>
                <p className="text-xs text-gray-600">
                  {etapa.descripcion}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Resumen de progreso */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">
              Progreso General
            </span>
            <span className="text-sm font-bold text-blue-900">
              {etapasLista.filter(e => e.valor).length} / {etapasLista.length} completadas
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{
                width: `${(etapasLista.filter(e => e.valor).length / etapasLista.length) * 100}%`
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

