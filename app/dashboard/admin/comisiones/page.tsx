'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Coins, RefreshCw, Plus, Trash2, CheckCircle2, Clock, Download } from 'lucide-react'
import {
  calcularReparto,
  totalizar,
  ORIGINADOR_LABEL,
  BENEFICIARIO_LABEL,
  PORCENTAJES_DEFAULT,
  type Originador,
  type Beneficiario,
  type Porcentajes,
} from '@/lib/comisiones'

type Movimiento = {
  id: string
  fecha: string
  cliente: string
  asunto: string
  monto: number
  originador: Originador
  origen: 'PAGO' | 'MANUAL'
  pagoId: string | null
  tramiteId: string | null
  notas: string | null
}
type Liquidacion = { periodo: string; beneficiario: Beneficiario; monto: number; pagado: boolean; fechaPago: string | null }
type Distribucion = { id: string; fecha: string; beneficiario: Beneficiario; monto: number; notas: string | null }

const fmt = (n: number) =>
  '$' + (Math.round(n * 100) / 100).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
const fmtFecha = (iso: string) => new Date(iso).toLocaleDateString('es-AR')
const periodoDeISO = (iso: string) => {
  const d = new Date(iso)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}
const ORIGINADORES: Originador[] = ['NINGUNO', 'FERNANDO', 'JUSTINIANO', 'MW']

export default function ComisionesPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'movimientos' | 'liquidacion' | 'fondo'>('movimientos')

  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([])
  const [distribuciones, setDistribuciones] = useState<Distribucion[]>([])
  const [porcentajes, setPorcentajes] = useState<Porcentajes>(PORCENTAJES_DEFAULT)

  const hoy = new Date()
  const periodoActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`

  // Form movimiento manual
  const [nuevo, setNuevo] = useState({ fecha: hoy.toISOString().slice(0, 10), cliente: '', asunto: '', monto: '', originador: 'NINGUNO' as Originador, notas: '' })
  // Form distribución fondo
  const [dist, setDist] = useState({ fecha: hoy.toISOString().slice(0, 10), beneficiario: 'FERNANDO' as Beneficiario, monto: '', notas: '' })
  const [periodoSel, setPeriodoSel] = useState(periodoActual)

  async function cargar() {
    try {
      const res = await fetch('/api/admin/comisiones')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setMovimientos(data.movimientos)
      setLiquidaciones(data.liquidaciones)
      setDistribuciones(data.distribucionesFondo)
      setPorcentajes(data.porcentajes)
    } catch {
      toast.error('Error al cargar comisiones')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { cargar() }, [])

  // Períodos disponibles (de los movimientos), incluyendo el actual
  const periodos = useMemo(() => {
    const set = new Set<string>(movimientos.map((m) => periodoDeISO(m.fecha)))
    set.add(periodoActual)
    return Array.from(set).sort().reverse()
  }, [movimientos, periodoActual])

  const movsPeriodo = useMemo(
    () => movimientos.filter((m) => periodoDeISO(m.fecha) === periodoSel),
    [movimientos, periodoSel]
  )
  const totales = useMemo(() => totalizar(movsPeriodo, porcentajes), [movsPeriodo, porcentajes])
  const totalesHistorico = useMemo(() => totalizar(movimientos, porcentajes), [movimientos, porcentajes])

  const distFernando = distribuciones.filter((d) => d.beneficiario === 'FERNANDO').reduce((a, d) => a + d.monto, 0)
  const distJustiniano = distribuciones.filter((d) => d.beneficiario === 'JUSTINIANO').reduce((a, d) => a + d.monto, 0)

  async function sincronizar() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/comisiones/sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.creados > 0 ? `${data.creados} pago(s) importado(s)` : 'No hay pagos nuevos para importar')
      await cargar()
    } catch (e: any) {
      toast.error(e.message || 'Error al sincronizar')
    } finally {
      setSaving(false)
    }
  }

  async function agregarMovimiento() {
    if (!nuevo.cliente.trim() || !nuevo.asunto.trim() || !(Number(nuevo.monto) > 0)) {
      toast.error('Completá cliente, asunto y un monto válido')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/comisiones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...nuevo, monto: Number(nuevo.monto) }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Movimiento agregado')
      setNuevo({ fecha: hoy.toISOString().slice(0, 10), cliente: '', asunto: '', monto: '', originador: 'NINGUNO', notas: '' })
      await cargar()
    } catch (e: any) {
      toast.error(e.message || 'Error al agregar')
    } finally {
      setSaving(false)
    }
  }

  async function cambiarOriginador(id: string, originador: Originador) {
    // Optimista
    setMovimientos((prev) => prev.map((m) => (m.id === id ? { ...m, originador } : m)))
    try {
      const res = await fetch(`/api/admin/comisiones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originador }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
    } catch (e: any) {
      toast.error(e.message || 'Error al actualizar')
      cargar()
    }
  }

  async function eliminarMovimiento(id: string) {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/comisiones/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Movimiento quitado')
      await cargar()
    } catch (e: any) {
      toast.error(e.message || 'Error al eliminar')
    } finally {
      setSaving(false)
    }
  }

  async function marcarPagado(beneficiario: Beneficiario, monto: number, pagado: boolean) {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/comisiones/liquidacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodo: periodoSel, beneficiario, monto, pagado }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success(pagado ? 'Marcado como pagado' : 'Marcado como pendiente')
      await cargar()
    } catch (e: any) {
      toast.error(e.message || 'Error')
    } finally {
      setSaving(false)
    }
  }

  async function agregarDistribucion() {
    if (!(Number(dist.monto) > 0)) {
      toast.error('Ingresá un monto válido')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/comisiones/fondo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...dist, monto: Number(dist.monto) }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Distribución registrada')
      setDist({ fecha: hoy.toISOString().slice(0, 10), beneficiario: 'FERNANDO', monto: '', notas: '' })
      await cargar()
    } catch (e: any) {
      toast.error(e.message || 'Error')
    } finally {
      setSaving(false)
    }
  }

  async function eliminarDistribucion(id: string) {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/comisiones/fondo?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error)
      await cargar()
    } catch (e: any) {
      toast.error(e.message || 'Error')
    } finally {
      setSaving(false)
    }
  }

  function exportarCSV() {
    const headers = ['Fecha', 'Cliente', 'Asunto', 'Origen', 'Monto', 'Originador', 'ComisionOrig', 'MW', 'Operador', 'FondoFernando', 'FondoJustiniano']
    const rows = movsPeriodo.map((m) => {
      const r = calcularReparto(m.monto, m.originador, porcentajes)
      return [fmtFecha(m.fecha), m.cliente, m.asunto, m.origen, m.monto, ORIGINADOR_LABEL[m.originador], r.comisionOriginacion, r.mw, r.operadorFernando, r.fondoFernando, r.fondoJustiniano]
    })
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `liquidacion_${periodoSel}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const liqDe = (b: Beneficiario) => liquidaciones.find((l) => l.periodo === periodoSel && l.beneficiario === b)

  if (loading) {
    return <div className="p-8 text-gray-500">Cargando…</div>
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto text-gray-900">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-brand-700 flex items-center justify-center">
            <Coins className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Liquidación de Comisiones</h1>
            <p className="text-sm text-gray-500">Distribución de ingresos según el contrato asociativo (cláusula 4)</p>
          </div>
        </div>
        <Button onClick={sincronizar} disabled={saving} variant="outline" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} /> Sincronizar honorarios cobrados
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {([['movimientos', 'Movimientos'], ['liquidacion', 'Liquidación'], ['fondo', 'Fondo de Desarrollo']] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition ${
              tab === k ? 'border-brand-700 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ===================== MOVIMIENTOS ===================== */}
      {tab === 'movimientos' && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle variant="section">Agregar movimiento manual</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                <div><Label>Fecha</Label><Input type="date" value={nuevo.fecha} onChange={(e) => setNuevo({ ...nuevo, fecha: e.target.value })} /></div>
                <div className="md:col-span-2"><Label>Cliente</Label><Input value={nuevo.cliente} onChange={(e) => setNuevo({ ...nuevo, cliente: e.target.value })} placeholder="Nombre del cliente" /></div>
                <div><Label>Asunto</Label><Input value={nuevo.asunto} onChange={(e) => setNuevo({ ...nuevo, asunto: e.target.value })} placeholder="Mensualización, etc." /></div>
                <div><Label>Honorario (sin gastos)</Label><Input type="number" value={nuevo.monto} onChange={(e) => setNuevo({ ...nuevo, monto: e.target.value })} placeholder="0" /></div>
                <div>
                  <Label>Originador</Label>
                  <select value={nuevo.originador} onChange={(e) => setNuevo({ ...nuevo, originador: e.target.value as Originador })} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900">
                    {ORIGINADORES.map((o) => <option key={o} value={o}>{ORIGINADOR_LABEL[o]}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-3">
                <Button onClick={agregarMovimiento} disabled={saving} className="gap-2"><Plus className="h-4 w-4" /> Agregar</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle variant="section">Movimientos ({movimientos.length})</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm text-gray-800">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="py-2 pr-3">Fecha</th><th className="pr-3">Cliente</th><th className="pr-3">Asunto</th>
                    <th className="pr-3">Origen</th><th className="pr-3 text-right">Honorario</th><th className="pr-3">Originador</th>
                    <th className="pr-3 text-right">Com. orig.</th><th className="pr-3 text-right">MW</th><th className="pr-3 text-right">Operador</th>
                    <th className="pr-3 text-right">Fondo F</th><th className="pr-3 text-right">Fondo J</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.length === 0 && (
                    <tr><td colSpan={12} className="py-6 text-center text-gray-500">Sin movimientos. Sincronizá los honorarios cobrados o agregá uno manual.</td></tr>
                  )}
                  {movimientos.map((m) => {
                    const r = calcularReparto(m.monto, m.originador, porcentajes)
                    return (
                      <tr key={m.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-2 pr-3 whitespace-nowrap">{fmtFecha(m.fecha)}</td>
                        <td className="pr-3">{m.cliente}</td>
                        <td className="pr-3">{m.asunto}</td>
                        <td className="pr-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${m.origen === 'PAGO' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{m.origen === 'PAGO' ? 'Sistema' : 'Manual'}</span>
                        </td>
                        <td className="pr-3 text-right font-medium whitespace-nowrap">{fmt(m.monto)}</td>
                        <td className="pr-3">
                          <select value={m.originador} onChange={(e) => cambiarOriginador(m.id, e.target.value as Originador)} className="h-8 rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-900">
                            {ORIGINADORES.map((o) => <option key={o} value={o}>{ORIGINADOR_LABEL[o]}</option>)}
                          </select>
                        </td>
                        <td className="pr-3 text-right whitespace-nowrap">{r.comisionOriginacion ? fmt(r.comisionOriginacion) : '—'}</td>
                        <td className="pr-3 text-right whitespace-nowrap">{fmt(r.mw)}</td>
                        <td className="pr-3 text-right whitespace-nowrap">{fmt(r.operadorFernando)}</td>
                        <td className="pr-3 text-right whitespace-nowrap text-gray-600">{fmt(r.fondoFernando)}</td>
                        <td className="pr-3 text-right whitespace-nowrap text-gray-600">{fmt(r.fondoJustiniano)}</td>
                        <td className="text-right">
                          <button onClick={() => eliminarMovimiento(m.id)} className="text-gray-500 hover:text-red-600 p-1" title={m.origen === 'PAGO' ? 'Quitar de comisiones (no cuenta para el reparto)' : 'Eliminar'}><Trash2 className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===================== LIQUIDACIÓN ===================== */}
      {tab === 'liquidacion' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 flex-wrap">
            <Label className="mb-0">Período:</Label>
            <select value={periodoSel} onChange={(e) => setPeriodoSel(e.target.value)} className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-900">
              {periodos.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <span className="text-sm text-gray-500">Ingreso bruto: <strong className="text-gray-900">{fmt(totales.ingresoBruto)}</strong></span>
            <Button onClick={exportarCSV} variant="outline" size="sm" className="gap-2 ml-auto"><Download className="h-4 w-4" /> Exportar CSV</Button>
          </div>

          <Card>
            <CardHeader><CardTitle variant="section">A pagar — {periodoSel}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(['FERNANDO', 'MW', 'JUSTINIANO'] as Beneficiario[]).map((b) => {
                  const monto = b === 'FERNANDO' ? totales.aPagarFernando : b === 'MW' ? totales.aPagarMw : totales.aPagarJustiniano
                  const liq = liqDe(b)
                  const pagado = !!liq?.pagado
                  return (
                    <div key={b} className={`flex items-center justify-between rounded-lg border p-4 ${pagado ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                      <div>
                        <p className="font-semibold text-gray-900">{BENEFICIARIO_LABEL[b]}</p>
                        {pagado && liq?.fechaPago && <p className="text-xs text-green-700">Pagado el {fmtFecha(liq.fechaPago)}</p>}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-bold text-gray-900">{fmt(monto)}</span>
                        <Button
                          size="sm"
                          variant={pagado ? 'outline' : 'default'}
                          disabled={saving || monto <= 0}
                          onClick={() => marcarPagado(b, monto, !pagado)}
                          className="gap-2"
                        >
                          {pagado ? <><Clock className="h-4 w-4" /> Marcar pendiente</> : <><CheckCircle2 className="h-4 w-4" /> Marcar pagado</>}
                        </Button>
                      </div>
                    </div>
                  )
                })}
                <div className="flex justify-between border-t pt-3 text-sm">
                  <span className="font-semibold text-gray-900">Subtotal a pagar</span>
                  <span className="font-bold text-gray-900">{fmt(totales.subtotalPagable)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle variant="section">Fondo de Desarrollo del período (acumula, no se paga)</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between rounded-lg bg-gray-50 p-3"><span className="text-gray-700">Fondo Fernando (12%)</span><strong className="text-gray-900">{fmt(totales.fondoFernando)}</strong></div>
                <div className="flex justify-between rounded-lg bg-gray-50 p-3"><span className="text-gray-700">Fondo Justiniano (8%)</span><strong className="text-gray-900">{fmt(totales.fondoJustiniano)}</strong></div>
              </div>
              <p className={`text-sm mt-3 ${Math.abs(totales.ingresoBruto - totales.subtotalPagable - totales.subtotalFondo) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                Control: bruto − pagable − fondo = {fmt(totales.ingresoBruto - totales.subtotalPagable - totales.subtotalFondo)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===================== FONDO ===================== */}
      {tab === 'fondo' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['FERNANDO', 'JUSTINIANO'] as Beneficiario[]).map((b) => {
              const acum = b === 'FERNANDO' ? totalesHistorico.fondoFernando : totalesHistorico.fondoJustiniano
              const distrib = b === 'FERNANDO' ? distFernando : distJustiniano
              return (
                <Card key={b}>
                  <CardHeader><CardTitle variant="section">Fondo {BENEFICIARIO_LABEL[b]}</CardTitle></CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Acumulado histórico</span><span className="text-gray-900">{fmt(acum)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Distribuido</span><span className="text-gray-900">− {fmt(distrib)}</span></div>
                    <div className="flex justify-between border-t pt-1 font-bold"><span className="text-gray-900">Saldo disponible</span><span className="text-green-700">{fmt(acum - distrib)}</span></div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card>
            <CardHeader><CardTitle variant="section">Registrar distribución acordada</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                <div><Label>Fecha</Label><Input type="date" value={dist.fecha} onChange={(e) => setDist({ ...dist, fecha: e.target.value })} /></div>
                <div>
                  <Label>Beneficiario</Label>
                  <select value={dist.beneficiario} onChange={(e) => setDist({ ...dist, beneficiario: e.target.value as Beneficiario })} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900">
                    <option value="FERNANDO">Fernando</option>
                    <option value="JUSTINIANO">Justiniano</option>
                  </select>
                </div>
                <div><Label>Monto</Label><Input type="number" value={dist.monto} onChange={(e) => setDist({ ...dist, monto: e.target.value })} placeholder="0" /></div>
                <div className="md:col-span-1"><Label>Nota</Label><Input value={dist.notas} onChange={(e) => setDist({ ...dist, notas: e.target.value })} placeholder="Acuerdo…" /></div>
                <div><Button onClick={agregarDistribucion} disabled={saving} className="gap-2 w-full"><Plus className="h-4 w-4" /> Registrar</Button></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle variant="section">Distribuciones registradas</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm text-gray-800">
                <thead><tr className="text-left text-gray-600 border-b"><th className="py-2 pr-3">Fecha</th><th className="pr-3">Beneficiario</th><th className="pr-3 text-right">Monto</th><th className="pr-3">Nota</th><th></th></tr></thead>
                <tbody>
                  {distribuciones.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-gray-500">Sin distribuciones registradas.</td></tr>}
                  {distribuciones.map((d) => (
                    <tr key={d.id} className="border-b last:border-0">
                      <td className="py-2 pr-3">{fmtFecha(d.fecha)}</td>
                      <td className="pr-3">{BENEFICIARIO_LABEL[d.beneficiario]}</td>
                      <td className="pr-3 text-right">{fmt(d.monto)}</td>
                      <td className="pr-3 text-gray-600">{d.notas || '—'}</td>
                      <td className="text-right"><button onClick={() => eliminarDistribucion(d.id)} className="text-gray-500 hover:text-red-600 p-1"><Trash2 className="h-4 w-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
