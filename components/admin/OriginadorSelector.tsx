'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'

const OPCIONES = [
  { valor: 'NINGUNO', texto: 'Nadie: entró solo (web o publicidad)' },
  { valor: 'FERNANDO', texto: 'Fernando' },
  { valor: 'JUSTINIANO', texto: 'Justiniano' },
  { valor: 'MW', texto: 'MW (otro miembro del estudio)' },
]

/**
 * Quién trajo al cliente, registrado ANTES del primer cobro.
 *
 * Cláusula 4.2 b del contrato: la originación sólo se reconoce si quedó
 * registrada en la plataforma antes del primer cobro. Hasta ahora sólo se
 * podía poner en el movimiento de comisión, que existe recién cuando ya se
 * cobró. Acá se registra en el trámite o en el lead, con la fecha, y el
 * cobro de honorarios la toma sola si se registró a tiempo.
 */
export function OriginadorSelector({
  tipo,
  id,
  originador,
  registradoEn,
  className,
}: {
  tipo: 'TRAMITE' | 'LEAD'
  id: string
  originador: string
  registradoEn: string | null
  className?: string
}) {
  const router = useRouter()
  const [valor, setValor] = useState(originador)
  const [guardando, setGuardando] = useState(false)

  async function cambiar(nuevo: string) {
    const anterior = valor
    setValor(nuevo)
    setGuardando(true)
    try {
      const res = await fetch('/api/admin/originador', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, id, originador: nuevo }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (nuevo !== 'NINGUNO' && data.cobrosPrevios > 0) {
        toast.warning('Quedó registrado, pero ya había un cobro: según el contrato (4.2 b), ese cobro no genera comisión de originación.')
      } else {
        toast.success(nuevo === 'NINGUNO' ? 'Sin originador' : 'Originador registrado')
      }
      router.refresh()
    } catch (e) {
      setValor(anterior)
      toast.error(e instanceof Error ? e.message : 'No se pudo guardar')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={`originador-${id}`} className="block text-label text-ink-2">¿Quién trajo al cliente?</label>
      <Select
        id={`originador-${id}`}
        value={valor}
        disabled={guardando}
        onChange={(e) => cambiar(e.target.value)}
        size="sm"
        className="h-9"
      >
        {OPCIONES.map((o) => <option key={o.valor} value={o.valor}>{o.texto}</option>)}
      </Select>
      <p className="text-label text-ink-3">
        {valor !== 'NINGUNO' && registradoEn
          ? `Registrado el ${new Date(registradoEn).toLocaleDateString('es-AR')}. Sólo cuenta para cobros posteriores.`
          : 'Para que la originación cuente, registrala antes del primer cobro (contrato, 4.2 b).'}
      </p>
    </div>
  )
}
