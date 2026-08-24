'use client'

/**
 * Precios del catálogo de servicios.
 *
 * Los planes se editan en Configuración porque son tres y fijos. El catálogo
 * crece, así que vive en su propia tabla y se administra acá: agregar un
 * servicio es una fila, no una migración.
 */

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, RefreshCw, Loader2, Save, EyeOff, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { controlBase } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Modalidad = 'UNICO' | 'MENSUAL' | 'ANUAL' | 'SIN_COSTO' | 'A_CONSULTAR'

interface Servicio {
  id: string
  slug: string
  nombre: string
  descripcion: string
  icono: string
  modalidad: Modalidad
  precioDesde: number | null
  precioTexto: string | null
  comisionReferido: boolean
  notasInternas: string | null
  activo: boolean
  orden: number
}

const MODALIDADES: { valor: Modalidad; label: string; ayuda: string }[] = [
  { valor: 'UNICO', label: 'Pago único', ayuda: 'Se cobra una vez' },
  { valor: 'MENSUAL', label: 'Mensual', ayuda: 'Abono por mes' },
  { valor: 'ANUAL', label: 'Anual', ayuda: 'Abono por año' },
  { valor: 'SIN_COSTO', label: 'Sin costo', ayuda: 'No se le cobra al cliente' },
  { valor: 'A_CONSULTAR', label: 'A consultar', ayuda: 'Depende del caso, se cotiza' },
]

/** Cómo se le va a mostrar el precio al cliente, con los datos cargados. */
export function textoPrecio(s: Pick<Servicio, 'modalidad' | 'precioDesde' | 'precioTexto'>) {
  if (s.modalidad === 'SIN_COSTO') return 'Sin cargo'
  if (s.precioDesde == null) return 'Consultar'

  const monto = `$${s.precioDesde.toLocaleString('es-AR')}`
  const periodo = s.modalidad === 'MENSUAL' ? ' por mes' : s.modalidad === 'ANUAL' ? ' por año' : ''
  const extra = s.precioTexto ? ` ${s.precioTexto}` : ''
  return `Desde ${monto}${periodo}${extra}`
}

export default function ServiciosAdminPage() {
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const res = await fetch('/api/admin/servicios')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setServicios(data.servicios || [])
    } catch {
      toast.error('No se pudo cargar el catálogo')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const editar = (id: string, campos: Partial<Servicio>) =>
    setServicios((prev) => prev.map((s) => (s.id === id ? { ...s, ...campos } : s)))

  const guardar = async (s: Servicio) => {
    setGuardando(s.id)
    try {
      const res = await fetch('/api/admin/servicios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Guardado')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setGuardando(null)
    }
  }

  const crear = async () => {
    const res = await fetch('/api/admin/servicios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Servicio nuevo',
        descripcion: 'Describí acá de qué se trata.',
        modalidad: 'A_CONSULTAR',
        orden: (servicios.at(-1)?.orden ?? 0) + 10,
      }),
    })
    const data = await res.json()
    if (!res.ok) return toast.error(data.error || 'No se pudo crear')
    setServicios((prev) => [...prev, data.servicio])
    toast.success('Servicio creado — completá el nombre y el precio')
  }

  if (cargando) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <Link
        href="/dashboard/admin/configuracion"
        className="inline-flex items-center gap-2 text-body-sm text-ink-2 hover:text-ink"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a configuración
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <span className="text-body-sm font-semibold text-primary">Post-venta</span>
          <h1 className="text-title font-semibold text-ink mt-1">Catálogo de servicios</h1>
          <p className="text-ink-2 text-body-sm mt-1 max-w-2xl">
            Lo que ve el cliente en <strong>Servicios</strong> después de constituir. Sin precio
            cargado, la tarjeta dice «Consultar».
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={cargar}
            className="inline-flex items-center gap-2 px-4 py-2 border border-line rounded-control text-body-sm font-medium text-ink-2 hover:bg-surface-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
          <button
            type="button"
            onClick={crear}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-control text-body-sm font-semibold hover:bg-primary-hover"
          >
            <Plus className="w-4 h-4" />
            Nuevo servicio
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {servicios.map((s) => (
          <div
            key={s.id}
            className={cn(
              'bg-surface rounded-card border border-line shadow-raise p-5',
              !s.activo && 'opacity-60',
            )}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="min-w-0 flex-1">
                <input
                  value={s.nombre}
                  onChange={(e) => editar(s.id, { nombre: e.target.value })}
                  className={cn(controlBase, 'h-10 px-3 text-body font-semibold')}
                />
                <p className="text-label text-ink-3 font-mono mt-1">{s.slug}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => editar(s.id, { activo: !s.activo })}
                  title={s.activo ? 'Ocultar del catálogo' : 'Mostrar en el catálogo'}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-control border border-line text-label font-semibold text-ink-2 hover:bg-surface-2"
                >
                  {s.activo ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {s.activo ? 'Visible' : 'Oculto'}
                </button>
                <button
                  type="button"
                  onClick={() => guardar(s)}
                  disabled={guardando === s.id}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-control text-label font-semibold hover:bg-primary-hover disabled:opacity-50"
                >
                  {guardando === s.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Guardar
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-label font-semibold text-ink-2 mb-1">Modalidad</label>
                <select
                  value={s.modalidad}
                  onChange={(e) => editar(s.id, { modalidad: e.target.value as Modalidad })}
                  className={cn(controlBase, 'h-10 px-3 bg-surface')}
                >
                  {MODALIDADES.map((m) => (
                    <option key={m.valor} value={m.valor}>
                      {m.label} — {m.ayuda}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-label font-semibold text-ink-2 mb-1">
                  Precio desde <span className="font-normal text-ink-3">(vacío = Consultar)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={s.precioDesde ?? ''}
                  disabled={s.modalidad === 'SIN_COSTO'}
                  onChange={(e) =>
                    editar(s.id, { precioDesde: e.target.value === '' ? null : Number(e.target.value) })
                  }
                  className={cn(controlBase, 'h-10 px-3 tnum')}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-label font-semibold text-ink-2 mb-1">
                  Aclaración del precio
                </label>
                <input
                  value={s.precioTexto ?? ''}
                  placeholder="+ tasas por solicitud"
                  onChange={(e) => editar(s.id, { precioTexto: e.target.value })}
                  className={cn(controlBase, 'h-10 px-3')}
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-body-sm text-ink-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={s.comisionReferido}
                    onChange={(e) => editar(s.id, { comisionReferido: e.target.checked })}
                  />
                  Deja comisión por referido
                  <span className="text-label text-ink-3">(interno)</span>
                </label>
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-label font-semibold text-ink-2 mb-1">Descripción</label>
              <textarea
                value={s.descripcion}
                rows={2}
                onChange={(e) => editar(s.id, { descripcion: e.target.value })}
                className={cn(controlBase, 'px-3 py-2')}
              />
            </div>

            {/* Lo mismo que va a leer el cliente, para no tener que adivinarlo. */}
            <p className="text-label text-ink-3">
              El cliente ve: <strong className="text-ink-2">{textoPrecio(s)}</strong>
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
