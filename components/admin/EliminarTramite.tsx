'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, AlertTriangle, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

interface EliminarTramiteProps {
  tramiteId: string
  denominacion: string
}

export default function EliminarTramite({ tramiteId, denominacion }: EliminarTramiteProps) {
  const router = useRouter()
  const [mostrarModal, setMostrarModal] = useState(false)
  const [confirmacion, setConfirmacion] = useState('')
  const [procesando, setProcesando] = useState(false)

  const textoConfirmacion = 'ELIMINAR'

  const handleEliminar = async () => {
    if (confirmacion !== textoConfirmacion) {
      toast.error(`Debes escribir "${textoConfirmacion}" para confirmar`)
      return
    }

    setProcesando(true)
    try {
      const res = await fetch(`/api/admin/tramites/${tramiteId}/eliminar`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(data.message)
        router.push('/dashboard/admin/tramites')
      } else {
        toast.error(data.error || 'Error al eliminar trámite')
      }
    } catch (error) {
      toast.error('Error al eliminar trámite')
    } finally {
      setProcesando(false)
    }
  }

  return (
    <>
      <Card className="border-primary-line bg-primary-soft/50">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Zona de Peligro
          </CardTitle>
          <CardDescription className="text-primary">
            Acciones irreversibles - usar con precaución
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-surface border border-primary-line rounded-control">
            <div>
              <h4 className="font-semibold text-ink">Eliminar este trámite</h4>
              <p className="text-body-sm text-ink-2">
                Se eliminarán permanentemente todos los datos asociados: documentos, pagos, notificaciones y mensajes.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setMostrarModal(true)}
              className="gap-2 whitespace-nowrap"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar Trámite
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Confirmación */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-soft rounded-full">
                    <AlertTriangle className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-primary">Eliminar Trámite</CardTitle>
                    <CardDescription>Esta acción es permanente e irreversible</CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setMostrarModal(false)
                    setConfirmacion('')
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary-soft border border-primary-line rounded-control p-4">
                <p className="text-body-sm text-primary font-medium mb-2">
                  Se eliminarán permanentemente:
                </p>
                <ul className="text-body-sm text-primary list-disc list-inside space-y-1">
                  <li>El trámite <strong>"{denominacion}"</strong></li>
                  <li>Todos los documentos subidos</li>
                  <li>Registros de pagos y enlaces de pago</li>
                  <li>Notificaciones y mensajes del chat</li>
                  <li>Cuentas bancarias asociadas</li>
                  <li>Eventos del calendario</li>
                </ul>
              </div>

              <div className="bg-warning-soft border border-warning-line rounded-control p-3">
                <p className="text-label text-warning">
                  <strong>Nota:</strong> Los archivos en Cloudinary NO se eliminan automáticamente.
                  Si necesitas liberar espacio, deberás eliminarlos manualmente desde Cloudinary.
                </p>
              </div>

              <div>
                <p className="text-body-sm font-medium text-ink-2 mb-2">
                  Para confirmar, escribe <strong className="text-primary">{textoConfirmacion}</strong>:
                </p>
                <Input
                  value={confirmacion}
                  onChange={(e) => setConfirmacion(e.target.value.toUpperCase())}
                  placeholder={`Escribe ${textoConfirmacion}`}
                  className="font-mono"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setMostrarModal(false)
                    setConfirmacion('')
                  }}
                  className="flex-1"
                  disabled={procesando}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleEliminar}
                  disabled={confirmacion !== textoConfirmacion || procesando}
                  className="flex-1"
                >
                  {procesando ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Eliminar Permanentemente
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
