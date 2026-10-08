'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CalendarPlus, Check, Plus, Trash2, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Field } from '@/components/ui/field'
import { EmptyState } from '@/components/ui/states'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { MODALIDAD_TEXTO, esRecurrente, type Modalidad } from '@/lib/cartera'
import { cn } from '@/lib/utils'
import { fechaCorta } from '@/lib/fechas'

export interface ServicioDeCliente {
  id: string
  estado: 'INTERESADO' | 'ACTIVO' | 'FINALIZADO'
  monto: number | null
  fechaInicio: string | null
  proximoVencimiento: string | null
  diasParaVencer: number | null
  notas: string | null
  servicio: { nombre: string; modalidad: Modalidad }
}

export interface ServicioCatalogoOpcion {
  id: string
  nombre: string
  modalidad: Modalidad
  precioDesde: number | null
}

const pesos = (n: number) => '$' + Math.round(n).toLocaleString('es-AR')
const fecha = (iso: string) => fechaCorta(iso)
const sufijo: Partial<Record<Modalidad, string>> = { MENSUAL: '/mes', ANUAL: '/año' }

async function pedir(url: string, metodo: string, json?: unknown) {
  const res = await fetch(url, {
    method: metodo,
    headers: json !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: json !== undefined ? JSON.stringify(json) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Algo salió mal')
  return data
}

/**
 * Los servicios de una sociedad después de inscripta: oportunidades (pidió
 * info), activos (con su vencimiento) y finalizados. El domicilio en sede se
 * muestra acá pero se gestiona en su propia pantalla.
 */
export default function ServiciosCliente({
  tramiteId,
  servicios,
  catalogo,
  domicilio,
}: {
  tramiteId: string
  servicios: ServicioDeCliente[]
  catalogo: ServicioCatalogoOpcion[]
  domicilio: { estado: string; vence: string | null; montoAnual: number | null } | null
}) {
  const router = useRouter()
  const [agregando, setAgregando] = useState(false)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [aBorrar, setABorrar] = useState<ServicioDeCliente | null>(null)
  const [verFinalizados, setVerFinalizados] = useState(false)

  async function accion(s: ServicioDeCliente, accion: 'activar' | 'renovar' | 'finalizar', ok: string) {
    setOcupado(s.id)
    try {
      await pedir(`/api/admin/servicios-contratados/${s.id}`, 'PATCH', { accion })
      toast.success(ok)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo guardar')
    } finally {
      setOcupado(null)
    }
  }

  async function borrar() {
    if (!aBorrar) return
    setOcupado(aBorrar.id)
    try {
      await pedir(`/api/admin/servicios-contratados/${aBorrar.id}`, 'DELETE')
      toast.success('Servicio quitado')
      setABorrar(null)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo quitar')
    } finally {
      setOcupado(null)
    }
  }

  const oportunidades = servicios.filter((s) => s.estado === 'INTERESADO')
  const activos = servicios.filter((s) => s.estado === 'ACTIVO')
  const finalizados = servicios.filter((s) => s.estado === 'FINALIZADO')

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-card-sm py-3.5 sm:px-card">
        <div>
          <h2 className="text-heading text-ink">Servicios</h2>
          <p className="text-body-sm text-ink-2">Lo que tiene contratado y lo que le interesa.</p>
        </div>
        <Button size="sm" onClick={() => setAgregando(true)}>
          <Plus className="h-4 w-4" aria-hidden />
          Agregar servicio
        </Button>
      </div>

      {oportunidades.length > 0 && (
        <div className="border-b border-warning-line bg-warning-soft px-card-sm py-3 sm:px-card">
          <p className="mb-2 text-body-sm font-semibold text-ink">Pidió información</p>
          <ul className="space-y-2">
            {oportunidades.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-2">
                <span className="min-w-0 flex-1 text-body-sm text-ink">{s.servicio.nombre}</span>
                <Button size="sm" loading={ocupado === s.id} onClick={() => accion(s, 'activar', 'Servicio activado')}>
                  {ocupado !== s.id && <Check className="h-4 w-4" aria-hidden />}
                  Lo contrató
                </Button>
                <Button size="sm" variant="ghost" disabled={ocupado === s.id} onClick={() => accion(s, 'finalizar', 'Oportunidad descartada')}>
                  <X className="h-4 w-4" aria-hidden />
                  No avanzó
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ul className="divide-y divide-line">
        {domicilio && (
          <li className="flex flex-wrap items-center gap-3 px-card-sm py-3 sm:px-card">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink">Domicilio legal en sede</p>
              <p className="text-body-sm text-ink-2">
                {domicilio.estado === 'ACTIVO'
                  ? `Activo${domicilio.vence ? ` · vence ${fecha(domicilio.vence)}` : ''}${domicilio.montoAnual ? ` · ${pesos(domicilio.montoAnual)}/año` : ''}`
                  : domicilio.estado === 'PENDIENTE_CONTACTO' ? 'Pendiente de contacto' : 'Cancelado'}
              </p>
            </div>
            <Button size="sm" variant="ghost" asChild>
              <Link href="/dashboard/admin/domicilios">Gestionar en Domicilios</Link>
            </Button>
          </li>
        )}

        {activos.map((s) => {
          const recurrente = esRecurrente(s.servicio.modalidad)
          const d = s.diasParaVencer
          return (
            <li key={s.id} className="flex flex-wrap items-center gap-3 px-card-sm py-3 sm:px-card">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-medium text-ink">
                  {s.servicio.nombre}
                  <Badge size="sm">{MODALIDAD_TEXTO[s.servicio.modalidad]}</Badge>
                </p>
                <p className="text-body-sm text-ink-2">
                  {s.monto != null && <span className="tnum">{pesos(s.monto)}{sufijo[s.servicio.modalidad] ?? ''}</span>}
                  {s.monto != null && (s.fechaInicio || s.proximoVencimiento) && ' · '}
                  {s.proximoVencimiento ? (
                    <span className={cn(d != null && d < 0 ? 'font-medium text-danger' : d != null && d <= 30 ? 'font-medium text-warning' : '')}>
                      {d != null && d < 0 ? `venció el ${fecha(s.proximoVencimiento)}` : `vence ${fecha(s.proximoVencimiento)}`}
                    </span>
                  ) : s.fechaInicio ? `desde ${fecha(s.fechaInicio)}` : null}
                </p>
                {s.notas && <p className="text-label text-ink-3">{s.notas}</p>}
              </div>
              <div className="flex gap-1">
                {recurrente && (
                  <Button size="sm" variant="secondary" loading={ocupado === s.id} onClick={() => accion(s, 'renovar', 'Renovado por un período más')}>
                    {ocupado !== s.id && <CalendarPlus className="h-4 w-4" aria-hidden />}
                    Renovar
                  </Button>
                )}
                <Button size="sm" variant="ghost" disabled={ocupado === s.id} onClick={() => accion(s, 'finalizar', 'Servicio finalizado')}>
                  Finalizar
                </Button>
                <Button size="icon-sm" variant="ghost" aria-label={`Quitar ${s.servicio.nombre}`} title="Quitar (cargado por error)"
                  onClick={() => setABorrar(s)} className="hover:bg-danger-soft hover:text-danger">
                  <Trash2 className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </li>
          )
        })}
      </ul>

      {!domicilio && activos.length === 0 && oportunidades.length === 0 && (
        <EmptyState
          title="Todavía no tiene servicios"
          description="Cargá lo que ya contrató, o anotá lo que le ofreciste como oportunidad."
        />
      )}

      {finalizados.length > 0 && (
        <div className="border-t border-line px-card-sm py-2 sm:px-card">
          <button className="text-body-sm text-ink-2 hover:text-ink" onClick={() => setVerFinalizados((v) => !v)}>
            {verFinalizados ? 'Ocultar' : 'Ver'} finalizados ({finalizados.length})
          </button>
          {verFinalizados && (
            <ul className="mt-2 space-y-1 pb-1">
              {finalizados.map((s) => (
                <li key={s.id} className="text-body-sm text-ink-3">{s.servicio.nombre}{s.fechaInicio ? ` · desde ${fecha(s.fechaInicio)}` : ''}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <AgregarServicioDialog
        open={agregando}
        onOpenChange={setAgregando}
        tramiteId={tramiteId}
        catalogo={catalogo}
        onHecho={() => router.refresh()}
      />
      <ConfirmDialog
        open={!!aBorrar}
        onOpenChange={(o) => !o && setABorrar(null)}
        loading={!!aBorrar && ocupado === aBorrar.id}
        onConfirm={borrar}
        title="¿Quitar este servicio?"
        confirmLabel="Quitar"
        description={aBorrar && `${aBorrar.servicio.nombre}. Usalo sólo si se cargó por error; si el cliente lo dejó, mejor «Finalizar» para que quede el historial.`}
      />
    </Card>
  )
}

function AgregarServicioDialog({
  open, onOpenChange, tramiteId, catalogo, onHecho,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  tramiteId: string
  catalogo: ServicioCatalogoOpcion[]
  onHecho: () => void
}) {
  const [servicioId, setServicioId] = useState('')
  const [estado, setEstado] = useState<'ACTIVO' | 'INTERESADO'>('ACTIVO')
  const [monto, setMonto] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [notas, setNotas] = useState('')
  const [guardando, setGuardando] = useState(false)

  const elegido = catalogo.find((c) => c.id === servicioId)

  function elegir(id: string) {
    setServicioId(id)
    const c = catalogo.find((x) => x.id === id)
    setMonto(c?.precioDesde != null ? String(c.precioDesde) : '')
  }

  async function guardar() {
    if (!servicioId) return toast.error('Elegí un servicio')
    setGuardando(true)
    try {
      await pedir(`/api/admin/sociedades/${tramiteId}/servicios`, 'POST', {
        servicioId, estado, monto, fechaInicio: fechaInicio || undefined, notas,
      })
      toast.success(estado === 'ACTIVO' ? 'Servicio agregado' : 'Oportunidad anotada')
      onOpenChange(false)
      setServicioId(''); setMonto(''); setFechaInicio(''); setNotas(''); setEstado('ACTIVO')
      onHecho()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo agregar')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar servicio</DialogTitle>
          <DialogDescription>Algo que ya contrató, o una oportunidad que querés seguir.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Servicio" htmlFor="sc-servicio" required className="sm:col-span-2">
            <Select id="sc-servicio" value={servicioId} onChange={(e) => elegir(e.target.value)}>
              <option value="">Elegí un servicio…</option>
              {catalogo.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre} · {MODALIDAD_TEXTO[c.modalidad].toLowerCase()}</option>
              ))}
            </Select>
          </Field>
          <Field label="Estado" htmlFor="sc-estado">
            <Select id="sc-estado" value={estado} onChange={(e) => setEstado(e.target.value as 'ACTIVO' | 'INTERESADO')}>
              <option value="ACTIVO">Contratado</option>
              <option value="INTERESADO">Oportunidad</option>
            </Select>
          </Field>
          <Field
            label={elegido?.modalidad === 'MENSUAL' ? 'Monto por mes' : elegido?.modalidad === 'ANUAL' ? 'Monto por año' : 'Monto'}
            htmlFor="sc-monto"
          >
            <Input id="sc-monto" type="number" inputMode="decimal" min={0} value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0" />
          </Field>
          {estado === 'ACTIVO' && (
            <Field
              label="Desde"
              htmlFor="sc-inicio"
              hint={elegido && esRecurrente(elegido.modalidad) ? 'El vencimiento se calcula solo: un período después.' : 'Si lo dejás vacío, hoy.'}
              className="sm:col-span-2"
            >
              <Input id="sc-inicio" type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
            </Field>
          )}
          <Field label="Notas" htmlFor="sc-notas" className="sm:col-span-2">
            <Textarea id="sc-notas" rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} />
          </Field>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={guardando}>Cancelar</Button>
          <Button onClick={guardar} loading={guardando}>Agregar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
