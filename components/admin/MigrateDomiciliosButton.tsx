'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function MigrateDomiciliosButton() {
  const [migrando, setMigrando] = useState(false)
  const [resultado, setResultado] = useState<{
    total: number
    actualizados: number
    errores: number
  } | null>(null)

  const ejecutarMigracion = async () => {
    setMigrando(true)
    setResultado(null)
    
    try {
      const response = await fetch('/api/admin/migrate-domicilios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResultado({
          total: data.total,
          actualizados: data.actualizados,
          errores: data.errores
        })
        toast.success(`Migración completada: ${data.actualizados} trámites actualizados`)
      } else {
        toast.error(data.error || 'Error al ejecutar la migración')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al ejecutar la migración')
    } finally {
      setMigrando(false)
    }
  }

  return (
    <div className="bg-white hover:bg-red-50 border-2 border-gray-200 hover:border-red-700 rounded-xl p-6 transition-all duration-200 hover:shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-red-100 rounded-lg">
          <RefreshCw className={`h-6 w-6 text-red-700 ${migrando ? 'animate-spin' : ''}`} />
        </div>
        {resultado && (
          <div className="flex items-center gap-2">
            {resultado.errores === 0 ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-orange-600" />
            )}
          </div>
        )}
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">Migrar Domicilios</h3>
      <p className="text-sm text-gray-600 mb-4">
        Actualizar campos de ciudad, departamento y provincia en trámites existentes
      </p>
      
      {resultado && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
          <p className="text-gray-700">
            <strong>Total:</strong> {resultado.total} trámites
          </p>
          <p className="text-green-700">
            <strong>Actualizados:</strong> {resultado.actualizados}
          </p>
          {resultado.errores > 0 && (
            <p className="text-orange-700">
              <strong>Errores:</strong> {resultado.errores}
            </p>
          )}
        </div>
      )}
      
      <Button
        onClick={ejecutarMigracion}
        disabled={migrando}
        className="w-full bg-red-600 hover:bg-red-700 text-white"
      >
        {migrando ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Migrando...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Ejecutar Migración
          </>
        )}
      </Button>
    </div>
  )
}

