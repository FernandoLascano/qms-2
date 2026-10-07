'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { etiquetaPeriodo, moverPeriodo, periodoHoy } from '@/lib/comisiones'
import { descargarPdf } from './descargar'

/** Mes + botón para bajar el informe de gestión mensual en PDF. */
export function InformeGestion() {
  const hoy = periodoHoy()
  const meses = Array.from({ length: 12 }, (_, i) => moverPeriodo(hoy, -i))
  const [periodo, setPeriodo] = useState(hoy)
  const [generando, setGenerando] = useState(false)

  async function descargar() {
    setGenerando(true)
    try {
      await descargarPdf(`/api/admin/reportes/gestion?periodo=${periodo}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo generar el informe')
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={periodo} onChange={(e) => setPeriodo(e.target.value)} aria-label="Mes del informe" className="w-auto min-w-40">
        {meses.map((p) => (
          <option key={p} value={p}>{etiquetaPeriodo(p)}</option>
        ))}
      </Select>
      <Button onClick={descargar} loading={generando}>
        {!generando && <FileDown className="h-4 w-4" aria-hidden />}
        Informe de gestión
      </Button>
    </div>
  )
}
