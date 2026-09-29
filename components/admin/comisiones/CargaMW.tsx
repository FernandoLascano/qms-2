'use client'

import { Info } from 'lucide-react'
import { Card } from '@/components/ui/card'
import {
  BENEFICIARIO_LABEL,
  calcularReparto,
  etiquetaPeriodo,
  type Porcentajes,
} from '@/lib/comisiones'
import { fmt, fmtFecha, type Movimiento } from './tipos'

/**
 * Cómo cargar cada cobro en el sistema de liquidación de MW.
 *
 * Los cobros de QMS se liquidan en el sistema de MW, que tiene tres líneas:
 * Originación, Operadores y MW. La plantilla por defecto de MW está pensada
 * para los contratos del estudio (siempre 30% de originación al ejecutivo,
 * 32,5% a operadores, 37,5% a MW) y no coincide con el contrato QMS: en
 * agosto y septiembre de 2026 esa diferencia salió del Fondo de Desarrollo.
 *
 * Esta tabla da los montos exactos según el contrato:
 *  · Originación: si alguien trajo al cliente, a esa persona. Si entró solo
 *    por la web de QMS, igual se carga a Fernando: así lo liquida él en MW.
 *  · Operadores: el resto de lo de Fernando, con los dos fondos adentro (él
 *    los custodia). Cliente de la web: 30% originación + 40% operadores =
 *    el mismo 70% del contrato (50% suyo + 20% de fondo).
 *  · MW: su parte del esquema. El bono comercial de Fernando es un acuerdo
 *    aparte con el estudio y sale de acá, no de lo de QMS.
 */
export function CargaMW({
  movimientos,
  porcentajes,
  periodo,
}: {
  movimientos: Movimiento[]
  porcentajes: Porcentajes
  periodo: string
}) {
  if (movimientos.length === 0) return null

  const filas = movimientos.map((m) => {
    const r = calcularReparto(m.monto, m.originador, porcentajes)
    const deFernando = r.operadorFernando + r.fondoFernando + r.fondoJustiniano
    // Cliente de la web: lo de Fernando se parte en dos líneas de MW. El
    // total no cambia; sólo cómo se carga.
    const web = m.originador === 'NINGUNO'
    const originacion = web ? Math.min(m.monto * (porcentajes.originacion / 100), deFernando) : r.comisionOriginacion
    return {
      m,
      web,
      originacion,
      operadores: web ? deFernando - originacion : deFernando,
      mw: r.mw,
    }
  })
  const total = filas.reduce(
    (a, f) => ({
      cobrado: a.cobrado + f.m.monto,
      originacion: a.originacion + f.originacion,
      operadores: a.operadores + f.operadores,
      mw: a.mw + f.mw,
    }),
    { cobrado: 0, originacion: 0, operadores: 0, mw: 0 },
  )

  const pct = (valor: number, base: number) => (base ? `${Math.round((valor / base) * 1000) / 10}%` : '')

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-line px-card-sm py-3.5 sm:px-card">
        <h3 className="text-heading text-ink">Cómo cargarlo en MW</h3>
        <p className="mt-0.5 text-body-sm text-ink-2">
          Los montos de cada línea para liquidar {etiquetaPeriodo(periodo).toLowerCase()} en el sistema de MW, según el contrato QMS.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-body-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2 text-left text-label text-ink-2">
              <th className="px-card-sm py-2.5 font-semibold sm:pl-card">Cobro</th>
              <th className="py-2.5 pr-4 text-right font-semibold">Cobrado</th>
              <th className="py-2.5 pr-4 text-right font-semibold">Originación</th>
              <th className="py-2.5 pr-4 text-right font-semibold" title="Parte de Fernando + los dos fondos, que él custodia">Operadores</th>
              <th className="px-card-sm py-2.5 text-right font-semibold sm:pr-card" title="Incluye el bono comercial, que MW paga de su parte">MW</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filas.map(({ m, web, originacion, operadores, mw }) => (
              <tr key={m.id} className="align-top">
                <td className="px-card-sm py-3 sm:pl-card">
                  <p className="font-medium text-ink">{m.cliente}</p>
                  <p className="text-label text-ink-2">{m.asunto} · {fmtFecha(m.fecha)}</p>
                </td>
                <td className="whitespace-nowrap py-3 pr-4 text-right text-ink-2 tnum">{fmt(m.monto)}</td>
                <td className="whitespace-nowrap py-3 pr-4 text-right tnum">
                  <p className="font-semibold text-ink">{fmt(originacion)}</p>
                  <p className="text-label text-ink-3">
                    {web ? 'a Fernando · entró por la web' : `a ${BENEFICIARIO_LABEL[m.originador as 'FERNANDO' | 'JUSTINIANO' | 'MW']}`}
                  </p>
                </td>
                <td className="whitespace-nowrap py-3 pr-4 text-right tnum">
                  <p className="font-semibold text-ink">{fmt(operadores)}</p>
                  <p className="text-label text-ink-3">{pct(operadores, m.monto)}</p>
                </td>
                <td className="whitespace-nowrap px-card-sm py-3 text-right tnum sm:pr-card">
                  <p className="font-semibold text-ink">{fmt(mw)}</p>
                  <p className="text-label text-ink-3">{pct(mw, m.monto)}</p>
                </td>
              </tr>
            ))}
          </tbody>
          {filas.length > 1 && (
            <tfoot>
              <tr className="border-t border-line-strong bg-surface-2 font-semibold text-ink">
                <td className="px-card-sm py-3 sm:pl-card">Total del mes</td>
                <td className="whitespace-nowrap py-3 pr-4 text-right tnum">{fmt(total.cobrado)}</td>
                <td className="whitespace-nowrap py-3 pr-4 text-right tnum">{fmt(total.originacion)}</td>
                <td className="whitespace-nowrap py-3 pr-4 text-right tnum">{fmt(total.operadores)}</td>
                <td className="whitespace-nowrap px-card-sm py-3 text-right tnum sm:pr-card">{fmt(total.mw)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="flex gap-2 border-t border-line bg-info-soft px-card-sm py-3 text-body-sm text-ink sm:px-card">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" aria-hidden />
        <p>
          No uses la plantilla por defecto de MW (30% / 32,5% / 37,5%): la diferencia sale del fondo. Cliente de la
          web: originación 30% a vos, operadores 40% (de ahí sale el Fondo de Desarrollo, 20%) y MW 30% (de ahí sale
          tu bono comercial, si hay). Si alguien trajo al cliente, la originación es suya y el resto se reparte
          según el contrato.
        </p>
      </div>
    </Card>
  )
}
