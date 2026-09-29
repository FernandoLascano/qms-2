'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Download, HandCoins, Landmark, PiggyBank, Plus, Wallet } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { ErrorState, PageSkeleton } from '@/components/ui/states'
import { StatCard } from '@/components/ui/stat-card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import {
  ORIGINADOR_LABEL,
  PORCENTAJES_DEFAULT,
  calcularReparto,
  etiquetaPeriodo,
  moverPeriodo,
  periodoHoy,
  rangoPeriodos,
  saldosFondo,
  totalizar,
  type Porcentajes,
} from '@/lib/comisiones'
import { cn } from '@/lib/utils'
import { LiquidacionTab, aPagarDe } from '@/components/admin/comisiones/Liquidacion'
import { MovimientosTab } from '@/components/admin/comisiones/Movimientos'
import { FondoTab } from '@/components/admin/comisiones/Fondo'
import { MovimientoDialog, MovimientoFondoDialog } from '@/components/admin/comisiones/Dialogos'
import {
  BENEFICIARIOS,
  fmt,
  fmtFecha,
  fmtRedondo,
  periodoDeISO,
  type Distribucion,
  type Gasto,
  type Liquidacion,
  type Movimiento,
} from '@/components/admin/comisiones/tipos'

/*
 * Comisiones: el reparto de honorarios del contrato asociativo (cláusula 4).
 *
 * Un solo selector de mes gobierna toda la pantalla. Antes el resumen de
 * arriba mostraba siempre el mes en curso, la tabla de movimientos todo el
 * historial y la liquidación el mes elegido en su propio selector: tres
 * números de "este mes" que no coincidían entre sí.
 */

type Tab = 'liquidacion' | 'movimientos' | 'fondo'
const TABS: { id: Tab; label: string }[] = [
  { id: 'liquidacion', label: 'Liquidación' },
  { id: 'movimientos', label: 'Movimientos' },
  { id: 'fondo', label: 'Fondo de Desarrollo' },
]

export default function ComisionesPage() {
  const [estado, setEstado] = useState<'cargando' | 'error' | 'listo'>('cargando')
  const [tab, setTab] = useState<Tab>('liquidacion')
  const [periodo, setPeriodo] = useState(periodoHoy)

  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [excluidos, setExcluidos] = useState<Movimiento[]>([])
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([])
  const [distribuciones, setDistribuciones] = useState<Distribucion[]>([])
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [porcentajes, setPorcentajes] = useState<Porcentajes>(PORCENTAJES_DEFAULT)

  const [editando, setEditando] = useState<Movimiento | null | undefined>(undefined)
  const [fondoDialog, setFondoDialog] = useState<'distribucion' | 'gasto' | null>(null)

  const cargar = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/comisiones')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setMovimientos(data.movimientos)
      setExcluidos(data.excluidos ?? [])
      setLiquidaciones(data.liquidaciones)
      setDistribuciones(data.distribucionesFondo)
      setGastos(data.gastosFondo ?? [])
      setPorcentajes(data.porcentajes)
      if (data.importados > 0) toast.success(`${data.importados} cobro(s) nuevo(s) importado(s) del sistema`)
      setEstado('listo')
    } catch {
      setEstado((e) => (e === 'listo' ? e : 'error'))
      toast.error('No se pudieron cargar las comisiones')
    }
  }, [])

  // La pestaña vive en la URL para que se pueda compartir y sobreviva a un F5.
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab')
    if (t && TABS.some((x) => x.id === t)) setTab(t as Tab)
    cargar()
  }, [cargar])

  function irA(t: Tab) {
    setTab(t)
    const url = new URL(window.location.href)
    if (t === 'liquidacion') url.searchParams.delete('tab')
    else url.searchParams.set('tab', t)
    window.history.replaceState(null, '', url)
  }

  // Todos los meses desde el primer cobro hasta hoy, sin huecos: antes sólo
  // aparecían los meses con movimientos y no se podía ir a uno vacío.
  const periodos = useMemo(() => {
    const hoy = periodoHoy()
    const conDatos = movimientos.map((m) => periodoDeISO(m.fecha))
    const desde = conDatos.reduce((a, p) => (p < a ? p : a), hoy)
    const hasta = conDatos.reduce((a, p) => (p > a ? p : a), hoy)
    return rangoPeriodos(desde, hasta)
  }, [movimientos])

  const movsPeriodo = useMemo(() => movimientos.filter((m) => periodoDeISO(m.fecha) === periodo), [movimientos, periodo])
  const totales = useMemo(() => totalizar(movsPeriodo, porcentajes), [movsPeriodo, porcentajes])
  const historico = useMemo(() => totalizar(movimientos, porcentajes), [movimientos, porcentajes])

  const fondo = useMemo(
    () =>
      saldosFondo(
        { FERNANDO: historico.fondoFernando, JUSTINIANO: historico.fondoJustiniano },
        distribuciones,
        gastos,
        porcentajes,
      ),
    [historico, distribuciones, gastos, porcentajes],
  )

  const pendiente = BENEFICIARIOS.reduce((a, b) => {
    const pagado = liquidaciones.some((l) => l.periodo === periodo && l.beneficiario === b && l.pagado)
    return a + (pagado ? 0 : aPagarDe(b, totales))
  }, 0)

  function exportarCSV() {
    const headers = ['Fecha', 'Cliente', 'Asunto', 'Origen', 'Honorario', 'Originador', 'Originación', 'MW', 'Operador', 'Fondo Fernando', 'Fondo Justiniano', 'Notas']
    const rows = movsPeriodo.map((m) => {
      const r = calcularReparto(m.monto, m.originador, porcentajes)
      return [fmtFecha(m.fecha), m.cliente, m.asunto, m.origen === 'PAGO' ? 'Sistema' : 'Manual', m.monto, ORIGINADOR_LABEL[m.originador], r.comisionOriginacion, r.mw, r.operadorFernando, r.fondoFernando, r.fondoJustiniano, m.notas ?? '']
    })
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `comisiones_${periodo}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const header = (
    <PageHeader
      title="Comisiones"
      description="Reparto de los honorarios cobrados según el contrato asociativo (cláusula 4)."
      breadcrumbs={[{ label: 'Hoy', href: '/dashboard/admin' }, { label: 'Comisiones' }]}
      actions={
        estado === 'listo' && (
          <>
            <Button variant="secondary" onClick={exportarCSV} disabled={movsPeriodo.length === 0}>
              <Download className="h-4 w-4" aria-hidden />
              Exportar mes
            </Button>
            <Button onClick={() => setEditando(null)}>
              <Plus className="h-4 w-4" aria-hidden />
              Nuevo movimiento
            </Button>
          </>
        )
      }
    />
  )

  if (estado === 'cargando') {
    return (
      <div className="space-y-section">
        {header}
        <PageSkeleton cards={2} />
      </div>
    )
  }

  if (estado === 'error') {
    return (
      <div className="space-y-section">
        {header}
        <ErrorState onRetry={() => { setEstado('cargando'); cargar() }} />
      </div>
    )
  }

  const idx = periodos.indexOf(periodo)
  const esPasado = periodo < periodoHoy()

  return (
    <div className="stagger space-y-section">
      {header}

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="icon" onClick={() => setPeriodo(moverPeriodo(periodo, -1))}
            disabled={idx === periodos.length - 1} aria-label="Mes anterior">
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>
          <Select value={periodo} onChange={(e) => setPeriodo(e.target.value)} aria-label="Mes" className="w-auto min-w-48 font-medium">
            {periodos.map((p) => <option key={p} value={p}>{etiquetaPeriodo(p)}</option>)}
          </Select>
          <Button variant="secondary" size="icon" onClick={() => setPeriodo(moverPeriodo(periodo, 1))}
            disabled={idx <= 0} aria-label="Mes siguiente">
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
          {periodo !== periodoHoy() && (
            <Button variant="link" size="sm" onClick={() => setPeriodo(periodoHoy())} className="ml-1">
              Ir al mes actual
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Cobrado en el mes"
            value={fmtRedondo(totales.ingresoBruto)}
            hint={`${movsPeriodo.length} ${movsPeriodo.length === 1 ? 'cobro' : 'cobros'}`}
            icon={Wallet}
            tamano="compacto"
            acento="a2"
          />
          <StatCard
            label="A pagar"
            value={fmtRedondo(totales.subtotalPagable)}
            hint={
              pendiente > 0.005
                ? `Falta pagar ${fmt(pendiente)}`
                : totales.subtotalPagable > 0
                  ? 'Todo pagado'
                  : 'Nada que pagar'
            }
            icon={HandCoins}
            tamano="compacto"
            acento="a3"
            alert={esPasado && pendiente > 0.005}
          />
          <StatCard
            label="Al fondo este mes"
            value={fmtRedondo(totales.subtotalFondo)}
            hint={`${porcentajes.fondoFernando + porcentajes.fondoJustiniano}% del esquema`}
            icon={PiggyBank}
            tamano="compacto"
            acento="a4"
          />
          <StatCard
            label="Fondo disponible"
            value={fmtRedondo(fondo.FERNANDO.saldo + fondo.JUSTINIANO.saldo)}
            hint="Acumulado menos lo usado, a hoy"
            icon={Landmark}
            tamano="compacto"
            acento="a6"
          />
        </div>
      </div>

      <nav aria-label="Secciones de comisiones" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <ul className="flex min-w-max items-center gap-1 border-b border-line">
          {TABS.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => irA(t.id)}
                aria-current={tab === t.id ? 'page' : undefined}
                className={cn(
                  'relative flex h-11 items-center gap-2 rounded-t-control px-3 text-body-sm transition-colors',
                  tab === t.id ? 'font-medium text-primary' : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
                )}
              >
                {t.label}
                {t.id === 'movimientos' && <span className="text-ink-3 tnum">{movsPeriodo.length}</span>}
                {tab === t.id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {tab === 'liquidacion' && (
        <LiquidacionTab
          periodo={periodo}
          totales={totales}
          porcentajes={porcentajes}
          liquidaciones={liquidaciones}
          movimientos={movimientos}
          recargar={cargar}
        />
      )}

      {tab === 'movimientos' && (
        <MovimientosTab
          periodo={periodo}
          movimientos={movimientos}
          excluidos={excluidos}
          liquidaciones={liquidaciones}
          porcentajes={porcentajes}
          onNuevo={() => setEditando(null)}
          onEditar={(m) => setEditando(m)}
          setMovimientos={setMovimientos}
          recargar={cargar}
        />
      )}

      {tab === 'fondo' && (
        <FondoTab
          saldos={fondo}
          parteFernando={fondo.parteFernando}
          porcentajes={porcentajes}
          distribuciones={distribuciones}
          gastos={gastos}
          onRegistrar={setFondoDialog}
          recargar={cargar}
        />
      )}

      <MovimientoDialog
        open={editando !== undefined}
        onOpenChange={(o) => !o && setEditando(undefined)}
        movimiento={editando}
        porcentajes={porcentajes}
        onGuardado={cargar}
      />
      <MovimientoFondoDialog
        tipo={fondoDialog}
        onOpenChange={(o) => !o && setFondoDialog(null)}
        saldos={{ FERNANDO: fondo.FERNANDO.saldo, JUSTINIANO: fondo.JUSTINIANO.saldo }}
        parteFernando={fondo.parteFernando}
        onGuardado={cargar}
      />
    </div>
  )
}
