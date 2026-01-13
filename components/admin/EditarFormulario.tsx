'use client'

import { useState } from 'react'
import CollapsibleCard from '@/components/admin/CollapsibleCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Pencil, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface EditarFormularioProps {
  tramiteId: string
  tramite: {
    denominacionSocial1: string
    denominacionSocial2: string | null
    denominacionSocial3: string | null
    objetoSocial: string
    domicilioLegal: string
    capitalSocial: number
    socios: any
    administradores: any
  }
}

export default function EditarFormulario({ tramiteId, tramite }: EditarFormularioProps) {
  const router = useRouter()
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Estados para los campos editables
  const [denominacion1, setDenominacion1] = useState(tramite.denominacionSocial1)
  const [denominacion2, setDenominacion2] = useState(tramite.denominacionSocial2 || '')
  const [denominacion3, setDenominacion3] = useState(tramite.denominacionSocial3 || '')
  const [objetoSocial, setObjetoSocial] = useState(tramite.objetoSocial)
  const [domicilioLegal, setDomicilioLegal] = useState(tramite.domicilioLegal)
  const [capitalSocial, setCapitalSocial] = useState(String(tramite.capitalSocial))

  const socios = Array.isArray(tramite.socios) ? tramite.socios : []
  const administradores = Array.isArray(tramite.administradores) ? tramite.administradores : []

  const handleGuardar = async () => {
    if (!denominacion1.trim()) {
      toast.error('La denominación 1 es obligatoria')
      return
    }

    if (!objetoSocial.trim()) {
      toast.error('El objeto social es obligatorio')
      return
    }

    if (!domicilioLegal.trim()) {
      toast.error('El domicilio legal es obligatorio')
      return
    }

    const capitalSocialNum = parseFloat(capitalSocial.replace(/\./g, '').replace(',', '.'))
    if (isNaN(capitalSocialNum) || capitalSocialNum <= 0) {
      toast.error('El capital social debe ser un número válido mayor a 0')
      return
    }

    setGuardando(true)

    try {
      const response = await fetch(`/api/admin/tramites/${tramiteId}/editar-formulario`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          denominacionSocial1: denominacion1.trim(),
          denominacionSocial2: denominacion2.trim() || null,
          denominacionSocial3: denominacion3.trim() || null,
          objetoSocial: objetoSocial.trim(),
          domicilioLegal: domicilioLegal.trim(),
          capitalSocial: capitalSocialNum
        })
      })

      if (response.ok) {
        toast.success('Información del formulario actualizada correctamente')
        setEditando(false)
        setDialogOpen(false)
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al actualizar la información')
      }
    } catch (error) {
      console.error('Error al guardar:', error)
      toast.error('Error al actualizar la información')
    } finally {
      setGuardando(false)
    }
  }

  const handleCancelar = () => {
    // Restaurar valores originales
    setDenominacion1(tramite.denominacionSocial1)
    setDenominacion2(tramite.denominacionSocial2 || '')
    setDenominacion3(tramite.denominacionSocial3 || '')
    setObjetoSocial(tramite.objetoSocial)
    setDomicilioLegal(tramite.domicilioLegal)
    setCapitalSocial(String(tramite.capitalSocial))
    setEditando(false)
    setDialogOpen(false)
  }

  return (
    <CollapsibleCard
      title="Editar Información del Formulario"
      description="Permite corregir información del formulario si el cliente reporta errores"
      icon={<Pencil className="h-5 w-5 text-orange-700" />}
    >
      <div className="space-y-4">
        {!editando ? (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-900 mb-3">
                <strong>⚠️ Uso excepcional:</strong> Este formulario permite editar información básica del trámite. 
                Úsalo solo cuando el cliente reporte errores en los datos cargados.
              </p>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                    onClick={() => setEditando(true)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar Información
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">Editar Información del Formulario</DialogTitle>
                    <DialogDescription>
                      Modifica los campos necesarios. Los cambios se reflejarán inmediatamente en el trámite.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 py-4">
                    {/* Denominaciones */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900 border-b pb-2">Denominaciones</h3>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="denominacion1">Denominación 1 (Preferida) *</Label>
                          <Input
                            id="denominacion1"
                            value={denominacion1}
                            onChange={(e) => setDenominacion1(e.target.value)}
                            placeholder="Ej: MI EMPRESA SAS"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="denominacion2">Denominación 2 (Opcional)</Label>
                          <Input
                            id="denominacion2"
                            value={denominacion2}
                            onChange={(e) => setDenominacion2(e.target.value)}
                            placeholder="Ej: MI EMPRESA ALTERNATIVA SAS"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="denominacion3">Denominación 3 (Opcional)</Label>
                          <Input
                            id="denominacion3"
                            value={denominacion3}
                            onChange={(e) => setDenominacion3(e.target.value)}
                            placeholder="Ej: MI EMPRESA TERCERA SAS"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Objeto Social */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-900 border-b pb-2">Objeto Social</h3>
                      <div>
                        <Label htmlFor="objetoSocial">Objeto Social *</Label>
                        <Textarea
                          id="objetoSocial"
                          value={objetoSocial}
                          onChange={(e) => setObjetoSocial(e.target.value)}
                          placeholder="Describe el objeto social de la sociedad"
                          rows={6}
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Si es pre-aprobado, usa "PREAPROBADO". Si es personalizado, ingresa el texto completo.
                        </p>
                      </div>
                    </div>

                    {/* Domicilio Legal */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-900 border-b pb-2">Domicilio Legal</h3>
                      <div>
                        <Label htmlFor="domicilioLegal">Domicilio Legal *</Label>
                        <Input
                          id="domicilioLegal"
                          value={domicilioLegal}
                          onChange={(e) => setDomicilioLegal(e.target.value)}
                          placeholder="Ej: Av. Corrientes 1234, CABA, CABA, Buenos Aires"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* Capital Social */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-900 border-b pb-2">Capital Social</h3>
                      <div>
                        <Label htmlFor="capitalSocial">Capital Social (ARS) *</Label>
                        <Input
                          id="capitalSocial"
                          type="text"
                          value={capitalSocial}
                          onChange={(e) => {
                            // Permitir solo números y puntos/comas
                            const value = e.target.value.replace(/[^\d.,]/g, '')
                            setCapitalSocial(value)
                          }}
                          placeholder="Ej: 635600"
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Ingresa el monto sin símbolos de moneda. Puedes usar punto o coma como separador decimal.
                        </p>
                      </div>
                    </div>

                    {/* Información adicional */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-900">
                        <strong>Nota:</strong> Los socios y administradores no se pueden editar desde aquí. 
                        Si necesitas modificar esa información, contacta al equipo técnico.
                      </p>
                      <p className="text-xs text-blue-800 mt-2">
                        <strong>Socios actuales:</strong> {socios.length} | 
                        <strong> Administradores actuales:</strong> {administradores.length}
                      </p>
                    </div>
                  </div>

                  <DialogFooter className="gap-2">
                    <Button
                      variant="outline"
                      onClick={handleCancelar}
                      disabled={guardando}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleGuardar}
                      disabled={guardando}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {guardando ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </>
        ) : null}
      </div>
    </CollapsibleCard>
  )
}

