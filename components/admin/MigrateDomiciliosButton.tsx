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
    <div className="bg-surface hover:bg-primary-soft border-2 border-line hover:border-primary-line rounded-control p-6 transition-all duration-200 hover:shadow-raise">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-primary-soft rounded-control">
          <RefreshCw className={`h-6 w-6 text-primary ${migrando ? 'animate-spin' : ''}`} />
        </div>
        {resultado && (
          <div className="flex items-center gap-2">
            {resultado.errores === 0 ? (
              <CheckCircle className="h-5 w-5 text-success" />
            ) : (
              <AlertCircle className="h-5 w-5 text-warning" />
            )}
          </div>
        )}
      </div>
      <h3 className="text-heading font-semibold text-ink mb-2">Migrar Domicilios</h3>
      <p className="text-body-sm text-ink-2 mb-4">
        Actualizar campos de ciudad, departamento y provincia en trámites existentes
      </p>
      
      {resultado && (
        <div className="mb-4 p-3 bg-surface-2 rounded-control text-body-sm">
          <p className="text-ink-2">
            <strong>Total:</strong> {resultado.total} trámites
          </p>
          <p className="text-success">
            <strong>Actualizados:</strong> {resultado.actualizados}
          </p>
          {resultado.errores > 0 && (
            <p className="text-warning">
              <strong>Errores:</strong> {resultado.errores}
            </p>
          )}
        </div>
      )}
      
      <Button
        onClick={ejecutarMigracion}
        disabled={migrando}
        className="w-full bg-primary hover:bg-primary text-on-primary"
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

