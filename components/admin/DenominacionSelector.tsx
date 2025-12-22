'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { CheckCircle, Search, AlertTriangle, Info, XCircle, Plus, Pencil } from 'lucide-react'
import CollapsibleCard from '@/components/admin/CollapsibleCard'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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
  const [denominacionAConfirmar, setDenominacionAConfirmar] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState<Record<string, boolean>>({})
  const [dialogRechazar, setDialogRechazar] = useState(false)
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [rechazando, setRechazando] = useState(false)
  const [dialogPersonalizada, setDialogPersonalizada] = useState(false)
  const [denominacionPersonalizada, setDenominacionPersonalizada] = useState('')

  const handleSeleccionar = async (denominacion: string) => {
    setSeleccionando(true)

    try {
      const response = await fetch(`/api/admin/tramites/${tramiteId}/denominacion`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ denominacion })
      })

      if (response.ok) {
        toast.success('Denominación aprobada con éxito')
        router.refresh()
      } else {
        toast.error('Error al aprobar la denominación')
      }
    } catch (error) {
      toast.error('Error al aprobar la denominación')
    } finally {
      setSeleccionando(false)
      setDenominacionAConfirmar(null)
      setDialogOpen({})
    }
  }

  const handleAprobarPersonalizada = async () => {
    if (!denominacionPersonalizada.trim()) {
      toast.error('Debes ingresar una denominación')
      return
    }

    setSeleccionando(true)

    try {
      const response = await fetch(`/api/admin/tramites/${tramiteId}/denominacion`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ denominacion: denominacionPersonalizada.trim() })
      })

      if (response.ok) {
        toast.success('Denominación personalizada aprobada con éxito')
        router.refresh()
        setDialogPersonalizada(false)
        setDenominacionPersonalizada('')
      } else {
        toast.error('Error al aprobar la denominación')
      }
    } catch (error) {
      toast.error('Error al aprobar la denominación')
    } finally {
      setSeleccionando(false)
    }
  }

  const handleRechazarTodas = async () => {
    if (!motivoRechazo.trim()) {
      toast.error('Debes explicar los motivos del rechazo')
      return
    }

    setRechazando(true)

    try {
      const response = await fetch(`/api/admin/tramites/${tramiteId}/validacion`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'REQUIERE_CORRECCIONES',
          observaciones: `⚠️ DENOMINACIONES RECHAZADAS - Se requieren 3 nuevas alternativas\n\n${motivoRechazo}`
        })
      })

      if (response.ok) {
        toast.success('Se ha solicitado al cliente que envíe 3 nuevas denominaciones')
        router.refresh()
        setDialogRechazar(false)
        setMotivoRechazo('')
      } else {
        toast.error('Error al rechazar las denominaciones')
      }
    } catch (error) {
      toast.error('Error al rechazar las denominaciones')
    } finally {
      setRechazando(false)
    }
  }

  const RenderOpcion = ({ texto, label, index }: { texto: string, label: string, index: number }) => {
    const isSelected = denominacionAprobada === texto

    return (
      <div className={`flex items-center justify-between p-4 border-2 rounded-lg transition-all ${
        isSelected ? 'bg-green-50 border-green-500 shadow-md' : 'bg-white border-gray-100 hover:border-purple-200'
      }`}>
        <div className="flex-1">
          <p className={`text-xs mb-1 font-semibold ${isSelected ? 'text-green-700' : 'text-gray-500'}`}>
            {label}
          </p>
          <p className={`text-lg font-bold ${isSelected ? 'text-green-900' : 'text-gray-900'}`}>
            {texto}
          </p>
        </div>

        {isSelected ? (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-full shadow-sm animate-in zoom-in duration-300">
            <CheckCircle className="h-5 w-5" />
            <span className="font-bold">SELECCIONADA</span>
          </div>
        ) : (
          <Dialog open={dialogOpen[texto]} onOpenChange={(open) => setDialogOpen(prev => ({ ...prev, [texto]: open }))}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 shadow-sm transition-all active:scale-95"
                disabled={seleccionando}
              >
                Aprobar Esta
              </Button>
            </DialogTrigger>
            <DialogContent className="border-2 border-purple-100">
              <DialogHeader>
                <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Info className="h-8 w-8 text-purple-600" />
                </div>
                <DialogTitle className="text-2xl text-center font-bold text-gray-900">
                  ¿Confirmar Denominación?
                </DialogTitle>
                <DialogDescription className="text-center text-gray-600 pt-2">
                  Estás por marcar <span className="font-bold text-purple-700">"{texto}"</span> como la denominación oficial aprobada para este trámite.
                  <br /><br />
                  Esto se verá reflejado en el panel del cliente.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="sm:justify-center gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setDialogOpen(prev => ({ ...prev, [texto]: false }))}
                  className="border-gray-300 font-semibold px-8"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => handleSeleccionar(texto)}
                  className="bg-purple-600 hover:bg-purple-700 font-bold px-8 shadow-md"
                  disabled={seleccionando}
                >
                  {seleccionando ? 'Procesando...' : 'Sí, Confirmar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-lg h-full">
      <CollapsibleCard
        title="Examen de Homonimia"
        description="Marca la denominación definitiva tras el examen del IPJ/IGJ"
        icon={<Search className="h-5 w-5 text-purple-700" />}
      >
        <div className="space-y-4">
          <RenderOpcion texto={denominacion1} label="Opción 1 (Preferida)" index={1} />
          {denominacion2 && <RenderOpcion texto={denominacion2} label="Opción 2" index={2} />}
          {denominacion3 && <RenderOpcion texto={denominacion3} label="Opción 3" index={3} />}

          {!denominacionAprobada && (
            <>
              {/* Opción para ingresar denominación personalizada */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Pencil className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-bold text-blue-900">¿Ninguna opción es viable?</p>
                </div>
                <p className="text-sm text-blue-800 mb-3">
                  Si el cliente acordó una denominación diferente con el registro, podés ingresarla manualmente.
                </p>
                <Dialog open={dialogPersonalizada} onOpenChange={setDialogPersonalizada}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-400"
                      disabled={seleccionando}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ingresar Denominación Alternativa
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-2 border-blue-100">
                    <DialogHeader>
                      <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Pencil className="h-8 w-8 text-blue-600" />
                      </div>
                      <DialogTitle className="text-2xl text-center font-bold text-gray-900">
                        Denominación Alternativa
                      </DialogTitle>
                      <DialogDescription className="text-center text-gray-600 pt-2">
                        Ingresá la denominación que fue acordada con el registro.
                        <br />
                        Esta será marcada como la denominación oficial aprobada.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Label htmlFor="denominacion-personalizada" className="text-base font-semibold mb-2 block text-gray-900">
                        Nueva Denominación *
                      </Label>
                      <Input
                        id="denominacion-personalizada"
                        value={denominacionPersonalizada}
                        onChange={(e) => setDenominacionPersonalizada(e.target.value)}
                        placeholder="Ej: MI EMPRESA ALTERNATIVA SAS"
                        className="text-gray-900 placeholder:text-gray-400 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <DialogFooter className="sm:justify-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDialogPersonalizada(false)
                          setDenominacionPersonalizada('')
                        }}
                        className="border-gray-300 font-semibold px-8"
                        disabled={seleccionando}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleAprobarPersonalizada}
                        className="bg-blue-600 hover:bg-blue-700 font-bold px-8 shadow-md"
                        disabled={seleccionando || !denominacionPersonalizada.trim()}
                      >
                        {seleccionando ? 'Procesando...' : 'Aprobar Esta Denominación'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mt-4">
                <Dialog open={dialogRechazar} onOpenChange={setDialogRechazar}>
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full bg-red-600 hover:bg-red-700 shadow-md transition-all active:scale-95"
                      disabled={rechazando}
                    >
                      <XCircle className="h-5 w-5 mr-2" />
                      Rechazar Todas y Solicitar 3 Nuevas Denominaciones
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-2 border-red-100">
                    <DialogHeader>
                      <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <XCircle className="h-8 w-8 text-red-600" />
                      </div>
                      <DialogTitle className="text-2xl text-center font-bold text-gray-900">
                        Rechazar Todas las Denominaciones
                      </DialogTitle>
                      <DialogDescription className="text-center text-gray-600 pt-2">
                        Se le solicitará al cliente que envíe 3 nuevas alternativas de denominación.
                        <br />
                        Es <span className="font-bold text-red-700">obligatorio</span> explicar los motivos del rechazo.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Label htmlFor="motivo-rechazo" className="text-base font-semibold mb-2 block text-gray-900">
                        Motivos del Rechazo *
                      </Label>
                      <Textarea
                        id="motivo-rechazo"
                        value={motivoRechazo}
                        onChange={(e) => setMotivoRechazo(e.target.value)}
                        placeholder="Explica detalladamente por qué se rechazan las denominaciones (ej: homonimia con empresas existentes, términos no permitidos, etc.)"
                        rows={6}
                        className="resize-none text-gray-900 placeholder:text-gray-400 bg-white border-gray-300 focus:border-red-500 focus:ring-red-500"
                      />
                    </div>
                    <DialogFooter className="sm:justify-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDialogRechazar(false)
                          setMotivoRechazo('')
                        }}
                        className="border-gray-300 font-semibold px-8"
                        disabled={rechazando}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleRechazarTodas}
                        className="bg-red-600 hover:bg-red-700 font-bold px-8 shadow-md"
                        disabled={rechazando || !motivoRechazo.trim()}
                      >
                        {rechazando ? 'Procesando...' : 'Confirmar Rechazo'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-900">Pendiente de Selección</p>
                  <p className="text-sm text-amber-800">
                    Aún no has marcado ninguna denominación como aprobada.
                    Selecciona una opción una vez que tengas el resultado del examen.
                  </p>
                </div>
              </div>
            </>
          )}
          
          {denominacionAprobada && (
            <div className="bg-blue-50 border-2 border-blue-100 rounded-lg p-4 mt-6">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-bold text-blue-900">Pasos Sugeridos</p>
              </div>
              <p className="text-sm text-blue-800">
                Ya has seleccionado una denominación. Puedes enviar una observación al cliente 
                para informarle y avanzar con el trámite.
              </p>
            </div>
          )}
        </div>
      </CollapsibleCard>
    </div>
  )
}

