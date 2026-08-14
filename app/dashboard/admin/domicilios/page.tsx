'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { PageSkeleton } from '@/components/ui/states'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Building, CheckCircle2, RefreshCw, XCircle, DollarSign, ExternalLink, MapPin, Pencil, CalendarClock } from 'lucide-react'

type Estado = 'PENDIENTE_CONTACTO' | 'ACTIVO' | 'CANCELADO'
type Item = {
  id: string
  estado: Estado
  montoAnual: number | null
  fechaInicio: string | null
  fechaVencimiento: string | null
  ultimoCobro: string | null
  notas: string | null
  createdAt: string
  direccion: string | null
  tramite: { id: string; denominacion: string; cliente: string; email: string | null }
}
type ConfigDom = { direcciones: string[]; precioAnual: number; diasAlerta: number }
type Disponible = { id: string; denominacion: string; cliente: string; inscripta: boolean }

const hoyISO = () => new Date().toISOString().slice(0, 10)
const masUnAnioISO = (iso: string) => {
  const d = new Date(iso)
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().slice(0, 10)
}

const fmt = (n: number) => '$' + (Math.round(n * 100) / 100).toLocaleString('es-AR', { maximumFractionDigits: 2 })
const fmtFecha = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('es-AR') : '—')
const diasHasta = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
const toDateInput = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10))

export default function DomiciliosPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [config, setConfig] = useState<ConfigDom>({ direcciones: [], precioAnual: 0, diasAlerta: 30 })
  const [disponibles, setDisponibles] = useState<Disponible[]>([])
  const [activando, setActivando] = useState<{ id: string; monto: string; direccion: string } | null>(null)
  const [editando, setEditando] = useState<{ id: string; direccion: string; monto: string; fechaVencimiento: string; notas: string } | null>(null)
  const [nuevo, setNuevo] = useState({ tramiteId: '', direccion: '', monto: '', fechaInicio: hoyISO(), fechaVencimiento: masUnAnioISO(hoyISO()) })

  async function cargar() {
    try {
      const res = await fetch('/api/admin/domicilios')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setItems(data.items)
      setConfig(data.config)
      setDisponibles(data.disponibles || [])
    } catch {
      toast.error('Error al cargar domicilios')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { cargar() }, [])

  async function agregarExistente() {
    if (!nuevo.tramiteId) { toast.error('Elegí una sociedad'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/domicilios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tramiteId: nuevo.tramiteId,
          direccion: nuevo.direccion || undefined,
          montoAnual: nuevo.monto !== '' ? Number(nuevo.monto) : undefined,
          fechaInicio: nuevo.fechaInicio,
          fechaVencimiento: nuevo.fechaVencimiento,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Servicio cargado')
      setNuevo({ tramiteId: '', direccion: '', monto: '', fechaInicio: hoyISO(), fechaVencimiento: masUnAnioISO(hoyISO()) })
      await cargar()
    } catch (e: any) {
      toast.error(e.message || 'Error')
    } finally {
      setSaving(false)
    }
  }

  const pendientes = useMemo(() => items.filter((i) => i.estado === 'PENDIENTE_CONTACTO'), [items])
  const activos = useMemo(() => items.filter((i) => i.estado === 'ACTIVO'), [items])
  const cancelados = useMemo(() => items.filter((i) => i.estado === 'CANCELADO'), [items])

  async function accion(id: string, body: any, okMsg: string) {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/domicilios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success(okMsg)
      setActivando(null)
      setEditando(null)
      await cargar()
    } catch (e: any) {
      toast.error(e.message || 'Error')
    } finally {
      setSaving(false)
    }
  }

  // Estado de vencimiento para un servicio activo
  function badgeVencimiento(item: Item) {
    if (!item.fechaVencimiento) return null
    const dias = diasHasta(item.fechaVencimiento)
    if (dias < 0) return <span className="text-label font-semibold px-2 py-0.5 rounded-full bg-danger-soft text-danger">Vencido hace {Math.abs(dias)} d</span>
    if (dias <= config.diasAlerta) return <span className="text-label font-semibold px-2 py-0.5 rounded-full bg-warning-soft text-warning">Vence en {dias} d</span>
    return <span className="text-label font-semibold px-2 py-0.5 rounded-full bg-success-soft text-success">Vigente</span>
  }

  if (loading) {
    return (
      <div className="space-y-section">
        <PageHeader
          title="Domicilios en sede"
          description="Sociedades con domicilio legal de QMS."
          breadcrumbs={[{ label: 'Hoy', href: '/dashboard/admin' }, { label: 'Domicilios' }]}
        />
        <PageSkeleton cards={2} />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto text-ink">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-11 w-11 rounded-control bg-primary flex items-center justify-center">
          <Building className="h-6 w-6 text-on-primary" />
        </div>
        <div>
          <h1 className="text-title font-semibold text-ink">Domicilios en Sede</h1>
          <p className="text-body-sm text-ink-2">Clientes con domicilio legal en la oficina · vencimientos y renovaciones</p>
        </div>
      </div>

      {/* Parámetros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-control border bg-surface p-4">
          <p className="text-label text-ink-2">Direcciones de la sede</p>
          {config.direcciones.length > 0 ? (
            <ul className="text-body-sm font-semibold text-ink list-disc list-inside">
              {config.direcciones.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          ) : (
            <p className="text-body-sm font-semibold text-ink">— (configuralas)</p>
          )}
        </div>
        <div className="rounded-control border bg-surface p-4">
          <p className="text-label text-ink-2">Precio anual (default)</p>
          <p className="text-body-sm font-semibold text-ink">{config.precioAnual ? fmt(config.precioAnual) : '— (configuralo)'}</p>
        </div>
        <div className="rounded-control border bg-surface p-4">
          <p className="text-label text-ink-2">Alerta de vencimiento</p>
          <p className="text-body-sm font-semibold text-ink">{config.diasAlerta} días antes</p>
        </div>
      </div>

      {/* Cargar sociedad existente */}
      <Card className="mb-6">
        <CardHeader><CardTitle variant="section">Cargar una sociedad que ya contrató</CardTitle></CardHeader>
        <CardContent>
          <p className="text-body-sm text-ink-2 mb-3">Para clientes a los que ya les ofreciste y aceptaron: elegí la sociedad y cargá el vencimiento.</p>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="text-body-sm font-medium text-ink">Sociedad</label>
              <select
                value={nuevo.tramiteId}
                onChange={(e) => setNuevo({ ...nuevo, tramiteId: e.target.value })}
                className="mt-1 flex h-10 w-full rounded-chip border border-line-strong bg-surface px-3 text-body-sm text-ink"
              >
                <option value="">— Elegí una sociedad —</option>
                {disponibles.map((d) => (
                  <option key={d.id} value={d.id}>{d.denominacion} — {d.cliente}{d.inscripta ? ' (inscripta)' : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-body-sm font-medium text-ink">Dirección</label>
              <select
                value={nuevo.direccion}
                onChange={(e) => setNuevo({ ...nuevo, direccion: e.target.value })}
                className="mt-1 flex h-10 w-full rounded-chip border border-line-strong bg-surface px-3 text-body-sm text-ink"
              >
                <option value="">{config.direcciones[0] ? `(default: ${config.direcciones[0]})` : '— elegí —'}</option>
                {config.direcciones.map((d, i) => <option key={i} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-body-sm font-medium text-ink">Monto anual</label>
              <Input type="number" value={nuevo.monto} onChange={(e) => setNuevo({ ...nuevo, monto: e.target.value })} placeholder={String(config.precioAnual || 0)} className="mt-1 text-ink" />
            </div>
            <div>
              <label className="text-body-sm font-medium text-ink">Inicio</label>
              <Input type="date" value={nuevo.fechaInicio} onChange={(e) => setNuevo({ ...nuevo, fechaInicio: e.target.value, fechaVencimiento: masUnAnioISO(e.target.value) })} className="mt-1 text-ink" />
            </div>
            <div>
              <label className="text-body-sm font-medium text-ink">Vencimiento</label>
              <Input type="date" value={nuevo.fechaVencimiento} onChange={(e) => setNuevo({ ...nuevo, fechaVencimiento: e.target.value })} className="mt-1 text-ink" />
            </div>
          </div>
          <div className="mt-3">
            <Button onClick={agregarExistente} disabled={saving} className="gap-2"><CheckCircle2 className="h-4 w-4" /> Cargar servicio</Button>
          </div>
        </CardContent>
      </Card>

      {/* Pendientes de contactar */}
      <Card className="mb-6">
        <CardHeader><CardTitle variant="section">Pendientes de contactar ({pendientes.length})</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          {pendientes.length === 0 ? (
            <p className="text-body-sm text-ink-2 py-2">No hay solicitudes pendientes.</p>
          ) : (
            <table className="w-full text-body-sm text-ink">
              <thead><tr className="text-left text-ink-2 border-b"><th className="py-2 pr-3">Cliente</th><th className="pr-3">Sociedad</th><th className="pr-3">Solicitó</th><th></th></tr></thead>
              <tbody>
                {pendientes.map((i) => (
                  <tr key={i.id} className="border-b last:border-0 align-top">
                    <td className="py-2 pr-3">
                      <div className="font-medium text-ink">{i.tramite.cliente}</div>
                      {i.tramite.email && <div className="text-label text-ink-2">{i.tramite.email}</div>}
                    </td>
                    <td className="pr-3">
                      <Link href={`/dashboard/admin/tramites/${i.tramite.id}`} className="text-primary hover:underline inline-flex items-center gap-1">
                        {i.tramite.denominacion} <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                    <td className="pr-3 text-ink-2 whitespace-nowrap">{fmtFecha(i.createdAt)}</td>
                    <td className="text-right">
                      {activando?.id === i.id ? (
                        <div className="flex items-center gap-2 justify-end flex-wrap">
                          <select value={activando.direccion} onChange={(e) => setActivando({ ...activando, direccion: e.target.value })} className="h-8 rounded-chip border border-line-strong bg-surface px-2 text-label text-ink">
                            <option value="">Dirección…</option>
                            {config.direcciones.map((d, idx) => <option key={idx} value={d}>{d}</option>)}
                          </select>
                          <span className="text-ink-2 text-label">$</span>
                          <Input type="number" value={activando.monto} onChange={(e) => setActivando({ ...activando, monto: e.target.value })} className="h-8 w-28 text-ink" />
                          <Button size="sm" disabled={saving} onClick={() => accion(i.id, { accion: 'activar', montoAnual: Number(activando.monto), direccion: activando.direccion || undefined }, 'Servicio activado')} className="gap-1"><CheckCircle2 className="h-4 w-4" /> Confirmar</Button>
                          <Button size="sm" variant="outline" onClick={() => setActivando(null)}>Cancelar</Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 justify-end">
                          <Button size="sm" onClick={() => setActivando({ id: i.id, monto: String(config.precioAnual || ''), direccion: config.direcciones[0] || '' })} className="gap-1"><CheckCircle2 className="h-4 w-4" /> Activar</Button>
                          <Button size="sm" variant="outline" disabled={saving} onClick={() => accion(i.id, { accion: 'cancelar' }, 'Marcado como no contratado')} className="gap-1 text-ink-2"><XCircle className="h-4 w-4" /> No contrató</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Activos */}
      <Card className="mb-6">
        <CardHeader><CardTitle variant="section">Activos ({activos.length})</CardTitle></CardHeader>
        <CardContent>
          {activos.length === 0 ? (
            <p className="text-body-sm text-ink-2 py-2">No hay servicios activos.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {activos.map((i) => (
                <div key={i.id} className="rounded-control border border-line bg-surface p-card shadow-raise hover:shadow-raise transition">
                  {editando?.id === i.id ? (
                    /* ---- Modo edición ---- */
                    <div className="space-y-3">
                      <p className="font-semibold text-ink">{i.tramite.denominacion}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-label font-medium text-ink-2">Dirección</label>
                          <select value={editando.direccion} onChange={(e) => setEditando({ ...editando, direccion: e.target.value })} className="mt-1 flex h-10 w-full rounded-chip border border-line-strong bg-surface px-3 text-body-sm text-ink">
                            <option value="">— sin dirección —</option>
                            {config.direcciones.map((d, idx) => <option key={idx} value={d}>{d}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-label font-medium text-ink-2">Monto anual</label>
                          <Input type="number" value={editando.monto} onChange={(e) => setEditando({ ...editando, monto: e.target.value })} className="mt-1 text-ink" />
                        </div>
                        <div>
                          <label className="text-label font-medium text-ink-2">Vencimiento</label>
                          <Input type="date" value={editando.fechaVencimiento} onChange={(e) => setEditando({ ...editando, fechaVencimiento: e.target.value })} className="mt-1 text-ink" />
                        </div>
                        <div>
                          <label className="text-label font-medium text-ink-2">Notas</label>
                          <Input value={editando.notas} onChange={(e) => setEditando({ ...editando, notas: e.target.value })} className="mt-1 text-ink" placeholder="Opcional" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" disabled={saving} onClick={() => accion(i.id, { accion: 'editar', direccion: editando.direccion || null, montoAnual: editando.monto !== '' ? Number(editando.monto) : null, fechaVencimiento: editando.fechaVencimiento, notas: editando.notas }, 'Cambios guardados')} className="gap-1"><CheckCircle2 className="h-4 w-4" /> Guardar</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditando(null)} className="text-ink-2">Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    /* ---- Modo vista ---- */
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link href={`/dashboard/admin/tramites/${i.tramite.id}`} className="font-semibold text-ink hover:text-primary truncate block">{i.tramite.denominacion}</Link>
                          <p className="text-body-sm text-ink-2 truncate">{i.tramite.cliente}{i.tramite.email ? ` · ${i.tramite.email}` : ''}</p>
                        </div>
                        {badgeVencimiento(i)}
                      </div>

                      <div className="mt-4 flex items-center gap-2 text-body-sm text-ink">
                        <MapPin className="h-4 w-4 text-primary shrink-0" />
                        <span className="truncate">{i.direccion || <span className="text-warning">Sin dirección asignada</span>}</span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 rounded-control bg-surface-2 p-3 text-body-sm">
                        <div>
                          <p className="text-label text-ink-2">Monto anual</p>
                          <p className="font-semibold text-ink">{i.montoAnual != null ? fmt(i.montoAnual) : '—'}</p>
                        </div>
                        <div>
                          <p className="text-label text-ink-2 flex items-center gap-1"><CalendarClock className="h-3 w-3" /> Vence</p>
                          <p className="font-semibold text-ink">{fmtFecha(i.fechaVencimiento)}</p>
                        </div>
                        <div>
                          <p className="text-label text-ink-2">Inicio</p>
                          <p className="text-ink-2">{fmtFecha(i.fechaInicio)}</p>
                        </div>
                        <div>
                          <p className="text-label text-ink-2">Último cobro</p>
                          <p className="text-ink-2">{fmtFecha(i.ultimoCobro)}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button size="sm" disabled={saving} onClick={() => accion(i.id, { accion: 'renovar' }, 'Renovado 1 año')} className="gap-1"><RefreshCw className="h-4 w-4" /> Renovar 1 año</Button>
                        <Button size="sm" variant="outline" disabled={saving} onClick={() => accion(i.id, { accion: 'pagar' }, 'Cobro registrado')} className="gap-1 text-ink-2" title="Registrar cobro sin extender la fecha"><DollarSign className="h-4 w-4" /> Cobrado</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditando({ id: i.id, direccion: i.direccion || '', monto: i.montoAnual != null ? String(i.montoAnual) : '', fechaVencimiento: toDateInput(i.fechaVencimiento), notas: i.notas || '' })} className="gap-1 text-ink-2"><Pencil className="h-4 w-4" /> Editar</Button>
                        <Button size="sm" variant="outline" disabled={saving} onClick={() => accion(i.id, { accion: 'cancelar' }, 'Servicio dado de baja')} className="gap-1 text-ink-2"><XCircle className="h-4 w-4" /> Baja</Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancelados / no contrataron */}
      {cancelados.length > 0 && (
        <Card>
          <CardHeader><CardTitle variant="section">Cancelados / no contrataron ({cancelados.length})</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-body-sm text-ink">
              <thead><tr className="text-left text-ink-2 border-b"><th className="py-2 pr-3">Cliente</th><th className="pr-3">Sociedad</th><th></th></tr></thead>
              <tbody>
                {cancelados.map((i) => (
                  <tr key={i.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 text-ink">{i.tramite.cliente}</td>
                    <td className="pr-3"><Link href={`/dashboard/admin/tramites/${i.tramite.id}`} className="text-primary hover:underline">{i.tramite.denominacion}</Link></td>
                    <td className="text-right"><Button size="sm" variant="outline" disabled={saving} onClick={() => accion(i.id, { accion: 'activar', montoAnual: config.precioAnual, direccion: config.direcciones[0] || undefined }, 'Reactivado')} className="text-ink-2">Reactivar</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
