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

  // Verificar si la denominación aprobada es una de las 3 originales o es alternativa
  const esAlternativa = denominacionAprobada &&
    denominacionAprobada !== denominacion1 &&
    denominacionAprobada !== denominacion2 &&
    denominacionAprobada !== denominacion3

  const RenderOpcion = ({ texto, label, index }: { texto: string, label: string, index: number }) => {
    const isSelected = denominacionAprobada === texto

    return (
      <div className={`flex items-center justify-between p-4 border-2 rounded-control transition-all ${
        isSelected ? 'bg-success-soft border-success-line shadow-raise' :
        denominacionAprobada ? 'bg-surface-2 border-line' : 'bg-surface border-line hover:border-info-line'
      }`}>
        <div className="flex-1">
          <p className={`text-label mb-1 font-semibold ${
            isSelected ? 'text-success' :
            denominacionAprobada ? 'text-ink-3' : 'text-ink-2'
          }`}>
            {label}
          </p>
          <p className={`text-heading font-semibold ${
            isSelected ? 'text-success' :
            denominacionAprobada ? 'text-ink-3' : 'text-ink'
          }`}>
            {texto}
          </p>
        </div>

        {isSelected ? (
          <div className="flex items-center gap-2 px-4 py-2 bg-success-solid text-on-primary rounded-full shadow-raise animate-in zoom-in duration-300">
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold">SELECCIONADA</span>
          </div>
        ) : denominacionAprobada ? (
          // Si ya hay una denominación aprobada, no mostrar botón
          <span className="text-body-sm text-ink-3 italic">No seleccionada</span>
        ) : (
          <Dialog open={dialogOpen[texto]} onOpenChange={(open) => setDialogOpen(prev => ({ ...prev, [texto]: open }))}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="bg-info-solid hover:bg-info-solid shadow-raise transition-all"
                disabled={seleccionando}
              >
                Aprobar Esta
              </Button>
            </DialogTrigger>
            <DialogContent className="border-2 border-info-line">
              <DialogHeader>
                <div className="mx-auto w-16 h-16 bg-info-soft rounded-full flex items-center justify-center mb-4">
                  <Info className="h-8 w-8 text-info" />
                </div>
                <DialogTitle className="text-title text-center font-semibold text-ink">
                  ¿Confirmar Denominación?
                </DialogTitle>
                <DialogDescription className="text-center text-ink-2 pt-2">
                  Estás por marcar <span className="font-semibold text-info">"{texto}"</span> como la denominación oficial aprobada para este trámite.
                  <br /><br />
                  Esto se verá reflejado en el panel del cliente.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="sm:justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(prev => ({ ...prev, [texto]: false }))}
                  className="border-line-strong font-semibold px-8"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => handleSeleccionar(texto)}
                  className="bg-info-solid hover:bg-info-solid font-semibold px-8 shadow-raise"
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
    <div className="rounded-control h-full">
      <CollapsibleCard
        title="Examen de Homonimia"
        description="Marca la denominación definitiva tras el examen del IPJ/IGJ"
        icon={<Search className="h-5 w-5 text-info" />}
      >
        <div className="space-y-4">
          {/* Si hay una denominación alternativa aprobada, mostrarla primero */}
          {esAlternativa && denominacionAprobada && (
            <div className="flex items-center justify-between p-4 border-2 rounded-control bg-success-soft border-success-line shadow-raise">
              <div className="flex-1">
                <p className="text-label mb-1 font-semibold text-success">
                  Denominación Alternativa (Aprobada)
                </p>
                <p className="text-heading font-semibold text-success">
                  {denominacionAprobada}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Dialog open={dialogPersonalizada} onOpenChange={setDialogPersonalizada}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-success-line text-success hover:bg-success-soft"
                      onClick={() => setDenominacionPersonalizada(denominacionAprobada)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-2 border-info-line">
                    <DialogHeader>
                      <div className="mx-auto w-16 h-16 bg-info-soft rounded-full flex items-center justify-center mb-4">
                        <Pencil className="h-8 w-8 text-info" />
                      </div>
                      <DialogTitle className="text-title text-center font-semibold text-ink">
                        Editar Denominación
                      </DialogTitle>
                      <DialogDescription className="text-center text-ink-2 pt-2">
                        Modificá la denominación si es necesario realizar algún ajuste.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Label htmlFor="denominacion-personalizada" className="text-body font-semibold mb-2 block text-ink">
                        Denominación *
                      </Label>
                      <Input
                        id="denominacion-personalizada"
                        value={denominacionPersonalizada}
                        onChange={(e) => setDenominacionPersonalizada(e.target.value)}
                        placeholder="Ej: MI EMPRESA ALTERNATIVA SAS"
                        className="text-ink placeholder:text-ink-3 bg-surface border-line-strong focus:border-info-line focus:ring-info-solid"
                      />
                    </div>
                    <DialogFooter className="sm:justify-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDialogPersonalizada(false)
                          setDenominacionPersonalizada('')
                        }}
                        className="border-line-strong font-semibold px-8"
                        disabled={seleccionando}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleAprobarPersonalizada}
                        className="bg-info-solid hover:bg-info-solid font-semibold px-8 shadow-raise"
                        disabled={seleccionando || !denominacionPersonalizada.trim()}
                      >
                        {seleccionando ? 'Procesando...' : 'Guardar Cambios'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <div className="flex items-center gap-2 px-4 py-2 bg-success-solid text-on-primary rounded-full shadow-raise">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">SELECCIONADA</span>
                </div>
              </div>
            </div>
          )}

          {/* Mostrar las opciones originales (solo si no es alternativa, o mostrar como no seleccionadas) */}
          {!esAlternativa && (
            <RenderOpcion texto={denominacion1} label="Opción 1 (Preferida)" index={1} />
          )}
          {esAlternativa && (
            <div className="bg-surface-2 border-2 border-line rounded-control p-4">
              <p className="text-label mb-1 font-semibold text-ink-3">Opciones originales (no seleccionadas)</p>
              <div className="space-y-2 mt-2">
                <p className="text-body-sm text-ink-3">{denominacion1}</p>
                {denominacion2 && <p className="text-body-sm text-ink-3">{denominacion2}</p>}
                {denominacion3 && <p className="text-body-sm text-ink-3">{denominacion3}</p>}
              </div>
            </div>
          )}
          {!esAlternativa && denominacion2 && <RenderOpcion texto={denominacion2} label="Opción 2" index={2} />}
          {!esAlternativa && denominacion3 && <RenderOpcion texto={denominacion3} label="Opción 3" index={3} />}

          {!denominacionAprobada && (
            <>
              {/* Opción para ingresar denominación personalizada */}
              <div className="bg-info-soft border-2 border-info-line rounded-control p-4 mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Pencil className="h-4 w-4 text-info" />
                  <p className="text-body-sm font-semibold text-info">¿Ninguna opción es viable?</p>
                </div>
                <p className="text-body-sm text-info mb-3">
                  Si el cliente acordó una denominación diferente con el registro, podés ingresarla manualmente.
                </p>
                <Dialog open={dialogPersonalizada} onOpenChange={setDialogPersonalizada}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full border-info-line text-info hover:bg-info-soft hover:border-info-line"
                      disabled={seleccionando}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ingresar Denominación Alternativa
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-2 border-info-line">
                    <DialogHeader>
                      <div className="mx-auto w-16 h-16 bg-info-soft rounded-full flex items-center justify-center mb-4">
                        <Pencil className="h-8 w-8 text-info" />
                      </div>
                      <DialogTitle className="text-title text-center font-semibold text-ink">
                        Denominación Alternativa
                      </DialogTitle>
                      <DialogDescription className="text-center text-ink-2 pt-2">
                        Ingresá la denominación que fue acordada con el registro.
                        <br />
                        Esta será marcada como la denominación oficial aprobada.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Label htmlFor="denominacion-personalizada" className="text-body font-semibold mb-2 block text-ink">
                        Nueva Denominación *
                      </Label>
                      <Input
                        id="denominacion-personalizada"
                        value={denominacionPersonalizada}
                        onChange={(e) => setDenominacionPersonalizada(e.target.value)}
                        placeholder="Ej: MI EMPRESA ALTERNATIVA SAS"
                        className="text-ink placeholder:text-ink-3 bg-surface border-line-strong focus:border-info-line focus:ring-info-solid"
                      />
                    </div>
                    <DialogFooter className="sm:justify-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDialogPersonalizada(false)
                          setDenominacionPersonalizada('')
                        }}
                        className="border-line-strong font-semibold px-8"
                        disabled={seleccionando}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleAprobarPersonalizada}
                        className="bg-info-solid hover:bg-info-solid font-semibold px-8 shadow-raise"
                        disabled={seleccionando || !denominacionPersonalizada.trim()}
                      >
                        {seleccionando ? 'Procesando...' : 'Aprobar Esta Denominación'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="bg-primary-soft border-2 border-primary-line rounded-control p-4 mt-4">
                <Dialog open={dialogRechazar} onOpenChange={setDialogRechazar}>
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full bg-primary hover:bg-primary shadow-raise transition-all"
                      disabled={rechazando}
                    >
                      <XCircle className="h-5 w-5 mr-2" />
                      Rechazar Todas y Solicitar 3 Nuevas Denominaciones
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-2 border-primary-line">
                    <DialogHeader>
                      <div className="mx-auto w-16 h-16 bg-primary-soft rounded-full flex items-center justify-center mb-4">
                        <XCircle className="h-8 w-8 text-primary" />
                      </div>
                      <DialogTitle className="text-title text-center font-semibold text-ink">
                        Rechazar Todas las Denominaciones
                      </DialogTitle>
                      <DialogDescription className="text-center text-ink-2 pt-2">
                        Se le solicitará al cliente que envíe 3 nuevas alternativas de denominación.
                        <br />
                        Es <span className="font-semibold text-primary">obligatorio</span> explicar los motivos del rechazo.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Label htmlFor="motivo-rechazo" className="text-body font-semibold mb-2 block text-ink">
                        Motivos del Rechazo *
                      </Label>
                      <Textarea
                        id="motivo-rechazo"
                        value={motivoRechazo}
                        onChange={(e) => setMotivoRechazo(e.target.value)}
                        placeholder="Explica detalladamente por qué se rechazan las denominaciones (ej: homonimia con empresas existentes, términos no permitidos, etc.)"
                        rows={6}
                        className="resize-none text-ink placeholder:text-ink-3 bg-surface border-line-strong focus:border-primary-line focus:ring-ring"
                      />
                    </div>
                    <DialogFooter className="sm:justify-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDialogRechazar(false)
                          setMotivoRechazo('')
                        }}
                        className="border-line-strong font-semibold px-8"
                        disabled={rechazando}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleRechazarTodas}
                        className="bg-primary hover:bg-primary font-semibold px-8 shadow-raise"
                        disabled={rechazando || !motivoRechazo.trim()}
                      >
                        {rechazando ? 'Procesando...' : 'Confirmar Rechazo'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="bg-warning-soft border-2 border-warning-line rounded-control p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                <div>
                  <p className="text-body-sm font-semibold text-warning">Pendiente de Selección</p>
                  <p className="text-body-sm text-warning">
                    Aún no has marcado ninguna denominación como aprobada.
                    Selecciona una opción una vez que tengas el resultado del examen.
                  </p>
                </div>
              </div>
            </>
          )}
          
          {denominacionAprobada && (
            <div className="bg-info-soft border-2 border-info-line rounded-control p-4 mt-6">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-info" />
                <p className="text-body-sm font-semibold text-info">Pasos Sugeridos</p>
              </div>
              <p className="text-body-sm text-info">
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

