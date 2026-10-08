'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Download, Eye, FileCheck2, Trash2, Upload } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/card'
import { Badge, type Tone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Field } from '@/components/ui/field'
import { FileInput } from '@/components/ui/file-input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  ETIQUETA_ESTADO_CONTRATO,
  MAX_BYTES_CONTRATO_FIRMADO,
  urlContratoFirmado,
  type ContratoFirmadoInfo,
  type EstadoContrato,
  type ResumenContrato,
} from '@/lib/contrato-domicilio-firmado'

const TONO: Record<EstadoContrato, Tone> = {
  FIRMADO: 'success',
  GENERADO: 'warning',
  SIN_CONTRATO: 'neutral',
}

/** Fecha corta en hora argentina (las fechas de firma se guardan a mediodía UTC). */
export const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })

const hoyArgentina = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })

/** Píldora con el estado del contrato. */
export function EstadoContratoBadge({ resumen, size = 'sm' }: { resumen: ResumenContrato; size?: 'sm' | 'md' }) {
  return (
    <Badge tone={TONO[resumen.estado]} dot size={size}>
      {ETIQUETA_ESTADO_CONTRATO[resumen.estado]}
    </Badge>
  )
}

/** Una línea que explica el estado: «Firmado el …», «v2 generada el …». */
export function detalleContrato(resumen: ResumenContrato) {
  if (resumen.firmado) {
    return `Firmado el ${fechaCorta(resumen.firmado.fechaFirma)}${resumen.firmado.version ? ` · v${resumen.firmado.version}` : ''}`
  }
  if (resumen.ultimaVersion) {
    return `v${resumen.ultimaVersion.version} generada el ${fechaCorta(resumen.ultimaVersion.fecha)}`
  }
  return 'Todavía no se generó'
}

/** Botones para abrir o descargar un PDF firmado. */
export function VerContratoFirmado({ tramiteId, firmado }: { tramiteId: string; firmado: ContratoFirmadoInfo }) {
  return (
    <>
      <Button asChild size="sm" variant="secondary">
        <a href={urlContratoFirmado(tramiteId, firmado.id)} target="_blank" rel="noopener noreferrer">
          <Eye className="h-4 w-4" aria-hidden /> Ver
        </a>
      </Button>
      <Button asChild size="sm" variant="ghost">
        <a href={urlContratoFirmado(tramiteId, firmado.id, true)} title="Descargar el PDF firmado">
          <Download className="h-4 w-4" aria-hidden />
          <span className="sr-only">Descargar</span>
        </a>
      </Button>
    </>
  )
}

type VersionGenerada = { id: string; version: number; fecha: string; generadoPor: string | null }

/**
 * Modal para subir (o reemplazar) el contrato firmado: PDF + fecha de firma,
 * y opcionalmente la versión generada a la que corresponde.
 */
export function SubirContratoFirmadoDialog({
  tramiteId,
  denominacion,
  open,
  onOpenChange,
  reemplaza = false,
  onSubido,
}: {
  tramiteId: string
  denominacion?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  reemplaza?: boolean
  onSubido?: () => void
}) {
  const [archivo, setArchivo] = useState<File | null>(null)
  const [fechaFirma, setFechaFirma] = useState(hoyArgentina())
  const [versiones, setVersiones] = useState<VersionGenerada[]>([])
  const [versionId, setVersionId] = useState('')
  const [subiendo, setSubiendo] = useState(false)

  // Al abrir: formulario limpio y las versiones generadas (la última, preelegida).
  useEffect(() => {
    if (!open) return
    setArchivo(null)
    setFechaFirma(hoyArgentina())
    setVersionId('')
    fetch(`/api/admin/tramites/${tramiteId}/contrato-domicilio/firmado`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { versiones?: VersionGenerada[] } | null) => {
        const vs = d?.versiones ?? []
        setVersiones(vs)
        setVersionId(vs[0]?.id ?? '')
      })
      .catch(() => setVersiones([]))
  }, [open, tramiteId])

  function elegir(f: File | null) {
    if (f && f.type && f.type !== 'application/pdf') {
      toast.error('El contrato firmado tiene que ser un PDF')
      setArchivo(null)
      return
    }
    if (f && f.size > MAX_BYTES_CONTRATO_FIRMADO) {
      toast.error('El archivo supera los 15 MB')
      setArchivo(null)
      return
    }
    setArchivo(f)
  }

  async function subir() {
    if (!archivo) { toast.error('Elegí el PDF firmado'); return }
    if (!fechaFirma) { toast.error('Indicá la fecha de firma'); return }
    setSubiendo(true)
    try {
      const fd = new FormData()
      fd.append('file', archivo)
      fd.append('fechaFirma', fechaFirma)
      if (versionId) fd.append('contratoVersionId', versionId)
      const res = await fetch(`/api/admin/tramites/${tramiteId}/contrato-domicilio/firmado`, { method: 'POST', body: fd })
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'No se pudo subir el contrato')
      toast.success(reemplaza ? 'Contrato firmado reemplazado' : 'Contrato firmado cargado')
      onOpenChange(false)
      onSubido?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo subir el contrato')
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !subiendo && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{reemplaza ? 'Reemplazar contrato firmado' : 'Subir contrato firmado'}</DialogTitle>
          <DialogDescription>
            {denominacion ? `${denominacion}. ` : ''}
            {reemplaza
              ? 'El nuevo pasa a ser el vigente; el anterior queda en el historial.'
              : 'El PDF con las firmas (Adobe Sign u otra plataforma). No se le avisa al cliente.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <FileInput
            accept="application/pdf,.pdf"
            ayuda="Sólo PDF, hasta 15 MB"
            archivo={archivo}
            onArchivo={elegir}
            disabled={subiendo}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Fecha de firma" htmlFor="cf-fecha" required>
              <Input
                id="cf-fecha"
                type="date"
                value={fechaFirma}
                max={hoyArgentina()}
                onChange={(e) => setFechaFirma(e.target.value)}
              />
            </Field>
            {versiones.length > 0 && (
              <Field label="Versión firmada" htmlFor="cf-version" hint="La generada que se mandó a firmar.">
                <Select id="cf-version" value={versionId} onChange={(e) => setVersionId(e.target.value)}>
                  {versiones.map((v) => (
                    <option key={v.id} value={v.id}>
                      v{v.version} · {fechaCorta(v.fecha)}
                    </option>
                  ))}
                  <option value="">No sé / otra</option>
                </Select>
              </Field>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={subiendo}>Cancelar</Button>
          <Button onClick={subir} loading={subiendo} disabled={!archivo}>
            {!subiendo && <Upload className="h-4 w-4" aria-hidden />}
            {reemplaza ? 'Reemplazar' : 'Subir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type Detalle = ResumenContrato & {
  historial: ContratoFirmadoInfo[]
  domicilio: 'PENDIENTE_CONTACTO' | 'ACTIVO' | 'CANCELADO' | null
}

/**
 * Ficha del trámite (pestaña Documentos), junto al generador: estado del
 * firmado, subir/reemplazar/ver/descargar/quitar, e historial de reemplazados.
 */
export default function ContratoFirmadoTramite({ tramiteId }: { tramiteId: string }) {
  const [detalle, setDetalle] = useState<Detalle | null>(null)
  const [error, setError] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [quitando, setQuitando] = useState<ContratoFirmadoInfo | null>(null)
  const [borrando, setBorrando] = useState(false)

  const cargar = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/tramites/${tramiteId}/contrato-domicilio/firmado`)
      if (!res.ok) throw new Error()
      setDetalle(await res.json())
      setError(false)
    } catch {
      setError(true)
    }
  }, [tramiteId])

  useEffect(() => { cargar() }, [cargar])

  async function quitar() {
    if (!quitando) return
    setBorrando(true)
    try {
      const res = await fetch(urlContratoFirmado(tramiteId, quitando.id), { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'No se pudo quitar')
      toast.success('Contrato firmado quitado')
      setQuitando(null)
      await cargar()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo quitar')
    } finally {
      setBorrando(false)
    }
  }

  // Si no se pudo leer (p. ej. la tabla todavía no existe) no se muestra nada:
  // el generador de al lado sigue funcionando igual.
  if (error || !detalle) return null
  // Sin servicio de domicilio y sin nada generado ni firmado, no hay nada que seguir.
  if (!detalle.domicilio && detalle.estado === 'SIN_CONTRATO') return null

  const firmado = detalle.firmado

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-heading text-ink">Contrato de domicilio firmado</h3>
              <EstadoContratoBadge resumen={detalle} />
            </div>
            <p className="text-body-sm text-ink-2">
              {firmado
                ? `${detalleContrato(detalle)} · cargado el ${fechaCorta(firmado.createdAt)}${firmado.cargadoPor ? ` por ${firmado.cargadoPor}` : ''}`
                : `${detalleContrato(detalle)}. Cuando vuelva firmado, subí el PDF acá.`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {firmado && <VerContratoFirmado tramiteId={tramiteId} firmado={firmado} />}
            <Button size="sm" variant={firmado ? 'secondary' : 'primary'} onClick={() => setSubiendo(true)}>
              {firmado ? <Upload className="h-4 w-4" aria-hidden /> : <FileCheck2 className="h-4 w-4" aria-hidden />}
              {firmado ? 'Reemplazar' : 'Subir firmado'}
            </Button>
            {firmado && (
              <Button size="sm" variant="ghost" onClick={() => setQuitando(firmado)} title="Quitar el contrato firmado">
                <Trash2 className="h-4 w-4" aria-hidden />
                <span className="sr-only">Quitar</span>
              </Button>
            )}
          </div>
        </div>

        {detalle.historial.length > 0 && (
          <div className="border-t border-line pt-3">
            <p className="mb-2 text-label font-medium text-ink-2">Reemplazados</p>
            <ul className="space-y-1.5">
              {detalle.historial.map((h) => (
                <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 text-body-sm">
                  <span className="min-w-0 truncate text-ink-2">
                    Firmado el {fechaCorta(h.fechaFirma)}{h.version ? ` · v${h.version}` : ''} · {h.nombreArchivo}
                  </span>
                  <a href={urlContratoFirmado(tramiteId, h.id)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Ver
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardBody>

      <SubirContratoFirmadoDialog
        tramiteId={tramiteId}
        open={subiendo}
        onOpenChange={setSubiendo}
        reemplaza={!!firmado}
        onSubido={cargar}
      />
      <ConfirmDialog
        open={!!quitando}
        onOpenChange={(o) => !o && setQuitando(null)}
        title="¿Quitar el contrato firmado?"
        description={
          detalle.historial.length > 0
            ? 'Se borra el archivo. El anterior del historial vuelve a quedar como vigente.'
            : 'Se borra el archivo y el domicilio vuelve a figurar sin contrato firmado.'
        }
        confirmLabel="Quitar"
        loading={borrando}
        onConfirm={quitar}
      />
    </Card>
  )
}
