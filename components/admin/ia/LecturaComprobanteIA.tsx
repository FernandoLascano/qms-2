'use client'

import { useState } from 'react'
import { Sparkles, Loader2, CheckCircle, XCircle, HelpCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { pedirIA, mensajeDeError } from '@/lib/ai/pedir'
import type { ControlComprobante, LecturaComprobante, PagoEsperado } from '@/lib/ai/tramite'

interface Resultado {
  lectura: LecturaComprobante
  esperado: PagoEsperado | null
  control: ControlComprobante
}

/** La lectura guardada llega como JSON de la base: se usa sólo si tiene la forma esperada. */
function lecturaValida(valor: unknown): Resultado | null {
  const r = valor as Resultado | null
  return r && typeof r === 'object' && r.lectura && r.control?.veredicto in VEREDICTO && Array.isArray(r.control.puntos)
    ? r
    : null
}

const VEREDICTO: Record<ControlComprobante['veredicto'], { texto: string; clase: string }> = {
  coincide: { texto: 'Coincide con lo esperado', clase: 'border-success-line bg-success-soft text-success' },
  no_coincide: { texto: 'No coincide: revisalo antes de aprobar', clase: 'border-danger-line bg-danger-soft text-danger' },
  revisar: { texto: 'No se pudo confirmar todo', clase: 'border-warning-line bg-warning-soft text-warning' },
}

const fecha = (iso: string | null) => (iso && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.split('-').reverse().join('/') : iso)

// Muestra la lectura del comprobante contra el pago esperado. La lectura corre
// sola cuando el cliente lo sube (`inicial`); el botón la repite. No aprueba
// nada: el botón Aprobar sigue siendo la decisión del admin.
export default function LecturaComprobanteIA({ documentoId, inicial }: { documentoId: string; inicial?: unknown }) {
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(() => lecturaValida(inicial))

  const leer = async () => {
    setCargando(true)
    try {
      setResultado(await pedirIA(`/api/admin/documentos/${documentoId}/leer-comprobante`))
    } catch (error) {
      toast.error(mensajeDeError(error))
    } finally {
      setCargando(false)
    }
  }

  const datos = resultado
    ? ([
        ['Monto', resultado.lectura.monto != null ? `$ ${resultado.lectura.monto.toLocaleString('es-AR')}` : null],
        ['Fecha', fecha(resultado.lectura.fecha)],
        ['Operación', resultado.lectura.tipoOperacion],
        ['Paga', resultado.lectura.ordenante],
        ['Recibe', resultado.lectura.destinatario],
        ['CBU destino', resultado.lectura.cbuDestino],
        ['Alias destino', resultado.lectura.aliasDestino],
        ['Banco', resultado.lectura.banco],
        ['N.º de operación', resultado.lectura.numeroOperacion],
      ].filter(([, valor]) => valor) as [string, string][])
    : []

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={leer} disabled={cargando}>
        {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {cargando ? 'Leyendo…' : resultado ? 'Volver a leer' : 'Leer con IA'}
      </Button>

      {resultado && (
        <div className={`basis-full rounded-control border p-3 space-y-2 ${VEREDICTO[resultado.control.veredicto].clase}`}>
          <p className="text-body-sm font-semibold">
            {VEREDICTO[resultado.control.veredicto].texto}
            {resultado.esperado && (
              <span className="font-normal"> · {resultado.esperado.concepto}</span>
            )}
          </p>
          <ul className="space-y-1">
            {resultado.control.puntos.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-body-sm text-ink">
                {p.ok === true ? (
                  <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-success" />
                ) : p.ok === false ? (
                  <XCircle className="h-4 w-4 mt-0.5 shrink-0 text-danger" />
                ) : (
                  <HelpCircle className="h-4 w-4 mt-0.5 shrink-0 text-warning" />
                )}
                {p.texto}
              </li>
            ))}
          </ul>
          {datos.length > 0 && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-label text-ink-2 pt-1 border-t border-line">
              {datos.map(([etiqueta, valor]) => (
                <div key={etiqueta} className="contents">
                  <dt className="font-medium">{etiqueta}</dt>
                  <dd className="text-ink break-all">{valor}</dd>
                </div>
              ))}
            </dl>
          )}
          <p className="text-label text-ink-3">Lectura automática: abrí el comprobante si algo no te cierra.</p>
        </div>
      )}
    </>
  )
}
