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
import { RefreshCw, Plus, Trash2, CheckCircle2, Clock, Download, Search } from 'lucide-react'
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
type Gasto = { id: string; fecha: string; concepto: string; monto: number; imputadoA: Beneficiario | null; notas: string | null }

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
  const [busqueda, setBusqueda] = useState('')
  const [mostrarAlta, setMostrarAlta] = useState(false)
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([])
  const [distribuciones, setDistribuciones] = useState<Distribucion[]>([])
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [porcentajes, setPorcentajes] = useState<Porcentajes>(PORCENTAJES_DEFAULT)

  const movimientosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return movimientos
    return movimientos.filter(
      (m) => m.cliente.toLowerCase().includes(q) || m.asunto.toLowerCase().includes(q),
    )
  }, [movimientos, busqueda])

  const totalesFiltrados = useMemo(
    () => totalizar(movimientosFiltrados, porcentajes),
    [movimientosFiltrados, porcentajes],
  )

  const hoy = new Date()
  const periodoActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`

  // Form movimiento manual
  const [nuevo, setNuevo] = useState({ fecha: hoy.toISOString().slice(0, 10), cliente: '', asunto: '', monto: '', originador: 'NINGUNO' as Originador, notas: '' })
  // Form distribución fondo
  const [dist, setDist] = useState({ fecha: hoy.toISOString().slice(0, 10), beneficiario: 'FERNANDO' as Beneficiario, monto: '', notas: '' })
  const [gasto, setGasto] = useState({ fecha: hoy.toISOString().slice(0, 10), concepto: '', monto: '', imputadoA: '' as '' | Beneficiario, notas: '' })
  const [periodoSel, setPeriodoSel] = useState(periodoActual)

  async function cargar() {
    try {
      const res = await fetch('/api/admin/comisiones')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setMovimientos(data.movimientos)
      setLiquidaciones(data.liquidaciones)
      setDistribuciones(data.distribucionesFondo)
      setGastos(data.gastosFondo ?? [])
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

  /* Un gasto sin imputar es común a los dos y se reparte en la MISMA
     proporción en que se formó el fondo: hoy 12 y 8, o sea 60/40. Sale de la
     configuración y no de un número escrito a mano, así que si mañana cambian
     los porcentajes el reparto de los gastos los sigue solo. */
  const pctF = porcentajes.fondoFernando
  const pctJ = porcentajes.fondoJustiniano
  const parteF = pctF + pctJ > 0 ? pctF / (pctF + pctJ) : 0.5

  const gastoDe = (b: Beneficiario) =>
    gastos.reduce((a, g) => {
      if (g.imputadoA === b) return a + g.monto
      if (g.imputadoA === null) return a + g.monto * (b === 'FERNANDO' ? parteF : 1 - parteF)
      return a
    }, 0)

  const gastoFernando = gastoDe('FERNANDO')
  const gastoJustiniano = gastoDe('JUSTINIANO')
  const gastosTotal = gastos.reduce((a, g) => a + g.monto, 0)

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

  async function agregarGasto() {
    if (!gasto.concepto.trim()) return toast.error('Escribí en qué se gastó')
    if (!Number(gasto.monto)) return toast.error('Poné el monto')
    setSaving(true)
    try {
      const res = await fetch('/api/admin/comisiones/gastos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha: gasto.fecha,
          concepto: gasto.concepto.trim(),
          monto: Number(gasto.monto),
          imputadoA: gasto.imputadoA || null,
          notas: gasto.notas.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Gasto registrado')
      setGasto({ ...gasto, concepto: '', monto: '', notas: '' })
      cargar()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo registrar el gasto')
    } finally {
      setSaving(false)
    }
  }

  async function eliminarGasto(id: string) {
    try {
      const res = await fetch(`/api/admin/comisiones/gastos?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('No se pudo eliminar')
      toast.success('Gasto eliminado')
      cargar()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo eliminar el gasto')
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
        <div className="space-y-4">
          {/* Barra de herramientas: buscar y cargar a mano */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative lg:w-80">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3"
                aria-hidden
              />
              <Input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por cliente o asunto"
                aria-label="Buscar movimientos"
                className="pl-9"
              />
            </div>
            <Button variant="secondary" onClick={() => setMostrarAlta((v) => !v)}>
              <Plus className="h-4 w-4" aria-hidden />
              {mostrarAlta ? 'Cerrar' : 'Cargar movimiento a mano'}
            </Button>
          </div>

          {mostrarAlta && (
            <Card>
              <CardContent className="p-card">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-6 md:items-end">
                  <div>
                    <Label htmlFor="mov-fecha">Fecha</Label>
                    <Input id="mov-fecha" type="date" value={nuevo.fecha} onChange={(e) => setNuevo({ ...nuevo, fecha: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="mov-cliente">Cliente</Label>
                    <Input id="mov-cliente" value={nuevo.cliente} onChange={(e) => setNuevo({ ...nuevo, cliente: e.target.value })} placeholder="Nombre del cliente" />
                  </div>
                  <div>
                    <Label htmlFor="mov-asunto">Asunto</Label>
                    <Input id="mov-asunto" value={nuevo.asunto} onChange={(e) => setNuevo({ ...nuevo, asunto: e.target.value })} placeholder="Mensualización, etc." />
                  </div>
                  <div>
                    <Label htmlFor="mov-monto">Honorario</Label>
                    <Input id="mov-monto" type="number" value={nuevo.monto} onChange={(e) => setNuevo({ ...nuevo, monto: e.target.value })} placeholder="0" />
                  </div>
                  <div>
                    <Label htmlFor="mov-orig">Originador</Label>
                    <Select id="mov-orig" value={nuevo.originador} onChange={(e) => setNuevo({ ...nuevo, originador: e.target.value as Originador })}>
                      {ORIGINADORES.map((o) => <option key={o} value={o}>{ORIGINADOR_LABEL[o]}</option>)}
                    </Select>
                  </div>
                </div>
                <div className="mt-4">
                  <Button onClick={agregarMovimiento} loading={saving}>
                    <Plus className="h-4 w-4" aria-hidden />
                    Agregar movimiento
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Libro de movimientos */}
          {movimientosFiltrados.length === 0 ? (
            <Card>
              <div className="px-6 py-12 text-center">
                <h3 className="text-heading text-ink">
                  {busqueda ? 'Sin resultados' : 'Todavía no hay movimientos'}
                </h3>
                <p className="mx-auto mt-1 max-w-md text-body-sm text-ink-2">
                  {busqueda
                    ? `No encontramos nada que coincida con «${busqueda}».`
                    : 'Sincronizá los honorarios cobrados o cargá uno a mano.'}
                </p>
              </div>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line px-card-sm py-3">
                <h3 className="text-heading text-ink">
                  Movimientos <span className="text-ink-2 tnum">({movimientosFiltrados.length})</span>
                </h3>
                <span className="text-body-sm text-ink-2">
                  Suma <span className="font-semibold text-ink tnum">{fmt(totalesFiltrados.ingresoBruto)}</span>
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-body-sm">
                  <thead>
                    <tr className="border-b border-line bg-surface-2 text-left text-label text-ink-2">
                      <th className="px-card-sm py-2.5 font-semibold">Fecha</th>
                      <th className="py-2.5 pr-3 font-semibold">Cliente</th>
                      <th className="py-2.5 pr-3 font-semibold">Asunto</th>
                      <th className="py-2.5 pr-3 font-semibold">Originador</th>
                      <th className="py-2.5 pr-3 text-right font-semibold">Honorario</th>
                      <th className="py-2.5 pr-3 text-right font-semibold">Com. orig.</th>
                      <th className="py-2.5 pr-3 text-right font-semibold">MW</th>
                      <th className="py-2.5 pr-3 text-right font-semibold">Operador</th>
                      <th className="py-2.5 pr-3 text-right font-semibold">Fondo F</th>
                      <th className="py-2.5 pr-3 text-right font-semibold">Fondo J</th>
                      <th className="px-card-sm py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {movimientosFiltrados.map((m) => {
                      const r = calcularReparto(m.monto, m.originador, porcentajes)
                      return (
                        <tr key={m.id} className="group transition-colors hover:bg-surface-2">
                          <td className="whitespace-nowrap px-card-sm py-2.5 text-ink-2 tnum">
                            {fmtFecha(m.fecha)}
                          </td>
                          <td className="py-2.5 pr-3 font-medium text-ink">
                            <span className="flex items-center gap-2">
                              <span
                                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                  m.origen === 'PAGO' ? 'bg-success-solid' : 'bg-n-400'
                                }`}
                                title={m.origen === 'PAGO' ? 'Del sistema' : 'Cargado a mano'}
                              />
                              {m.cliente}
                            </span>
                          </td>
                          <td className="py-2.5 pr-3 text-ink-2">{m.asunto}</td>
                          <td className="py-2.5 pr-3">
                            <Select
                              value={m.originador}
                              onChange={(e) => cambiarOriginador(m.id, e.target.value as Originador)}
                              className="h-8 w-auto min-w-36 text-label"
                            >
                              {ORIGINADORES.map((o) => <option key={o} value={o}>{ORIGINADOR_LABEL[o]}</option>)}
                            </Select>
                          </td>
                          <td className="whitespace-nowrap py-2.5 pr-3 text-right font-semibold text-ink tnum">
                            {fmt(m.monto)}
                          </td>
                          <td className="whitespace-nowrap py-2.5 pr-3 text-right text-ink-2 tnum">
                            {r.comisionOriginacion ? fmt(r.comisionOriginacion) : '—'}
                          </td>
                          <td className="whitespace-nowrap py-2.5 pr-3 text-right text-ink tnum">{fmt(r.mw)}</td>
                          <td className="whitespace-nowrap py-2.5 pr-3 text-right text-ink tnum">{fmt(r.operadorFernando)}</td>
                          <td className="whitespace-nowrap py-2.5 pr-3 text-right text-ink-2 tnum">{fmt(r.fondoFernando)}</td>
                          <td className="whitespace-nowrap py-2.5 pr-3 text-right text-ink-2 tnum">{fmt(r.fondoJustiniano)}</td>
                          <td className="px-card-sm py-2.5 text-right">
                            <button
                              onClick={() => eliminarMovimiento(m.id)}
                              aria-label={`Eliminar movimiento de ${m.cliente}`}
                              className="rounded-control p-1.5 text-ink-3 opacity-0 transition hover:bg-danger-soft hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
                              title={m.origen === 'PAGO' ? 'Quitar de comisiones (no cuenta para el reparto)' : 'Eliminar'}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-line bg-surface-2 font-semibold text-ink">
                      <td className="px-card-sm py-3" colSpan={4}>Totales</td>
                      <td className="py-3 pr-3 text-right tnum">{fmt(totalesFiltrados.ingresoBruto)}</td>
                      <td className="py-3 pr-3 text-right tnum">
                        {fmt(totalesFiltrados.comisionFernando + totalesFiltrados.comisionJustiniano + totalesFiltrados.comisionMw)}
                      </td>
                      <td className="py-3 pr-3 text-right tnum">{fmt(totalesFiltrados.mwBase)}</td>
                      <td className="py-3 pr-3 text-right tnum">{fmt(totalesFiltrados.operadorFernando)}</td>
                      <td className="py-3 pr-3 text-right tnum">{fmt(totalesFiltrados.fondoFernando)}</td>
                      <td className="py-3 pr-3 text-right tnum">{fmt(totalesFiltrados.fondoJustiniano)}</td>
                      <td className="px-card-sm py-3" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          )}
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
                <div className="flex justify-between border-t border-line pt-3 text-body-sm">
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
              const gasto_ = b === 'FERNANDO' ? gastoFernando : gastoJustiniano
              return (
                <Card key={b}>
                  <CardHeader><CardTitle variant="section">Fondo {BENEFICIARIO_LABEL[b]}</CardTitle></CardHeader>
                  <CardContent className="space-y-1 text-body-sm">
                    <div className="flex justify-between"><span className="text-ink-2">Acumulado histórico</span><span className="text-ink">{fmt(acum)}</span></div>
                    <div className="flex justify-between"><span className="text-ink-2">Distribuido</span><span className="text-ink">− {fmt(distrib)}</span></div>
                    <div className="flex justify-between">
                      <span className="text-ink-2">Gastos del fondo</span>
                      <span className="text-ink">− {fmt(gasto_)}</span>
                    </div>
                    <div className="flex justify-between border-t border-line pt-1 font-semibold">
                      <span className="text-ink">Saldo disponible</span>
                      <span className={acum - distrib - gasto_ < 0 ? 'text-danger' : 'text-success'}>
                        {fmt(acum - distrib - gasto_)}
                      </span>
                    </div>
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
            <CardHeader>
              <CardTitle variant="section">Registrar gasto del fondo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-body-sm text-ink-2">
                Algo que se pagó con plata del fondo: una suscripción, un servicio, una
                herramienta. No es una distribución — no lo cobró ninguno de los dos, se
                consumió.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                <div>
                  <Label>Fecha</Label>
                  <Input type="date" value={gasto.fecha} onChange={(e) => setGasto({ ...gasto, fecha: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <Label>¿En qué se gastó?</Label>
                  <Input value={gasto.concepto} onChange={(e) => setGasto({ ...gasto, concepto: e.target.value })} placeholder="Suscripción, servicio, herramienta…" />
                </div>
                <div>
                  <Label>Monto</Label>
                  <Input type="number" value={gasto.monto} onChange={(e) => setGasto({ ...gasto, monto: e.target.value })} placeholder="0" />
                </div>
                <div>
                  <Label>Se le imputa a</Label>
                  <select
                    value={gasto.imputadoA}
                    onChange={(e) => setGasto({ ...gasto, imputadoA: e.target.value as '' | Beneficiario })}
                    className="flex h-10 w-full rounded-chip border border-line-strong bg-surface px-3 text-body-sm text-ink"
                  >
                    <option value="">Los dos ({Math.round(parteF * 100)}/{100 - Math.round(parteF * 100)})</option>
                    <option value="FERNANDO">Solo Fernando</option>
                    <option value="JUSTINIANO">Solo Justiniano</option>
                  </select>
                </div>
                <div>
                  <Button onClick={agregarGasto} disabled={saving} className="gap-2 w-full">
                    <Plus className="h-4 w-4" /> Registrar
                  </Button>
                </div>
              </div>
              <p className="text-label text-ink-3">
                «Los dos» reparte el gasto en la misma proporción en que se forma el fondo
                ({pctF}% y {pctJ}%), que es lo normal cuando el gasto sirve para el negocio
                y no para uno solo.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle variant="section">Gastos del fondo</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-body-sm text-ink">
                <thead>
                  <tr className="text-left text-ink-2 border-b border-line">
                    <th className="py-2 pr-3">Fecha</th>
                    <th className="pr-3">Concepto</th>
                    <th className="pr-3 text-right">Monto</th>
                    <th className="pr-3">Imputado a</th>
                    <th className="pr-3">Nota</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {gastos.length === 0 && (
                    <tr><td colSpan={6} className="py-6 text-center text-ink-2">Sin gastos registrados.</td></tr>
                  )}
                  {gastos.map((g) => (
                    <tr key={g.id} className="border-b border-line last:border-0">
                      <td className="py-2 pr-3">{fmtFecha(g.fecha)}</td>
                      <td className="pr-3">{g.concepto}</td>
                      <td className="pr-3 text-right">{fmt(g.monto)}</td>
                      <td className="pr-3 text-ink-2">
                        {g.imputadoA ? BENEFICIARIO_LABEL[g.imputadoA] : 'Los dos'}
                      </td>
                      <td className="pr-3 text-ink-2">{g.notas || '—'}</td>
                      <td className="text-right">
                        <button onClick={() => eliminarGasto(g.id)} className="text-ink-2 hover:text-danger p-1" aria-label="Eliminar gasto">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {gastos.length > 0 && (
                    <tr className="border-t border-line-strong font-semibold">
                      <td className="py-2 pr-3">Total</td>
                      <td></td>
                      <td className="pr-3 text-right">{fmt(gastosTotal)}</td>
                      <td colSpan={3}></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle variant="section">Distribuciones registradas</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-body-sm text-ink">
                <thead><tr className="text-left text-ink-2 border-b border-line"><th className="py-2 pr-3">Fecha</th><th className="pr-3">Beneficiario</th><th className="pr-3 text-right">Monto</th><th className="pr-3">Nota</th><th></th></tr></thead>
                <tbody>
                  {distribuciones.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-ink-2">Sin distribuciones registradas.</td></tr>}
                  {distribuciones.map((d) => (
                    <tr key={d.id} className="border-b border-line last:border-0">
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
