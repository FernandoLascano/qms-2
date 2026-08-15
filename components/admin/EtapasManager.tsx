'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { CheckCircle, Clock, ListChecks, User, Building2, AlertTriangle } from 'lucide-react'

type Responsable = 'cliente' | 'qms'

interface EtapasManagerProps {
  tramiteId: string
  etapas: {
    formularioCompleto: boolean
    honorariosPagados: boolean
    homonimiaAnalizada: boolean
    ciudadanoDigitalOk: boolean
    denominacionReservada: boolean
    cuentaBancariaAbierta: boolean
    capitalDepositado: boolean
    tasaPagada: boolean
    borradorEnviado: boolean
    borradorAprobadoCliente: boolean
    documentosRevisados: boolean
    documentosFirmados: boolean
    tramiteIngresado: boolean
    sociedadInscripta: boolean
    tramiteObservado: boolean
  }
  instruccionesFirma?: string | null
  observacionesOrganismo?: string | null
}

export default function EtapasManager({
  tramiteId,
  etapas,
  instruccionesFirma,
  observacionesOrganismo
}: EtapasManagerProps) {
  const router = useRouter()
  const [actualizando, setActualizando] = useState<string | null>(null)
  const [instrucciones, setInstrucciones] = useState(instruccionesFirma || '')
  const [observaciones, setObservaciones] = useState(observacionesOrganismo || '')
  const [guardandoTextos, setGuardandoTextos] = useState(false)

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
    } catch {
      toast.error('Error al actualizar la etapa')
    } finally {
      setActualizando(null)
    }
  }

  const handleGuardarTextos = async () => {
    setGuardandoTextos(true)
    try {
      const response = await fetch(`/api/admin/tramites/${tramiteId}/flujo-textos`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruccionesFirma: instrucciones,
          observacionesOrganismo: observaciones
        })
      })

      if (response.ok) {
        toast.success('Textos guardados')
        router.refresh()
      } else {
        toast.error('Error al guardar los textos')
      }
    } catch {
      toast.error('Error al guardar los textos')
    } finally {
      setGuardandoTextos(false)
    }
  }

  // Flujo lineal, en el orden real del proceso. `responsable` = de quién depende ese paso.
  const etapasLista: { key: string; label: string; valor: boolean; descripcion: string; responsable: Responsable }[] = [
    { key: 'formularioCompleto', label: '1. Formulario Completo', valor: etapas.formularioCompleto, descripcion: 'Cliente completó el formulario', responsable: 'cliente' },
    { key: 'honorariosPagados', label: '2. Honorarios Pagados', valor: etapas.honorariosPagados, descripcion: 'Pago de honorarios confirmado (por ahora manual)', responsable: 'cliente' },
    { key: 'homonimiaAnalizada', label: '3. Análisis de Homonimia', valor: etapas.homonimiaAnalizada, descripcion: 'Se analizó la opción de nombre más viable', responsable: 'qms' },
    { key: 'ciudadanoDigitalOk', label: '4. Ciudadano Digital Nivel 2', valor: etapas.ciudadanoDigitalOk, descripcion: 'El cliente tiene Ciudadano Digital Nivel 2', responsable: 'cliente' },
    { key: 'denominacionReservada', label: '5. Reserva de Nombre', valor: etapas.denominacionReservada, descripcion: 'Tasa pagada y nombre reservado en IPJ/IGJ', responsable: 'qms' },
    { key: 'cuentaBancariaAbierta', label: '6. Cuenta Bancaria Abierta', valor: etapas.cuentaBancariaAbierta, descripcion: 'Se abrió la cuenta para el depósito del capital', responsable: 'qms' },
    { key: 'capitalDepositado', label: '7. Capital Depositado (25%)', valor: etapas.capitalDepositado, descripcion: 'Cliente depositó el 25% del capital social', responsable: 'cliente' },
    { key: 'tasaPagada', label: '8. Tasa Final Pagada', valor: etapas.tasaPagada, descripcion: 'Tasa retributiva final abonada', responsable: 'cliente' },
    { key: 'borradorEnviado', label: '9. Borrador Enviado', valor: etapas.borradorEnviado, descripcion: 'Se envió el borrador al cliente para que lo controle', responsable: 'qms' },
    { key: 'borradorAprobadoCliente', label: '10. Borrador Aprobado', valor: etapas.borradorAprobadoCliente, descripcion: 'El cliente controló y aprobó el borrador', responsable: 'cliente' },
    { key: 'documentosRevisados', label: '11. Documentos Enviados', valor: etapas.documentosRevisados, descripcion: 'Estatutos y actas enviados para firma', responsable: 'qms' },
    { key: 'documentosFirmados', label: '12. Documentos Firmados', valor: etapas.documentosFirmados, descripcion: 'Cliente firmó y envió los docs escaneados', responsable: 'cliente' },
    { key: 'tramiteIngresado', label: '13. Trámite Ingresado', valor: etapas.tramiteIngresado, descripcion: 'Trámite ingresado en IPJ/IGJ', responsable: 'qms' },
    { key: 'sociedadInscripta', label: '14. Sociedad Inscripta', valor: etapas.sociedadInscripta, descripcion: 'CUIT asignado y resolución obtenida', responsable: 'qms' }
  ]

  const completadas = etapasLista.filter(e => e.valor).length

  const renderResponsable = (responsable: Responsable) => {
    if (responsable === 'cliente') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-warning-soft text-warning border border-warning-line whitespace-nowrap">
          <User className="h-3 w-3" /> Cliente
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-info-soft text-info border border-info-line whitespace-nowrap">
        <Building2 className="h-3 w-3" /> QMS
      </span>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-success-soft">
            <ListChecks className="h-4 w-4 text-success" />
          </span>
          <span>Control de Etapas del Trámite</span>
        </CardTitle>
        <CardDescription>
          Marcá cada etapa a medida que avanza el proceso. La etiqueta indica de quién depende el paso.
          Podés marcar cualquier etapa vos mismo aunque el cliente todavía no la haya confirmado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-3">
          {etapasLista.map((etapa) => (
            <button
              key={etapa.key}
              onClick={() => handleToggleEtapa(etapa.key, etapa.valor)}
              disabled={actualizando === etapa.key}
              className={`flex items-start gap-3 p-4 border-2 rounded-control transition-all text-left ${
                etapa.valor
                  ? 'bg-success-soft border-success-line hover:bg-success-soft'
                  : 'bg-surface border-line-strong hover:bg-surface-2'
              } ${actualizando === etapa.key ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
            >
              <div className="mt-0.5">
                {etapa.valor ? (
                  <CheckCircle className="h-6 w-6 text-success" />
                ) : (
                  <Clock className="h-6 w-6 text-ink-3" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className={`font-medium ${etapa.valor ? 'text-success' : 'text-ink'}`}>
                    {etapa.label}
                  </p>
                  {renderResponsable(etapa.responsable)}
                </div>
                <p className="text-label text-ink-2">
                  {etapa.descripcion}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Resumen de progreso */}
        <div className="mt-6 p-4 bg-info-soft border border-info-line rounded-control">
          <div className="flex items-center justify-between mb-2">
            <span className="text-body-sm font-medium text-info">
              Progreso General
            </span>
            <span className="text-body-sm font-semibold text-info">
              {completadas} / {etapasLista.length} completadas
            </span>
          </div>
          <div className="w-full bg-info-solid rounded-full h-3">
            <div
              className="bg-info-solid h-3 rounded-full transition-all"
              style={{
                width: `${(completadas / etapasLista.length) * 100}%`
              }}
            />
          </div>
        </div>

        {/* Resultado observado (fuera del progreso lineal) */}
        <div className="mt-6 border-t border-line pt-6">
          <button
            onClick={() => handleToggleEtapa('tramiteObservado', etapas.tramiteObservado)}
            disabled={actualizando === 'tramiteObservado'}
            className={`w-full flex items-start gap-3 p-4 border-2 rounded-control transition-all text-left ${
              etapas.tramiteObservado
                ? 'bg-warning-soft border-warning-line hover:bg-warning-soft'
                : 'bg-surface border-line-strong hover:bg-surface-2'
            } ${actualizando === 'tramiteObservado' ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
          >
            <AlertTriangle className={`h-6 w-6 mt-0.5 ${etapas.tramiteObservado ? 'text-warning' : 'text-ink-3'}`} />
            <div className="flex-1">
              <p className={`font-medium mb-1 ${etapas.tramiteObservado ? 'text-warning' : 'text-ink'}`}>
                Trámite Observado
              </p>
              <p className="text-label text-ink-2">
                Marcá esto si el organismo observó el trámite. Detallá las observaciones abajo.
              </p>
            </div>
          </button>
        </div>

        {/* Textos editables del flujo */}
        <div className="mt-6 space-y-4 border-t border-line pt-6">
          <div>
            <label htmlFor="instruccionesFirma" className="block text-body-sm font-medium text-ink mb-1">
              Instrucciones de firma (las ve el cliente)
            </label>
            <Textarea
              id="instruccionesFirma"
              value={instrucciones}
              onChange={(e) => setInstrucciones(e.target.value)}
              placeholder="Ej: Firmá cada hoja del estatuto, certificá la firma ante escribano o banco, y subí el PDF escaneado..."
              rows={4}
            />
          </div>

          <div>
            <label htmlFor="observacionesOrganismo" className="block text-body-sm font-medium text-ink mb-1">
              Observaciones del organismo (las ve el cliente si el trámite fue observado)
            </label>
            <Textarea
              id="observacionesOrganismo"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Detallá qué observó el organismo y qué hace falta para resolverlo..."
              rows={4}
            />
          </div>

          <Button onClick={handleGuardarTextos} disabled={guardandoTextos}>
            {guardandoTextos ? 'Guardando...' : 'Guardar textos'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
