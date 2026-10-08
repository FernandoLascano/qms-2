'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ChevronDown, Copy, FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { etiquetaPeriodo, type Porcentajes, type TotalesLiquidacion } from '@/lib/comisiones'
import { fmt, fmtFecha, type Gasto, type Movimiento } from './tipos'
import { ReporteMensualPdf } from '@/components/admin/reportes/ReporteMensualPdf'

/**
 * Reporte mensual para las demás partes (cláusula 5.3 del contrato
 * asociativo): ingresos brutos, distribución de cada parte, costos cubiertos
 * por MW y evolución del producto.
 *
 * Lo que el sistema sabe se completa solo; lo que no (los costos que pagó MW
 * y cómo viene el producto) queda marcado para escribirlo antes de mandarlo.
 * El bono comercial NO va: es un acuerdo aparte de Fernando con MW.
 */
export function ReporteMensual({
  periodo,
  movimientos,
  totales,
  porcentajes: p,
  saldoFondo,
  gastosFondoMes,
}: {
  periodo: string
  movimientos: Movimiento[]
  totales: TotalesLiquidacion
  porcentajes: Porcentajes
  saldoFondo: number
  gastosFondoMes: Gasto[]
}) {
  const [abierto, setAbierto] = useState(false)

  const originacion = [
    totales.comisionFernando > 0 && `Fernando ${fmt(totales.comisionFernando)}`,
    totales.comisionJustiniano > 0 && `Justiniano ${fmt(totales.comisionJustiniano)}`,
    totales.comisionMw > 0 && `MW ${fmt(totales.comisionMw)}`,
  ].filter(Boolean)

  const lineas = [
    `Reporte mensual QMS · ${etiquetaPeriodo(periodo)}`,
    `(cláusula 5.3 del contrato asociativo)`,
    ``,
    `INGRESOS BRUTOS: ${fmt(totales.ingresoBruto)} (${movimientos.length} ${movimientos.length === 1 ? 'cobro' : 'cobros'})`,
    ...movimientos.map((m) => `· ${fmtFecha(m.fecha)} · ${m.cliente} · ${m.asunto} · ${fmt(m.monto)}`),
    ``,
    `DISTRIBUCIÓN (cláusula IV)`,
    ...(originacion.length ? [`· Originación (${p.originacion}%): ${originacion.join(', ')}`] : []),
    `· MW (${p.mw}%): ${fmt(totales.mwBase)}`,
    `· Operador, Fernando (${p.operador}%): ${fmt(totales.operadorFernando)}`,
    `· Fondo de Desarrollo, Fernando (${p.fondoFernando}%): ${fmt(totales.fondoFernando)}`,
    `· Fondo de Desarrollo, Justiniano (${p.fondoJustiniano}%): ${fmt(totales.fondoJustiniano)}`,
    ``,
    `FONDO DE DESARROLLO`,
    `· Ingresó este mes: ${fmt(totales.subtotalFondo)}`,
    ...(gastosFondoMes.length
      ? [`· Gastos del mes: ${gastosFondoMes.map((g) => `${g.concepto} ${fmt(g.monto)}`).join('; ')}`]
      : [`· Gastos del mes: ninguno`]),
    `· Saldo disponible: ${fmt(saldoFondo)}`,
    ``,
    `COSTOS CUBIERTOS POR MW (cláusula 3.1)`,
    `· [completar: hosting, IA, dominio, domicilio legal, publicidad…]`,
    ``,
    `EVOLUCIÓN DEL PRODUCTO`,
    `· [completar]`,
  ]
  const [texto, setTexto] = useState('')
  const actual = abierto && texto ? texto : lineas.join('\n')

  async function copiar() {
    try {
      await navigator.clipboard.writeText(actual)
      toast.success('Reporte copiado')
    } catch {
      toast.error('No se pudo copiar: seleccioná el texto y copialo a mano')
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-card-sm py-3.5 sm:px-card">
        <div className="flex min-w-0 items-start gap-3">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-ink-3" aria-hidden />
          <div>
            <h3 className="text-heading text-ink">Reporte para las partes</h3>
            <p className="text-body-sm text-ink-2">
              El que pide el contrato todos los meses (cláusula 5.3). En PDF sale el reporte mensual completo, con la gestión del mes.
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => { setAbierto((v) => !v); setTexto(lineas.join('\n')) }}>
            <ChevronDown className={`h-4 w-4 transition-transform ${abierto ? 'rotate-180' : ''}`} aria-hidden />
            {abierto ? 'Ocultar' : 'Ver y editar'}
          </Button>
          <Button variant="secondary" size="sm" onClick={copiar}>
            <Copy className="h-4 w-4" aria-hidden />
            Copiar
          </Button>
          <ReporteMensualPdf periodo={periodo} etiqueta="PDF" size="sm" />
        </div>
      </div>
      {abierto && (
        <div className="border-t border-line p-card-sm sm:p-card">
          <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={22} className="font-mono text-body-sm" aria-label="Texto del reporte" />
        </div>
      )}
    </Card>
  )
}
