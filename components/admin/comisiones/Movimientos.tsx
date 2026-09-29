'use client'

import { useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { toast } from 'sonner'
import { ArchiveRestore, Pencil, Plus, Receipt, Search, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { EmptyState } from '@/components/ui/states'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  ORIGINADOR_LABEL,
  calcularReparto,
  etiquetaPeriodo,
  totalizar,
  type Originador,
  type Porcentajes,
} from '@/lib/comisiones'
import { cn } from '@/lib/utils'
import {
  ORIGINADORES,
  fmt,
  fmtFecha,
  pedir,
  periodoDeISO,
  type Liquidacion,
  type Movimiento,
} from './tipos'

export function MovimientosTab({
  periodo,
  movimientos,
  excluidos,
  liquidaciones,
  porcentajes,
  onNuevo,
  onEditar,
  setMovimientos,
  recargar,
}: {
  periodo: string
  movimientos: Movimiento[]
  excluidos: Movimiento[]
  liquidaciones: Liquidacion[]
  porcentajes: Porcentajes
  onNuevo: () => void
  onEditar: (m: Movimiento) => void
  setMovimientos: Dispatch<SetStateAction<Movimiento[]>>
  recargar: () => Promise<void>
}) {
  const [busqueda, setBusqueda] = useState('')
  const [verExcluidos, setVerExcluidos] = useState(false)
  const [aQuitar, setAQuitar] = useState<Movimiento | null>(null)
  const [quitando, setQuitando] = useState(false)
  // Cambio de originador en un cobro que ya existe: se confirma antes, porque
  // la originación sólo cuenta si se registró antes del cobro (contrato, 4.2 b).
  const [aOriginar, setAOriginar] = useState<{ m: Movimiento; originador: Originador } | null>(null)

  const q = busqueda.trim().toLowerCase()
  const buscando = q.length > 0
  const fuente = verExcluidos ? excluidos : movimientos

  // Con búsqueda se mira todo el historial: a un cliente se lo busca sin
  // saber en qué mes pagó. Sin búsqueda, sólo el mes elegido.
  const filas = useMemo(
    () =>
      fuente.filter((m) =>
        buscando
          ? m.cliente.toLowerCase().includes(q) || m.asunto.toLowerCase().includes(q) || (m.notas ?? '').toLowerCase().includes(q)
          : verExcluidos || periodoDeISO(m.fecha) === periodo,
      ),
    [fuente, buscando, q, periodo, verExcluidos],
  )
  const totales = useMemo(() => totalizar(filas, porcentajes), [filas, porcentajes])

  const periodoPagado = (p: string) => liquidaciones.some((l) => l.periodo === p && l.pagado)

  async function cambiarOriginador(m: Movimiento, originador: Originador) {
    setMovimientos((prev) => prev.map((x) => (x.id === m.id ? { ...x, originador } : x)))
    try {
      await pedir(`/api/admin/comisiones/${m.id}`, { method: 'PUT', json: { originador } })
      if (periodoPagado(periodoDeISO(m.fecha))) {
        toast.warning(`${etiquetaPeriodo(periodoDeISO(m.fecha))} ya tenía pagos marcados: revisá la liquidación.`)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo actualizar')
      recargar()
    }
  }

  async function quitar() {
    if (!aQuitar) return
    setQuitando(true)
    try {
      await pedir(`/api/admin/comisiones/${aQuitar.id}`, { method: 'DELETE' })
      toast.success(aQuitar.origen === 'PAGO' ? 'Movimiento excluido del reparto' : 'Movimiento eliminado')
      setAQuitar(null)
      await recargar()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo quitar')
    } finally {
      setQuitando(false)
    }
  }

  async function restaurar(m: Movimiento) {
    try {
      await pedir(`/api/admin/comisiones/${m.id}`, { method: 'PUT', json: { excluido: false } })
      toast.success('Movimiento restaurado')
      await recargar()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo restaurar')
    }
  }

  const titulo = verExcluidos
    ? 'Excluidos del reparto'
    : buscando
      ? 'Resultados en todos los meses'
      : `Movimientos de ${etiquetaPeriodo(periodo).toLowerCase()}`

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" aria-hidden />
          <Input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar cliente en todos los meses"
            aria-label="Buscar movimientos"
            className="pl-9"
          />
        </div>
        {(excluidos.length > 0 || verExcluidos) && (
          <Button variant="ghost" size="sm" onClick={() => setVerExcluidos((v) => !v)}>
            {verExcluidos ? 'Volver a los movimientos' : `Ver excluidos (${excluidos.length})`}
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line px-card-sm py-3.5 sm:px-card">
          <h3 className="text-heading text-ink">
            {titulo} <span className="text-ink-2 tnum">({filas.length})</span>
          </h3>
          {!verExcluidos && filas.length > 0 && (
            <span className="text-body-sm text-ink-2">
              Suma <span className="font-semibold text-ink tnum">{fmt(totales.ingresoBruto)}</span>
            </span>
          )}
        </div>

        {filas.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={buscando ? 'Sin resultados' : verExcluidos ? 'No hay excluidos' : 'Sin movimientos este mes'}
            description={
              buscando
                ? `No encontramos nada que coincida con «${busqueda}».`
                : 'Los honorarios cobrados por el sistema aparecen solos. Lo que se cobró por fuera se carga a mano.'
            }
            action={
              !buscando && !verExcluidos ? (
                <Button variant="secondary" onClick={onNuevo}>
                  <Plus className="h-4 w-4" aria-hidden />
                  Nuevo movimiento
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-left text-label text-ink-2">
                  <th className="px-card-sm py-2.5 font-semibold sm:pl-card">Fecha</th>
                  <th className="py-2.5 pr-4 font-semibold">Cliente</th>
                  <th className="py-2.5 pr-4 font-semibold">Originado por</th>
                  <th className="py-2.5 pr-4 text-right font-semibold">Honorario</th>
                  <th className="py-2.5 pr-4 text-right font-semibold" title="Comisión de originación">Originación</th>
                  <th className="py-2.5 pr-4 text-right font-semibold">MW</th>
                  <th className="py-2.5 pr-4 text-right font-semibold">Operador</th>
                  <th className="py-2.5 pr-4 text-right font-semibold" title="Fondo de Desarrollo (Fernando + Justiniano)">Fondo</th>
                  <th className="px-card-sm py-2.5 sm:pr-card"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filas.map((m) => {
                  const r = calcularReparto(m.monto, m.originador, porcentajes)
                  return (
                    <tr key={m.id} className="group align-top transition-colors hover:bg-surface-2">
                      <td className="whitespace-nowrap px-card-sm py-3 text-ink-2 tnum sm:pl-card">{fmtFecha(m.fecha)}</td>
                      <td className="min-w-48 py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-ink">{m.cliente}</span>
                          {m.origen === 'MANUAL' && <Badge size="sm">Manual</Badge>}
                        </div>
                        <p className="text-label text-ink-2">{m.asunto}</p>
                        {m.notas && <p className="mt-0.5 line-clamp-2 text-label text-ink-3">{m.notas}</p>}
                      </td>
                      <td className="py-2 pr-4">
                        {verExcluidos ? (
                          <span className="text-ink-2">{ORIGINADOR_LABEL[m.originador]}</span>
                        ) : (
                          <Select
                            value={m.originador}
                            onChange={(e) => {
                              const o = e.target.value as Originador
                              if (o === 'NINGUNO') cambiarOriginador(m, o)
                              else setAOriginar({ m, originador: o })
                            }}
                            aria-label={`Originador de ${m.cliente}`}
                            className={cn('h-8 w-auto min-w-36 text-body-sm', m.originador === 'NINGUNO' && 'text-ink-2')}
                          >
                            {ORIGINADORES.map((o) => <option key={o} value={o}>{ORIGINADOR_LABEL[o]}</option>)}
                          </Select>
                        )}
                      </td>
                      <td className="whitespace-nowrap py-3 pr-4 text-right font-semibold text-ink tnum">{fmt(m.monto)}</td>
                      <Monto valor={r.comisionOriginacion} />
                      <Monto valor={r.mw} />
                      <Monto valor={r.operadorFernando} />
                      <Monto valor={r.fondoFernando + r.fondoJustiniano} />
                      <td className="whitespace-nowrap px-card-sm py-2 text-right sm:pr-card">
                        {verExcluidos ? (
                          <Button variant="ghost" size="sm" onClick={() => restaurar(m)}>
                            <ArchiveRestore className="h-4 w-4" aria-hidden />
                            Restaurar
                          </Button>
                        ) : (
                          <div className="flex justify-end gap-0.5">
                            <Button variant="ghost" size="icon-sm" onClick={() => onEditar(m)} aria-label={`Editar movimiento de ${m.cliente}`} title="Editar">
                              <Pencil className="h-4 w-4" aria-hidden />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setAQuitar(m)}
                              aria-label={`Quitar movimiento de ${m.cliente}`}
                              title={m.origen === 'PAGO' ? 'Excluir del reparto' : 'Eliminar'}
                              className="hover:bg-danger-soft hover:text-danger"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {!verExcluidos && filas.length > 1 && (
                <tfoot>
                  <tr className="border-t border-line-strong bg-surface-2 font-semibold text-ink">
                    <td className="px-card-sm py-3 sm:pl-card" colSpan={3}>Total</td>
                    <td className="whitespace-nowrap py-3 pr-4 text-right tnum">{fmt(totales.ingresoBruto)}</td>
                    <td className="whitespace-nowrap py-3 pr-4 text-right tnum">
                      {fmt(totales.comisionFernando + totales.comisionJustiniano + totales.comisionMw)}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-4 text-right tnum">{fmt(totales.mwBase)}</td>
                    <td className="whitespace-nowrap py-3 pr-4 text-right tnum">{fmt(totales.operadorFernando)}</td>
                    <td className="whitespace-nowrap py-3 pr-4 text-right tnum">{fmt(totales.subtotalFondo)}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!aOriginar}
        onOpenChange={(o) => !o && setAOriginar(null)}
        destructive={false}
        confirmLabel="Sí, estaba registrada"
        onConfirm={() => {
          if (aOriginar) cambiarOriginador(aOriginar.m, aOriginar.originador)
          setAOriginar(null)
        }}
        title="¿La originación se registró antes de este cobro?"
        description={
          aOriginar &&
          `Según el contrato (cláusula 4.2 b), la comisión de originación sólo se reconoce si quedó registrada antes del primer cobro. ` +
            `Si recién ahora se sabe que ${ORIGINADOR_LABEL[aOriginar.originador]} trajo a ${aOriginar.m.cliente}, este cobro va sin originación; ` +
            `registralo en el trámite o el lead para los cobros que vengan.`
        }
      />

      <ConfirmDialog
        open={!!aQuitar}
        onOpenChange={(o) => !o && setAQuitar(null)}
        loading={quitando}
        onConfirm={quitar}
        title={aQuitar?.origen === 'PAGO' ? '¿Excluir este cobro del reparto?' : '¿Eliminar este movimiento?'}
        confirmLabel={aQuitar?.origen === 'PAGO' ? 'Excluir' : 'Eliminar'}
        description={
          aQuitar && (
            <>
              {aQuitar.cliente} · {fmt(aQuitar.monto)} del {fmtFecha(aQuitar.fecha)}.{' '}
              {aQuitar.origen === 'PAGO'
                ? 'Viene de un pago del sistema: deja de contar para las comisiones, pero lo podés restaurar desde «Ver excluidos».'
                : 'Se borra definitivamente.'}
              {periodoPagado(periodoDeISO(aQuitar.fecha)) && ' Ese mes ya tiene pagos marcados: la liquidación va a quedar desfasada.'}
            </>
          )
        }
      />
    </div>
  )
}

function Monto({ valor }: { valor: number }) {
  return (
    <td className={cn('whitespace-nowrap py-3 pr-4 text-right tnum', valor ? 'text-ink-2' : 'text-ink-3')}>
      {valor ? fmt(valor) : '—'}
    </td>
  )
}
