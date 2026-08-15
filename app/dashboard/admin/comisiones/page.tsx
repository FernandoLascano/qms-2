'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { PageSkeleton } from '@/components/ui/states'
import { BarrasMensuales, BarraDistribucion } from '@/components/ui/charts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
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
    return (
      <div className="space-y-section">
        <PageHeader
          title="Comisiones"
          description="Liquidación de comisiones por trámite."
          breadcrumbs={[{ label: 'Hoy', href: '/dashboard/admin' }, { label: 'Comisiones' }]}
        />
        <PageSkeleton cards={2} />
      </div>
    )
  }

  return (
    <div className="stagger space-y-section">
      <PageHeader
        title="Liquidación de"
        destacado="comisiones"
        description="Distribución de ingresos según el contrato asociativo (cláusula 4)."
        breadcrumbs={[{ label: 'Hoy', href: '/dashboard/admin' }, { label: 'Comisiones' }]}
        actions={
          <Button onClick={sincronizar} loading={saving} variant="secondary">
            <RefreshCw className="h-4 w-4" aria-hidden />
            Sincronizar honorarios cobrados
          </Button>
        }
      />

      <ResumenFinanciero
        movimientos={movimientos}
        porcentajes={porcentajes}
        periodoActual={periodoActual}
      />

      <nav aria-label="Secciones" className="border-b border-line">
        <ul className="flex items-center gap-1">
          {([['movimientos', 'Movimientos'], ['liquidacion', 'Liquidación'], ['fondo', 'Fondo de Desarrollo']] as const).map(([k, label]) => (
            <li key={k}>
              <button
                onClick={() => setTab(k)}
                aria-current={tab === k ? 'page' : undefined}
                className={`relative flex h-11 items-center rounded-t-control px-3 text-body-sm transition-colors ${
                  tab === k ? 'font-medium text-primary' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                }`}
              >
                {label}
                {tab === k && (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" aria-hidden />
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

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
                  <Select value={nuevo.originador} onChange={(e) => setNuevo({ ...nuevo, originador: e.target.value as Originador })}>
                    {ORIGINADORES.map((o) => <option key={o} value={o}>{ORIGINADOR_LABEL[o]}</option>)}
                  </Select>
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
              <table className="w-full text-body-sm text-ink">
                <thead>
                  <tr className="text-left text-ink-2 border-b">
                    <th className="py-2 pr-3">Fecha</th><th className="pr-3">Cliente</th><th className="pr-3">Asunto</th>
                    <th className="pr-3">Origen</th><th className="pr-3 text-right">Honorario</th><th className="pr-3">Originador</th>
                    <th className="pr-3 text-right">Com. orig.</th><th className="pr-3 text-right">MW</th><th className="pr-3 text-right">Operador</th>
                    <th className="pr-3 text-right">Fondo F</th><th className="pr-3 text-right">Fondo J</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.length === 0 && (
                    <tr><td colSpan={12} className="py-6 text-center text-ink-2">Sin movimientos. Sincronizá los honorarios cobrados o agregá uno manual.</td></tr>
                  )}
                  {movimientos.map((m) => {
                    const r = calcularReparto(m.monto, m.originador, porcentajes)
                    return (
                      <tr key={m.id} className="border-b last:border-0 hover:bg-surface-2">
                        <td className="py-2 pr-3 whitespace-nowrap">{fmtFecha(m.fecha)}</td>
                        <td className="pr-3">{m.cliente}</td>
                        <td className="pr-3">{m.asunto}</td>
                        <td className="pr-3">
                          <span className={`text-label px-2 py-0.5 rounded-full ${m.origen === 'PAGO' ? 'bg-info-soft text-info' : 'bg-surface-3 text-ink-2'}`}>{m.origen === 'PAGO' ? 'Sistema' : 'Manual'}</span>
                        </td>
                        <td className="pr-3 text-right font-medium whitespace-nowrap">{fmt(m.monto)}</td>
                        <td className="pr-3">
                          <select value={m.originador} onChange={(e) => cambiarOriginador(m.id, e.target.value as Originador)} className="h-8 rounded-chip border border-line-strong bg-surface px-2 text-label text-ink">
                            {ORIGINADORES.map((o) => <option key={o} value={o}>{ORIGINADOR_LABEL[o]}</option>)}
                          </select>
                        </td>
                        <td className="pr-3 text-right whitespace-nowrap">{r.comisionOriginacion ? fmt(r.comisionOriginacion) : '—'}</td>
                        <td className="pr-3 text-right whitespace-nowrap">{fmt(r.mw)}</td>
                        <td className="pr-3 text-right whitespace-nowrap">{fmt(r.operadorFernando)}</td>
                        <td className="pr-3 text-right whitespace-nowrap text-ink-2">{fmt(r.fondoFernando)}</td>
                        <td className="pr-3 text-right whitespace-nowrap text-ink-2">{fmt(r.fondoJustiniano)}</td>
                        <td className="text-right">
                          <button onClick={() => eliminarMovimiento(m.id)} className="text-ink-2 hover:text-danger p-1" title={m.origen === 'PAGO' ? 'Quitar de comisiones (no cuenta para el reparto)' : 'Eliminar'}><Trash2 className="h-4 w-4" /></button>
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
            <select value={periodoSel} onChange={(e) => setPeriodoSel(e.target.value)} className="h-10 rounded-chip border border-line-strong bg-surface px-3 text-body-sm font-medium text-ink">
              {periodos.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <span className="text-body-sm text-ink-2">Ingreso bruto: <strong className="text-ink">{fmt(totales.ingresoBruto)}</strong></span>
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
                    <div key={b} className={`flex items-center justify-between rounded-control border p-4 ${pagado ? 'bg-success-soft border-success-line' : 'bg-surface'}`}>
                      <div>
                        <p className="font-semibold text-ink">{BENEFICIARIO_LABEL[b]}</p>
                        {pagado && liq?.fechaPago && <p className="text-label text-success">Pagado el {fmtFecha(liq.fechaPago)}</p>}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-heading font-semibold text-ink">{fmt(monto)}</span>
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
                <div className="flex justify-between border-t pt-3 text-body-sm">
                  <span className="font-semibold text-ink">Subtotal a pagar</span>
                  <span className="font-semibold text-ink">{fmt(totales.subtotalPagable)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle variant="section">Fondo de Desarrollo del período (acumula, no se paga)</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-body-sm">
                <div className="flex justify-between rounded-control bg-surface-2 p-3"><span className="text-ink-2">Fondo Fernando (12%)</span><strong className="text-ink">{fmt(totales.fondoFernando)}</strong></div>
                <div className="flex justify-between rounded-control bg-surface-2 p-3"><span className="text-ink-2">Fondo Justiniano (8%)</span><strong className="text-ink">{fmt(totales.fondoJustiniano)}</strong></div>
              </div>
              <p className={`text-body-sm mt-3 ${Math.abs(totales.ingresoBruto - totales.subtotalPagable - totales.subtotalFondo) < 0.01 ? 'text-success' : 'text-danger'}`}>
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
                  <CardContent className="space-y-1 text-body-sm">
                    <div className="flex justify-between"><span className="text-ink-2">Acumulado histórico</span><span className="text-ink">{fmt(acum)}</span></div>
                    <div className="flex justify-between"><span className="text-ink-2">Distribuido</span><span className="text-ink">− {fmt(distrib)}</span></div>
                    <div className="flex justify-between border-t pt-1 font-semibold"><span className="text-ink">Saldo disponible</span><span className="text-success">{fmt(acum - distrib)}</span></div>
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
                  <select value={dist.beneficiario} onChange={(e) => setDist({ ...dist, beneficiario: e.target.value as Beneficiario })} className="flex h-10 w-full rounded-chip border border-line-strong bg-surface px-3 text-body-sm text-ink">
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
              <table className="w-full text-body-sm text-ink">
                <thead><tr className="text-left text-ink-2 border-b"><th className="py-2 pr-3">Fecha</th><th className="pr-3">Beneficiario</th><th className="pr-3 text-right">Monto</th><th className="pr-3">Nota</th><th></th></tr></thead>
                <tbody>
                  {distribuciones.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-ink-2">Sin distribuciones registradas.</td></tr>}
                  {distribuciones.map((d) => (
                    <tr key={d.id} className="border-b last:border-0">
                      <td className="py-2 pr-3">{fmtFecha(d.fecha)}</td>
                      <td className="pr-3">{BENEFICIARIO_LABEL[d.beneficiario]}</td>
                      <td className="pr-3 text-right">{fmt(d.monto)}</td>
                      <td className="pr-3 text-ink-2">{d.notas || '—'}</td>
                      <td className="text-right"><button onClick={() => eliminarDistribucion(d.id)} className="text-ink-2 hover:text-danger p-1"><Trash2 className="h-4 w-4" /></button></td>
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

/* ─────────────────────── Resumen financiero ─────────────────────────
   Lo que faltaba para que esto se lea como un módulo de administración y
   no como un formulario con una tabla: cuánto entró, cuánto hay que
   pagar, cómo se reparte y cómo viene el año.                          */

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function ResumenFinanciero({
  movimientos,
  porcentajes,
  periodoActual,
}: {
  movimientos: Movimiento[]
  porcentajes: Porcentajes
  periodoActual: string
}) {
  const delPeriodo = movimientos.filter((m) => periodoDeISO(m.fecha) === periodoActual)
  const tot = totalizar(delPeriodo, porcentajes)
  const totAnual = totalizar(movimientos, porcentajes)
  const ticket = delPeriodo.length ? tot.ingresoBruto / delPeriodo.length : 0

  // Últimos 12 meses de ingreso bruto
  const hoy = new Date()
  const meses = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - (11 - i), 1)
    const clave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const suma = movimientos
      .filter((m) => periodoDeISO(m.fecha) === clave)
      .reduce((acc, m) => acc + m.monto, 0)
    return { label: MESES_CORTOS[d.getMonth()], valor: suma, clave }
  })

  const serie = meses.map((m) => m.valor)

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <TarjetaImporte titulo="Ingreso del mes" valor={tot.ingresoBruto} destacado />
          <TarjetaImporte titulo="A pagar este mes" valor={tot.subtotalPagable} />
          <TarjetaImporte titulo="Fondo de desarrollo" valor={totAnual.subtotalFondo} nota="acumulado" />
          <TarjetaImporte titulo="Honorario promedio" valor={ticket} nota={`${delPeriodo.length} mov.`} />
        </div>

        <Card>
          <CardContent className="p-card">
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <div>
                <h3 className="text-heading text-ink">Ingresos por mes</h3>
                <p className="mt-0.5 text-body-sm text-ink-2">Honorarios cobrados, sin gastos</p>
              </div>
              <span className="text-body-sm text-ink-2">
                Total 12 meses <span className="font-semibold text-ink tnum">{fmt(serie.reduce((a, b) => a + b, 0))}</span>
              </span>
            </div>
            <BarrasMensuales datos={meses} formato={fmt} alto={132} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-5 p-card">
          <div>
            <h3 className="text-heading text-ink">Cómo se reparte</h3>
            <p className="mt-0.5 text-body-sm text-ink-2">
              Sobre {fmt(tot.ingresoBruto)} del mes
            </p>
          </div>

          <BarraDistribucion
            tramos={[
              { label: 'MW', valor: Math.round(tot.mwBase), color: 'bg-primary' },
              { label: 'Operador', valor: Math.round(tot.operadorFernando), color: 'bg-a3-solid' },
              { label: 'Fondo F', valor: Math.round(tot.fondoFernando), color: 'bg-a4-solid' },
              { label: 'Fondo J', valor: Math.round(tot.fondoJustiniano), color: 'bg-a6-solid' },
            ]}
            formato={fmt}
          />

          <div className="space-y-2 border-t border-line pt-4">
            <p className="text-body-sm font-semibold text-ink">A pagar este mes</p>
            {(['FERNANDO', 'JUSTINIANO', 'MW'] as Beneficiario[]).map((b) => {
              const monto =
                b === 'FERNANDO' ? tot.aPagarFernando : b === 'JUSTINIANO' ? tot.aPagarJustiniano : tot.aPagarMw
              return (
                <div key={b} className="flex items-baseline justify-between gap-3">
                  <span className="text-body-sm text-ink-2">{BENEFICIARIO_LABEL[b]}</span>
                  <span className="text-body font-semibold text-ink tnum">{fmt(monto)}</span>
                </div>
              )
            })}
            <div className="flex items-baseline justify-between gap-3 border-t border-line pt-2">
              <span className="text-body-sm font-semibold text-ink">Total</span>
              <span className="text-title text-primary tnum">{fmt(tot.subtotalPagable)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TarjetaImporte({
  titulo,
  valor,
  nota,
  destacado = false,
}: {
  titulo: string
  valor: number
  nota?: string
  destacado?: boolean
}) {
  return (
    <div
      className={`rounded-card border p-card shadow-card ${
        destacado ? 'border-primary-line bg-primary-soft' : 'border-line-card bg-surface'
      }`}
    >
      <p className="text-body-sm font-medium text-ink-2">{titulo}</p>
      <p className={`mt-1.5 text-title tnum ${destacado ? 'text-primary' : 'text-ink'}`}>
        {fmt(valor)}
      </p>
      {nota && <p className="mt-0.5 text-label text-ink-3">{nota}</p>}
    </div>
  )
}
