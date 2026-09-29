'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { AlertTriangle, Check, Undo2 } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BarraDistribucion, BarrasMensuales } from '@/components/ui/charts'
import {
  BENEFICIARIO_LABEL,
  etiquetaPeriodo,
  moverPeriodo,
  type Beneficiario,
  type Porcentajes,
  type TotalesLiquidacion,
} from '@/lib/comisiones'
import { cn } from '@/lib/utils'
import {
  BENEFICIARIOS,
  COLOR_DE,
  fmt,
  fmtFecha,
  pedir,
  periodoDeISO,
  type Liquidacion as LiquidacionT,
  type Movimiento,
} from './tipos'

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

/** De dónde sale lo que cobra cada uno: lo que antes había que deducir de la tabla. */
function desglose(b: Beneficiario, t: TotalesLiquidacion): string {
  if (b === 'FERNANDO') {
    return t.comisionFernando > 0
      ? `Operador ${fmt(t.operadorFernando)} + originación ${fmt(t.comisionFernando)}`
      : 'Operador'
  }
  if (b === 'MW') {
    return t.comisionMw > 0 ? `Esquema ${fmt(t.mwBase)} + originación ${fmt(t.comisionMw)}` : 'Esquema base'
  }
  return 'Originación de clientes'
}

export function aPagarDe(b: Beneficiario, t: TotalesLiquidacion) {
  return b === 'FERNANDO' ? t.aPagarFernando : b === 'JUSTINIANO' ? t.aPagarJustiniano : t.aPagarMw
}

export function LiquidacionTab({
  periodo,
  totales,
  porcentajes,
  liquidaciones,
  movimientos,
  recargar,
}: {
  periodo: string
  totales: TotalesLiquidacion
  porcentajes: Porcentajes
  liquidaciones: LiquidacionT[]
  movimientos: Movimiento[]
  recargar: () => Promise<void>
}) {
  const [ocupado, setOcupado] = useState<Beneficiario | null>(null)

  async function marcar(b: Beneficiario, monto: number, pagado: boolean) {
    setOcupado(b)
    try {
      await pedir('/api/admin/comisiones/liquidacion', { method: 'POST', json: { periodo, beneficiario: b, monto, pagado } })
      toast.success(pagado ? `${BENEFICIARIO_LABEL[b]}: marcado como pagado` : `${BENEFICIARIO_LABEL[b]}: vuelve a pendiente`)
      await recargar()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo guardar')
    } finally {
      setOcupado(null)
    }
  }

  // 12 meses que terminan en el período elegido, no en hoy: así el gráfico
  // acompaña al selector.
  const meses = Array.from({ length: 12 }, (_, i) => {
    const clave = moverPeriodo(periodo, i - 11)
    const valor = movimientos.filter((m) => periodoDeISO(m.fecha) === clave).reduce((a, m) => a + m.monto, 0)
    return { label: MESES_CORTOS[Number(clave.slice(5)) - 1], valor }
  })

  const comisiones = totales.comisionFernando + totales.comisionJustiniano + totales.comisionMw

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]">
      <div className="space-y-4">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-card-sm py-3.5 sm:px-card">
            <h3 className="text-heading text-ink">A pagar · {etiquetaPeriodo(periodo)}</h3>
            <span className="text-body-sm text-ink-2">
              Sobre <span className="font-semibold text-ink tnum">{fmt(totales.ingresoBruto)}</span> cobrados
            </span>
          </div>

          <ul className="divide-y divide-line">
            {BENEFICIARIOS.map((b) => {
              const monto = aPagarDe(b, totales)
              const liq = liquidaciones.find((l) => l.periodo === periodo && l.beneficiario === b)
              const pagado = !!liq?.pagado
              // El monto pagado es una foto; si después cambian los movimientos
              // del mes, el cálculo actual ya no coincide y hay que avisarlo.
              const diferencia = pagado ? monto - liq!.monto : 0
              const desfasado = Math.abs(diferencia) >= 0.01

              return (
                <li key={b} className="px-card-sm py-4 sm:px-card">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                    <span
                      className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-body-sm font-semibold ring-1', COLOR_DE[b].suave)}
                      aria-hidden
                    >
                      {BENEFICIARIO_LABEL[b].slice(0, b === 'MW' ? 2 : 1)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-body font-medium text-ink">{BENEFICIARIO_LABEL[b]}</p>
                      <p className="truncate text-body-sm text-ink-2">{monto > 0 ? desglose(b, totales) : 'Nada este mes'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={cn('text-title tnum', monto > 0 || pagado ? 'text-ink' : 'text-ink-3')}>
                          {fmt(pagado ? liq!.monto : monto)}
                        </p>
                        {pagado ? (
                          <Badge tone="success" dot size="sm">
                            Pagado{liq?.fechaPago ? ` el ${fmtFecha(liq.fechaPago)}` : ''}
                          </Badge>
                        ) : monto > 0 ? (
                          <Badge tone="warning" dot size="sm">Pendiente</Badge>
                        ) : null}
                      </div>
                      {pagado ? (
                        <Button variant="ghost" size="icon-sm" loading={ocupado === b} onClick={() => marcar(b, monto, false)}
                          aria-label={`Volver a pendiente el pago a ${BENEFICIARIO_LABEL[b]}`} title="Volver a pendiente">
                          {ocupado !== b && <Undo2 className="h-4 w-4" aria-hidden />}
                        </Button>
                      ) : (
                        <Button size="sm" loading={ocupado === b} disabled={monto <= 0} onClick={() => marcar(b, monto, true)}>
                          {ocupado !== b && <Check className="h-4 w-4" aria-hidden />}
                          Marcar pagado
                        </Button>
                      )}
                    </div>
                  </div>

                  {desfasado && (
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-control border border-warning-line bg-warning-soft px-3 py-2.5 text-body-sm text-ink sm:ml-14">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-warning" aria-hidden />
                      <span className="min-w-0 flex-1">
                        Los movimientos del mes cambiaron después del pago: hoy corresponden{' '}
                        <strong className="tnum">{fmt(monto)}</strong> ({diferencia > 0 ? 'faltan' : 'sobran'}{' '}
                        <strong className="tnum">{fmt(Math.abs(diferencia))}</strong>).
                      </span>
                      <Button variant="secondary" size="sm" loading={ocupado === b} onClick={() => marcar(b, monto, true)}>
                        Ajustar a {fmt(monto)}
                      </Button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>

          <div className="flex items-baseline justify-between gap-3 border-t border-line bg-surface-2 px-card-sm py-3 sm:px-card">
            <span className="text-body-sm font-semibold text-ink">Total a pagar</span>
            <span className="text-title text-primary tnum">{fmt(totales.subtotalPagable)}</span>
          </div>
        </Card>

        <Card>
          <CardBody>
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h3 className="text-heading text-ink">Ingresos por mes</h3>
                <p className="mt-0.5 text-body-sm text-ink-2">Honorarios cobrados, sin gastos</p>
              </div>
              <span className="text-body-sm text-ink-2">
                12 meses <span className="font-semibold text-ink tnum">{fmt(meses.reduce((a, m) => a + m.valor, 0))}</span>
              </span>
            </div>
            <BarrasMensuales datos={meses} formato={fmt} alto={132} />
          </CardBody>
        </Card>
      </div>

      <aside className="space-y-4">
        <Card>
          <CardBody className="space-y-5">
            <div>
              <h3 className="text-heading text-ink">Cómo se reparte</h3>
              <p className="mt-0.5 text-body-sm text-ink-2">Todo lo cobrado en {etiquetaPeriodo(periodo).toLowerCase()}</p>
            </div>

            {totales.ingresoBruto > 0 ? (
              <BarraDistribucion
                // Incluye la originación: sin ella los tramos no sumaban el total.
                tramos={[
                  { label: 'Originación', valor: comisiones, color: 'bg-a5-solid' },
                  { label: 'MW', valor: totales.mwBase, color: 'bg-primary' },
                  { label: 'Operador', valor: totales.operadorFernando, color: 'bg-a3-solid' },
                  { label: 'Fondo', valor: totales.subtotalFondo, color: 'bg-a2-solid' },
                ]}
                formato={fmt}
              />
            ) : (
              <p className="text-body-sm text-ink-3">Sin ingresos en este mes.</p>
            )}

            <div className="space-y-2 border-t border-line pt-4 text-body-sm">
              <p className="font-semibold text-ink">Al Fondo de Desarrollo</p>
              <p className="text-ink-2">Se acumula; no se paga salvo acuerdo.</p>
              <div className="flex justify-between"><span className="text-ink-2">Fernando ({porcentajes.fondoFernando}%)</span><span className="font-medium text-ink tnum">{fmt(totales.fondoFernando)}</span></div>
              <div className="flex justify-between"><span className="text-ink-2">Justiniano ({porcentajes.fondoJustiniano}%)</span><span className="font-medium text-ink tnum">{fmt(totales.fondoJustiniano)}</span></div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-2 text-body-sm">
            <h3 className="text-heading text-ink">Esquema vigente</h3>
            <p className="text-ink-2">
              Si alguien originó al cliente, primero se lleva el <strong className="text-ink">{porcentajes.originacion}%</strong>.
              El resto se reparte así:
            </p>
            <ul className="space-y-1 pt-1">
              <li className="flex justify-between"><span className="text-ink-2">MW</span><span className="font-medium text-ink tnum">{porcentajes.mw}%</span></li>
              <li className="flex justify-between"><span className="text-ink-2">Operador (Fernando)</span><span className="font-medium text-ink tnum">{porcentajes.operador}%</span></li>
              <li className="flex justify-between"><span className="text-ink-2">Fondo Fernando</span><span className="font-medium text-ink tnum">{porcentajes.fondoFernando}%</span></li>
              <li className="flex justify-between"><span className="text-ink-2">Fondo Justiniano</span><span className="font-medium text-ink tnum">{porcentajes.fondoJustiniano}%</span></li>
            </ul>
            <Link href="/dashboard/admin/configuracion" className="inline-block pt-1 text-primary underline-offset-4 hover:underline">
              Cambiar porcentajes
            </Link>
          </CardBody>
        </Card>
      </aside>
    </div>
  )
}
