'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Building, CheckCircle2, RefreshCw, XCircle, DollarSign, ExternalLink } from 'lucide-react'

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

export default function DomiciliosPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [config, setConfig] = useState<ConfigDom>({ direcciones: [], precioAnual: 0, diasAlerta: 30 })
  const [disponibles, setDisponibles] = useState<Disponible[]>([])
  const [activando, setActivando] = useState<{ id: string; monto: string; direccion: string } | null>(null)
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
    if (dias < 0) return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Vencido hace {Math.abs(dias)} d</span>
    if (dias <= config.diasAlerta) return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Vence en {dias} d</span>
    return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Vigente</span>
  }

  if (loading) return <div className="p-8 text-gray-600">Cargando…</div>

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto text-gray-900">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-11 w-11 rounded-xl bg-brand-700 flex items-center justify-center">
          <Building className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Domicilios en Sede</h1>
          <p className="text-sm text-gray-500">Clientes con domicilio legal en la oficina · vencimientos y renovaciones</p>
        </div>
      </div>

      {/* Parámetros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-gray-500">Direcciones de la sede</p>
          {config.direcciones.length > 0 ? (
            <ul className="text-sm font-semibold text-gray-900 list-disc list-inside">
              {config.direcciones.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          ) : (
            <p className="text-sm font-semibold text-gray-900">— (configuralas)</p>
          )}
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-gray-500">Precio anual (default)</p>
          <p className="text-sm font-semibold text-gray-900">{config.precioAnual ? fmt(config.precioAnual) : '— (configuralo)'}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-gray-500">Alerta de vencimiento</p>
          <p className="text-sm font-semibold text-gray-900">{config.diasAlerta} días antes</p>
        </div>
      </div>

      {/* Cargar sociedad existente */}
      <Card className="mb-6">
        <CardHeader><CardTitle variant="section">Cargar una sociedad que ya contrató</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-3">Para clientes a los que ya les ofreciste y aceptaron: elegí la sociedad y cargá el vencimiento.</p>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-900">Sociedad</label>
              <select
                value={nuevo.tramiteId}
                onChange={(e) => setNuevo({ ...nuevo, tramiteId: e.target.value })}
                className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
              >
                <option value="">— Elegí una sociedad —</option>
                {disponibles.map((d) => (
                  <option key={d.id} value={d.id}>{d.denominacion} — {d.cliente}{d.inscripta ? ' (inscripta)' : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-900">Dirección</label>
              <select
                value={nuevo.direccion}
                onChange={(e) => setNuevo({ ...nuevo, direccion: e.target.value })}
                className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
              >
                <option value="">{config.direcciones[0] ? `(default: ${config.direcciones[0]})` : '— elegí —'}</option>
                {config.direcciones.map((d, i) => <option key={i} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-900">Monto anual</label>
              <Input type="number" value={nuevo.monto} onChange={(e) => setNuevo({ ...nuevo, monto: e.target.value })} placeholder={String(config.precioAnual || 0)} className="mt-1 text-gray-900" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-900">Inicio</label>
              <Input type="date" value={nuevo.fechaInicio} onChange={(e) => setNuevo({ ...nuevo, fechaInicio: e.target.value, fechaVencimiento: masUnAnioISO(e.target.value) })} className="mt-1 text-gray-900" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-900">Vencimiento</label>
              <Input type="date" value={nuevo.fechaVencimiento} onChange={(e) => setNuevo({ ...nuevo, fechaVencimiento: e.target.value })} className="mt-1 text-gray-900" />
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
            <p className="text-sm text-gray-500 py-2">No hay solicitudes pendientes.</p>
          ) : (
            <table className="w-full text-sm text-gray-800">
              <thead><tr className="text-left text-gray-600 border-b"><th className="py-2 pr-3">Cliente</th><th className="pr-3">Sociedad</th><th className="pr-3">Solicitó</th><th></th></tr></thead>
              <tbody>
                {pendientes.map((i) => (
                  <tr key={i.id} className="border-b last:border-0 align-top">
                    <td className="py-2 pr-3">
                      <div className="font-medium text-gray-900">{i.tramite.cliente}</div>
                      {i.tramite.email && <div className="text-xs text-gray-500">{i.tramite.email}</div>}
                    </td>
                    <td className="pr-3">
                      <Link href={`/dashboard/admin/tramites/${i.tramite.id}`} className="text-brand-700 hover:underline inline-flex items-center gap-1">
                        {i.tramite.denominacion} <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                    <td className="pr-3 text-gray-600 whitespace-nowrap">{fmtFecha(i.createdAt)}</td>
                    <td className="text-right">
                      {activando?.id === i.id ? (
                        <div className="flex items-center gap-2 justify-end flex-wrap">
                          <select value={activando.direccion} onChange={(e) => setActivando({ ...activando, direccion: e.target.value })} className="h-8 rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-900">
                            <option value="">Dirección…</option>
                            {config.direcciones.map((d, idx) => <option key={idx} value={d}>{d}</option>)}
                          </select>
                          <span className="text-gray-600 text-xs">$</span>
                          <Input type="number" value={activando.monto} onChange={(e) => setActivando({ ...activando, monto: e.target.value })} className="h-8 w-28 text-gray-900" />
                          <Button size="sm" disabled={saving} onClick={() => accion(i.id, { accion: 'activar', montoAnual: Number(activando.monto), direccion: activando.direccion || undefined }, 'Servicio activado')} className="gap-1"><CheckCircle2 className="h-4 w-4" /> Confirmar</Button>
                          <Button size="sm" variant="outline" onClick={() => setActivando(null)}>Cancelar</Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 justify-end">
                          <Button size="sm" onClick={() => setActivando({ id: i.id, monto: String(config.precioAnual || ''), direccion: config.direcciones[0] || '' })} className="gap-1"><CheckCircle2 className="h-4 w-4" /> Activar</Button>
                          <Button size="sm" variant="outline" disabled={saving} onClick={() => accion(i.id, { accion: 'cancelar' }, 'Marcado como no contratado')} className="gap-1 text-gray-700"><XCircle className="h-4 w-4" /> No contrató</Button>
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
        <CardContent className="overflow-x-auto">
          {activos.length === 0 ? (
            <p className="text-sm text-gray-500 py-2">No hay servicios activos.</p>
          ) : (
            <table className="w-full text-sm text-gray-800">
              <thead><tr className="text-left text-gray-600 border-b"><th className="py-2 pr-3">Cliente</th><th className="pr-3">Sociedad</th><th className="pr-3">Dirección</th><th className="pr-3 text-right">Monto anual</th><th className="pr-3">Inicio</th><th className="pr-3">Vencimiento</th><th className="pr-3">Últ. cobro</th><th></th></tr></thead>
              <tbody>
                {activos.map((i) => (
                  <tr key={i.id} className="border-b last:border-0">
                    <td className="py-2 pr-3">
                      <div className="font-medium text-gray-900">{i.tramite.cliente}</div>
                      {i.tramite.email && <div className="text-xs text-gray-500">{i.tramite.email}</div>}
                    </td>
                    <td className="pr-3">
                      <Link href={`/dashboard/admin/tramites/${i.tramite.id}`} className="text-brand-700 hover:underline">{i.tramite.denominacion}</Link>
                    </td>
                    <td className="pr-3 text-gray-700">{i.direccion || '—'}</td>
                    <td className="pr-3 text-right text-gray-900 whitespace-nowrap">{i.montoAnual != null ? fmt(i.montoAnual) : '—'}</td>
                    <td className="pr-3 text-gray-700 whitespace-nowrap">{fmtFecha(i.fechaInicio)}</td>
                    <td className="pr-3 whitespace-nowrap"><div className="flex items-center gap-2"><span className="text-gray-900">{fmtFecha(i.fechaVencimiento)}</span>{badgeVencimiento(i)}</div></td>
                    <td className="pr-3 text-gray-700 whitespace-nowrap">{fmtFecha(i.ultimoCobro)}</td>
                    <td className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button size="sm" variant="outline" disabled={saving} onClick={() => accion(i.id, { accion: 'pagar' }, 'Cobro registrado')} className="gap-1 text-gray-700" title="Registrar cobro sin extender la fecha"><DollarSign className="h-4 w-4" /> Cobrado</Button>
                        <Button size="sm" disabled={saving} onClick={() => accion(i.id, { accion: 'renovar' }, 'Renovado 1 año')} className="gap-1"><RefreshCw className="h-4 w-4" /> Renovar 1 año</Button>
                        <Button size="sm" variant="outline" disabled={saving} onClick={() => accion(i.id, { accion: 'cancelar' }, 'Servicio dado de baja')} className="gap-1 text-gray-700"><XCircle className="h-4 w-4" /> Baja</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Cancelados / no contrataron */}
      {cancelados.length > 0 && (
        <Card>
          <CardHeader><CardTitle variant="section">Cancelados / no contrataron ({cancelados.length})</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm text-gray-800">
              <thead><tr className="text-left text-gray-600 border-b"><th className="py-2 pr-3">Cliente</th><th className="pr-3">Sociedad</th><th></th></tr></thead>
              <tbody>
                {cancelados.map((i) => (
                  <tr key={i.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 text-gray-900">{i.tramite.cliente}</td>
                    <td className="pr-3"><Link href={`/dashboard/admin/tramites/${i.tramite.id}`} className="text-brand-700 hover:underline">{i.tramite.denominacion}</Link></td>
                    <td className="text-right"><Button size="sm" variant="outline" disabled={saving} onClick={() => accion(i.id, { accion: 'activar', montoAnual: config.precioAnual, direccion: config.direcciones[0] || undefined }, 'Reactivado')} className="text-gray-700">Reactivar</Button></td>
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
