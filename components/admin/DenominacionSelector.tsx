'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { CheckCircle, Search } from 'lucide-react'
import CollapsibleCard from '@/components/admin/CollapsibleCard'

interface DenominacionSelectorProps {
  tramiteId: string
  denominacion1: string
  denominacion2: string | null
  denominacion3: string | null
  denominacionAprobada: string | null
}

export default function DenominacionSelector({
  tramiteId,
  denominacion1,
  denominacion2,
  denominacion3,
  denominacionAprobada
}: DenominacionSelectorProps) {
  const router = useRouter()
  const [seleccionando, setSeleccionando] = useState(false)

  const handleSeleccionar = async (denominacion: string) => {
    if (window.confirm(`¿Aprobar "${denominacion}" como denominación sugerida/aprobada?`)) {
      setSeleccionando(true)

      try {
        const response = await fetch(`/api/admin/tramites/${tramiteId}/denominacion`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ denominacion })
        })

        if (response.ok) {
          toast.success('Denominación aprobada')
          router.refresh()
        } else {
          toast.error('Error al aprobar denominación')
        }
      } catch (error) {
        toast.error('Error al aprobar denominación')
      } finally {
        setSeleccionando(false)
      }
    }
  }

  return (
    <div className="border-purple-200 bg-purple-50 rounded-lg">
      <CollapsibleCard
        title="Examen de Homonimia"
        description="Marca la denominación sugerida después del examen de homonimia"
        icon={<Search className="h-5 w-5 text-purple-700" />}
      >
        <div className="space-y-3">
        {/* Opción 1 */}
        <div className="flex items-center justify-between p-4 border-2 rounded-lg bg-white">
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">Opción 1 (Preferida)</p>
            <p className="font-medium text-gray-900">{denominacion1}</p>
          </div>
          {denominacionAprobada === denominacion1 ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Aprobada</span>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => handleSeleccionar(denominacion1)}
              disabled={seleccionando}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Aprobar Esta
            </Button>
          )}
        </div>

        {/* Opción 2 */}
        {denominacion2 && (
          <div className="flex items-center justify-between p-4 border-2 rounded-lg bg-white">
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Opción 2</p>
              <p className="font-medium text-gray-900">{denominacion2}</p>
            </div>
            {denominacionAprobada === denominacion2 ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Aprobada</span>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => handleSeleccionar(denominacion2)}
                disabled={seleccionando}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Aprobar Esta
              </Button>
            )}
          </div>
        )}

        {/* Opción 3 */}
        {denominacion3 && (
          <div className="flex items-center justify-between p-4 border-2 rounded-lg bg-white">
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Opción 3</p>
              <p className="font-medium text-gray-900">{denominacion3}</p>
            </div>
            {denominacionAprobada === denominacion3 ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Aprobada</span>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => handleSeleccionar(denominacion3)}
                disabled={seleccionando}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Aprobar Esta
              </Button>
            )}
          </div>
        )}

        {denominacionAprobada && (
          <div className="bg-green-100 border border-green-300 rounded-lg p-4 mt-4">
            <p className="text-sm text-green-900">
              💡 <strong>Tip:</strong> Esta denominación se mostrará al cliente como la sugerida/aprobada. 
              Puedes enviarle una observación para informarle.
            </p>
          </div>
        )}
        </div>
      </CollapsibleCard>
    </div>
  )
}

