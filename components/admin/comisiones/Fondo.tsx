'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { HandCoins, PiggyBank, ShoppingCart, Trash2 } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/states'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { BENEFICIARIO_LABEL, type Porcentajes, type SaldoFondo } from '@/lib/comisiones'
import { cn } from '@/lib/utils'
import { COLOR_DE, fmt, fmtFecha, pedir, type Distribucion, type Gasto } from './tipos'

type Entrada =
  | { tipo: 'distribucion'; id: string; fecha: string; monto: number; d: Distribucion }
  | { tipo: 'gasto'; id: string; fecha: string; monto: number; g: Gasto }

export function FondoTab({
  saldos,
  parteFernando,
  porcentajes,
  distribuciones,
  gastos,
  onRegistrar,
  recargar,
}: {
  saldos: { FERNANDO: SaldoFondo; JUSTINIANO: SaldoFondo }
  parteFernando: number
  porcentajes: Porcentajes
  distribuciones: Distribucion[]
  gastos: Gasto[]
  onRegistrar: (tipo: 'distribucion' | 'gasto') => void
  recargar: () => Promise<void>
}) {
  const [aBorrar, setABorrar] = useState<Entrada | null>(null)
  const [borrando, setBorrando] = useState(false)
  const pF = Math.round(parteFernando * 100)

  // Antes eran dos tablas con estilos distintos; es un solo libro del fondo.
  const historial: Entrada[] = [
    ...distribuciones.map((d) => ({ tipo: 'distribucion' as const, id: d.id, fecha: d.fecha, monto: d.monto, d })),
    ...gastos.map((g) => ({ tipo: 'gasto' as const, id: g.id, fecha: g.fecha, monto: g.monto, g })),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha))

  async function borrar() {
    if (!aBorrar) return
    setBorrando(true)
    try {
      const ruta = aBorrar.tipo === 'gasto' ? 'gastos' : 'fondo'
      await pedir(`/api/admin/comisiones/${ruta}?id=${aBorrar.id}`, { method: 'DELETE' })
      toast.success(aBorrar.tipo === 'gasto' ? 'Gasto eliminado' : 'Distribución eliminada')
      setABorrar(null)
      await recargar()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo eliminar')
    } finally {
      setBorrando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-body-sm text-ink-2">
          Cada honorario suma {porcentajes.fondoFernando}% al fondo de Fernando y {porcentajes.fondoJustiniano}% al de
          Justiniano. Se acumula y sólo baja con una distribución acordada o un gasto del negocio.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" onClick={() => onRegistrar('gasto')}>
            <ShoppingCart className="h-4 w-4" aria-hidden />
            Registrar gasto
          </Button>
          <Button variant="secondary" onClick={() => onRegistrar('distribucion')}>
            <HandCoins className="h-4 w-4" aria-hidden />
            Registrar distribución
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(['FERNANDO', 'JUSTINIANO'] as const).map((b) => {
          const s = saldos[b]
          const usado = s.acumulado > 0 ? Math.min((s.distribuido + s.gastado) / s.acumulado, 1) : 0
          return (
            <Card key={b}>
              <CardBody className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-body-sm font-semibold text-ink">Fondo {BENEFICIARIO_LABEL[b]}</p>
                    <p className={cn('mt-1 text-title tnum', s.saldo < 0 ? 'text-danger' : 'text-ink')}>
                      {fmt(s.saldo)}
                    </p>
                    <p className="mt-1.5 text-label text-ink-2">disponible</p>
                  </div>
                  <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1', COLOR_DE[b].suave)} aria-hidden>
                    <PiggyBank className="h-5 w-5" />
                  </span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-3" aria-hidden>
                  <div className={cn('h-full rounded-full', COLOR_DE[b].solido)} style={{ width: `${(1 - usado) * 100}%` }} />
                </div>

                <dl className="space-y-1.5 text-body-sm">
                  <div className="flex justify-between"><dt className="text-ink-2">Acumulado histórico</dt><dd className="text-ink tnum">{fmt(s.acumulado)}</dd></div>
                  <div className="flex justify-between"><dt className="text-ink-2">Distribuido</dt><dd className="text-ink tnum">− {fmt(s.distribuido)}</dd></div>
                  <div className="flex justify-between"><dt className="text-ink-2">Gastos</dt><dd className="text-ink tnum">− {fmt(s.gastado)}</dd></div>
                </dl>
              </CardBody>
            </Card>
          )
        })}
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-line px-card-sm py-3.5 sm:px-card">
          <h3 className="text-heading text-ink">
            Historial del fondo <span className="text-ink-2 tnum">({historial.length})</span>
          </h3>
        </div>

        {historial.length === 0 ? (
          <EmptyState
            icon={PiggyBank}
            title="Todavía no se usó el fondo"
            description="Acá aparecen las distribuciones acordadas y los gastos pagados con plata del fondo."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-left text-label text-ink-2">
                  <th className="px-card-sm py-2.5 font-semibold sm:pl-card">Fecha</th>
                  <th className="py-2.5 pr-4 font-semibold">Tipo</th>
                  <th className="py-2.5 pr-4 font-semibold">Detalle</th>
                  <th className="py-2.5 pr-4 font-semibold">A cargo de</th>
                  <th className="py-2.5 pr-4 text-right font-semibold">Monto</th>
                  <th className="px-card-sm py-2.5 sm:pr-card"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {historial.map((e) => {
                  const nota = e.tipo === 'gasto' ? e.g.notas : e.d.notas
                  return (
                    <tr key={`${e.tipo}-${e.id}`} className="align-top transition-colors hover:bg-surface-2">
                      <td className="whitespace-nowrap px-card-sm py-3 text-ink-2 tnum sm:pl-card">{fmtFecha(e.fecha)}</td>
                      <td className="py-3 pr-4">
                        {e.tipo === 'gasto' ? <Badge size="sm" tone="warning">Gasto</Badge> : <Badge size="sm" tone="info">Distribución</Badge>}
                      </td>
                      <td className="min-w-48 py-3 pr-4">
                        <p className="text-ink">{e.tipo === 'gasto' ? e.g.concepto : `Retiro de ${BENEFICIARIO_LABEL[e.d.beneficiario]}`}</p>
                        {nota && <p className="text-label text-ink-3">{nota}</p>}
                      </td>
                      <td className="whitespace-nowrap py-3 pr-4 text-ink-2">
                        {e.tipo === 'distribucion'
                          ? BENEFICIARIO_LABEL[e.d.beneficiario]
                          : e.g.imputadoA
                            ? BENEFICIARIO_LABEL[e.g.imputadoA]
                            : `Los dos (${pF}/${100 - pF})`}
                      </td>
                      <td className="whitespace-nowrap py-3 pr-4 text-right font-semibold text-ink tnum">{fmt(e.monto)}</td>
                      <td className="px-card-sm py-2 text-right sm:pr-card">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setABorrar(e)}
                          aria-label={e.tipo === 'gasto' ? 'Eliminar gasto' : 'Eliminar distribución'}
                          className="hover:bg-danger-soft hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!aBorrar}
        onOpenChange={(o) => !o && setABorrar(null)}
        loading={borrando}
        onConfirm={borrar}
        title={aBorrar?.tipo === 'gasto' ? '¿Eliminar este gasto?' : '¿Eliminar esta distribución?'}
        description={aBorrar && `${fmt(aBorrar.monto)} del ${fmtFecha(aBorrar.fecha)}. El saldo del fondo vuelve a subir en ese monto.`}
      />
    </div>
  )
}
