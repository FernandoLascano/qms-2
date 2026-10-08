'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { FileDown } from 'lucide-react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Field } from '@/components/ui/field'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { etiquetaPeriodo, moverPeriodo, periodoHoy } from '@/lib/comisiones'
import { descargarPdf } from './descargar'

const CLAVE_COSTOS = 'qms-reporte-costos-mw'

/**
 * Botón + formulario del reporte mensual en PDF (gestión del mes y cláusula
 * 5.3). Pide lo único que el sistema no sabe: los costos que cubrió MW y las
 * novedades del producto. Los costos suelen repetirse, así que se recuerdan
 * en este navegador.
 */
export function ReporteMensualPdf({
  periodo: periodoInicial,
  etiqueta = 'Reporte mensual',
  size,
  variant,
}: {
  periodo?: string
  etiqueta?: string
  size?: ButtonProps['size']
  variant?: ButtonProps['variant']
}) {
  const hoy = periodoHoy()
  const meses = Array.from({ length: 12 }, (_, i) => moverPeriodo(hoy, -i))
  const [abierto, setAbierto] = useState(false)
  const [periodo, setPeriodo] = useState(periodoInicial ?? hoy)
  const [costosMw, setCostosMw] = useState('')
  const [evolucion, setEvolucion] = useState('')
  const [generando, setGenerando] = useState(false)

  function abrir() {
    setPeriodo(periodoInicial ?? hoy)
    try {
      setCostosMw(localStorage.getItem(CLAVE_COSTOS) ?? '')
    } catch {
      // sin almacenamiento: arranca vacío
    }
    setAbierto(true)
  }

  async function descargar() {
    setGenerando(true)
    try {
      try {
        localStorage.setItem(CLAVE_COSTOS, costosMw)
      } catch {
        // sin almacenamiento: no pasa nada
      }
      await descargarPdf('/api/admin/reportes/mensual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodo, costosMw, evolucion }),
      })
      setAbierto(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo generar el reporte')
    } finally {
      setGenerando(false)
    }
  }

  return (
    <>
      <Button onClick={abrir} size={size} variant={variant}>
        <FileDown className="h-4 w-4" aria-hidden />
        {etiqueta}
      </Button>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-title">Reporte mensual</DialogTitle>
            <DialogDescription>
              Sitio web, comercial, ingresos, operación, reparto entre las partes y Fondo salen solos. Completá lo que el sistema no sabe; si queda vacío, sale como «Sin informar».
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Mes" htmlFor="rm-mes">
              <Select id="rm-mes" value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="w-auto min-w-48">
                {(meses.includes(periodo) ? meses : [periodo, ...meses]).map((p) => (
                  <option key={p} value={p}>{etiquetaPeriodo(p)}</option>
                ))}
              </Select>
            </Field>
            <Field label="Costos cubiertos por MW (cláusula 3.1)" htmlFor="rm-costos" hint="Uno por renglón. Queda guardado para el mes que viene.">
              <Textarea id="rm-costos" rows={4} value={costosMw} onChange={(e) => setCostosMw(e.target.value)} placeholder={'Hosting y base de datos: US$ …\nPublicidad: $ …'} />
            </Field>
            <Field label="Novedades del producto" htmlFor="rm-evolucion" hint="Qué cambió en el mes: mejoras, lanzamientos, problemas.">
              <Textarea id="rm-evolucion" rows={4} value={evolucion} onChange={(e) => setEvolucion(e.target.value)} />
            </Field>
          </div>
          <DialogFooter>
            <Button onClick={descargar} loading={generando}>
              {!generando && <FileDown className="h-4 w-4" aria-hidden />}
              Descargar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
