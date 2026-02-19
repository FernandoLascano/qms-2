'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { SlidersHorizontal } from 'lucide-react'

interface Etapas {
  formularioCompleto: boolean
  denominacionReservada: boolean
  capitalDepositado: boolean
  tasaPagada: boolean
  documentosRevisados: boolean
  documentosFirmados: boolean
  tramiteIngresado: boolean
  sociedadInscripta: boolean
}

interface EstadoManagerProps {
  tramiteId: string
  estadoActual: string
  etapas: Etapas
}

const ESTADOS = [
  { value: 'INICIADO', label: 'Iniciado', color: 'bg-gray-100 text-gray-800' },
  { value: 'EN_PROCESO', label: 'En Proceso', color: 'bg-blue-100 text-blue-800' },
  { value: 'ESPERANDO_CLIENTE', label: 'Esperando Cliente', color: 'bg-orange-100 text-orange-800' },
  { value: 'ESPERANDO_APROBACION', label: 'Esperando Aprobación', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'COMPLETADO', label: 'Completado', color: 'bg-green-100 text-green-800' },
  { value: 'CANCELADO', label: 'Cancelado', color: 'bg-brand-100 text-brand-800' },
]

export default function EstadoManager({ tramiteId, estadoActual, etapas }: EstadoManagerProps) {
  const router = useRouter()
  
  // Calcular estado sugerido basado en las etapas
  const calcularEstadoSugerido = (): string => {
    if (etapas.sociedadInscripta) {
      return 'COMPLETADO'
    }
    if (etapas.tramiteIngresado) {
      return 'ESPERANDO_APROBACION'
    }
    if (etapas.documentosFirmados) {
      return 'EN_PROCESO'
    }
    if (etapas.documentosRevisados) {
      return 'EN_PROCESO'
    }
    if (etapas.capitalDepositado && etapas.tasaPagada) {
      return 'EN_PROCESO'
    }
    if (etapas.denominacionReservada) {
      return 'ESPERANDO_CLIENTE'
    }
    if (etapas.formularioCompleto) {
      return 'EN_PROCESO'
    }
    return 'INICIADO'
  }

  const estadoSugerido = calcularEstadoSugerido()
  const [nuevoEstado, setNuevoEstado] = useState(estadoActual)
  const [guardando, setGuardando] = useState(false)
  
  // Actualizar el estado sugerido cuando cambien las etapas
  useEffect(() => {
    if (estadoSugerido !== estadoActual && estadoActual !== 'COMPLETADO' && estadoActual !== 'CANCELADO') {
      // Solo actualizar automáticamente si no está completado o cancelado
      setNuevoEstado(estadoSugerido)
    }
  }, [estadoSugerido, estadoActual])

  const handleCambiarEstado = async () => {
    if (nuevoEstado === estadoActual) {
      toast.info('El estado no ha cambiado')
      return
    }

    setGuardando(true)

    try {
      const response = await fetch(`/api/admin/tramites/${tramiteId}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      })

      if (response.ok) {
        toast.success('Estado actualizado correctamente')
        router.refresh()
      } else {
        toast.error('Error al actualizar el estado')
      }
    } catch (error) {
      toast.error('Error al actualizar el estado')
    } finally {
      setGuardando(false)
    }
  }

  const estadoActualInfo = ESTADOS.find(e => e.value === estadoActual)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
            <SlidersHorizontal className="h-4 w-4 text-blue-700" />
          </span>
          <span>Gestión de Estado</span>
        </CardTitle>
        <CardDescription>
          Cambia el estado general del trámite
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Estado Actual
              </label>
              <span className={`inline-block px-4 py-2 rounded-lg font-medium ${estadoActualInfo?.color}`}>
                {estadoActualInfo?.label}
              </span>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Estado Sugerido (automático)
              </label>
              <span className={`inline-block px-4 py-2 rounded-lg font-medium ${ESTADOS.find(e => e.value === estadoSugerido)?.color || 'bg-gray-100 text-gray-800'}`}>
                {ESTADOS.find(e => e.value === estadoSugerido)?.label || estadoSugerido}
              </span>
            </div>
          </div>

          <div className="border-t pt-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Cambiar a (manual)
            </label>
            <div className="flex items-center gap-4">
              <Select
                value={nuevoEstado}
                onChange={(e) => setNuevoEstado(e.target.value)}
                disabled={guardando}
                className="flex-1"
              >
                {ESTADOS.map((estado) => (
                  <option key={estado.value} value={estado.value}>
                    {estado.label}
                  </option>
                ))}
              </Select>
              <Button
                onClick={handleCambiarEstado}
                disabled={guardando || nuevoEstado === estadoActual}
              >
                {guardando ? 'Guardando...' : 'Actualizar Estado'}
              </Button>
            </div>
            {estadoSugerido !== nuevoEstado && estadoSugerido !== estadoActual && (
              <p className="text-xs text-gray-500 mt-2">
                💡 El estado sugerido basado en las etapas es: <strong>{ESTADOS.find(e => e.value === estadoSugerido)?.label}</strong>
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

