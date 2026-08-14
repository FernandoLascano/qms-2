'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'

interface ValidacionTramiteProps {
  tramiteId: string
  estadoValidacion: string
  observacionesValidacion?: string | null
}

export default function ValidacionTramite({ 
  tramiteId, 
  estadoValidacion,
  observacionesValidacion 
}: ValidacionTramiteProps) {
  // Para trámites viejos que aún no tienen este campo en BD (null/undefined),
  // los tratamos como "pendiente de validación"
  const estadoActual = estadoValidacion || 'PENDIENTE_VALIDACION'

  const router = useRouter()
  const [procesando, setProcesando] = useState(false)
  const [observaciones, setObservaciones] = useState(observacionesValidacion || '')

  const handleValidar = async (accion: 'VALIDADO' | 'REQUIERE_CORRECCIONES') => {
    if (accion === 'REQUIERE_CORRECCIONES' && !observaciones.trim()) {
      toast.error('Debes ingresar observaciones cuando se requieren correcciones')
      return
    }

    setProcesando(true)

    try {
      const response = await fetch(`/api/admin/tramites/${tramiteId}/validacion`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion,
          observaciones: accion === 'REQUIERE_CORRECCIONES' ? observaciones : null
        })
      })

      if (response.ok) {
        toast.success(
          accion === 'VALIDADO' 
            ? 'Trámite validado exitosamente' 
            : 'Se han solicitado correcciones al cliente'
        )
        router.refresh()
      } else {
        toast.error('Error al procesar la validación')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al procesar la validación')
    } finally {
      setProcesando(false)
    }
  }

  const getEstadoBadge = () => {
    switch (estadoActual) {
      case 'VALIDADO':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-success-soft text-success rounded-full text-body-sm font-semibold">
            <CheckCircle className="h-4 w-4" />
            Validado
          </div>
        )
      case 'REQUIERE_CORRECCIONES':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-warning-soft text-warning rounded-full text-body-sm font-semibold">
            <XCircle className="h-4 w-4" />
            Requiere Correcciones
          </div>
        )
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-warning-soft text-warning rounded-full text-body-sm font-semibold">
            <AlertCircle className="h-4 w-4" />
            Pendiente de Validación
          </div>
        )
    }
  }

  return (
    <Card className={`border-2 ${
      estadoActual === 'VALIDADO' 
        ? 'border-success-line bg-success-soft' 
        : estadoActual === 'REQUIERE_CORRECCIONES'
        ? 'border-warning-line bg-warning-soft'
        : 'border-warning-line bg-warning-soft'
    }`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {estadoActual === 'VALIDADO' ? (
                <CheckCircle className="h-5 w-5 text-success" />
              ) : estadoActual === 'REQUIERE_CORRECCIONES' ? (
                <XCircle className="h-5 w-5 text-warning" />
              ) : (
                <AlertCircle className="h-5 w-5 text-warning" />
              )}
              Validación Inicial del Formulario
            </CardTitle>
            <CardDescription className="mt-1">
              Revisa y valida la información del formulario completado por el cliente
            </CardDescription>
          </div>
          {getEstadoBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mostrar controles siempre que NO esté ya validado ni con correcciones, 
            incluyendo casos antiguos donde estadoValidacion es null */}
        {estadoActual !== 'VALIDADO' && estadoActual !== 'REQUIERE_CORRECCIONES' && (
          <>
            <div>
              <Label htmlFor="observaciones">Observaciones (opcional si valida, obligatorio si requiere correcciones)</Label>
              <Textarea
                id="observaciones"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ingresa observaciones sobre la información del formulario..."
                rows={4}
                className="mt-1"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => handleValidar('VALIDADO')}
                disabled={procesando}
                className="flex-1 bg-success-solid hover:bg-success-solid"
              >
                {procesando ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Validar Formulario
                  </>
                )}
              </Button>
              <Button
                onClick={() => handleValidar('REQUIERE_CORRECCIONES')}
                disabled={procesando || !observaciones.trim()}
                variant="destructive"
                className="flex-1"
              >
                {procesando ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Solicitar Correcciones
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {estadoActual === 'VALIDADO' && (
          <div className="bg-success-soft border border-success-line rounded-control p-4">
            <p className="text-success font-medium mb-2">✅ Trámite Validado</p>
            <p className="text-body-sm text-success">
              Este trámite ha sido validado y está listo para continuar con el proceso.
            </p>
          </div>
        )}

        {estadoActual === 'REQUIERE_CORRECCIONES' && observacionesValidacion && (
          <div className="bg-surface border-2 border-warning-line rounded-control p-4">
            <p className="text-warning font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Correcciones Requeridas
            </p>
            <div className="bg-warning-soft border border-warning-line rounded-chip p-3">
              <p className="text-body text-ink leading-relaxed whitespace-pre-wrap font-medium">
                {observacionesValidacion}
              </p>
            </div>
          </div>
        )}

        <div className="bg-info-soft border border-info-line rounded-control p-3">
          <p className="text-label text-info">
            💡 <strong>Tip:</strong> Revisa cuidadosamente toda la información del formulario antes de validar. Si encuentras errores o información incompleta, solicita correcciones al cliente.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

