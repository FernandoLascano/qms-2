'use client'

import { useEffect, useState, useCallback } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import Link from 'next/link'
import { ArrowLeft, Plus, Pencil, Trash2, RefreshCw, Shield } from 'lucide-react'
import { toast } from 'sonner'

interface EmailTpl {
  id: string
  name: string
  displayName: string
  subject: string
  category: string
  isActive: boolean
  isSystem: boolean
  updatedAt: string
}

export default function EmailPlantillasPage() {
  const [list, setList] = useState<EmailTpl[]>([])
  const [loading, setLoading] = useState(true)
  const [aEliminar, setAEliminar] = useState<{ id: string; displayName: string } | null>(null)
  const [eliminando, setEliminando] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/email-templates')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setList(data.templates || [])
    } catch {
      toast.error('No se pudieron cargar las plantillas')
      setList([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/email-templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || 'Error')
      }
      toast.success(isActive ? 'Desactivada' : 'Activada')
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error')
    }
  }

  const remove = async () => {
    const id = aEliminar?.id
    if (!id) return
    setEliminando(true)
    try {
      const res = await fetch(`/api/admin/email-templates/${id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Error al eliminar')
      toast.success('Plantilla eliminada')
      setAEliminar(null)
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error')
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/admin/emails"
        className="inline-flex items-center gap-2 text-body-sm text-ink-2 hover:text-ink-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a la bandeja
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-body-sm font-semibold text-primary uppercase tracking-wider">Correo</span>
          <h1 className="text-title font-semibold text-ink mt-1">Plantillas de correo</h1>
          <p className="text-ink-2 text-body-sm mt-1">
            Editá el HTML y el asunto; usalas al redactar desde la bandeja. Podés usar variables tipo{' '}
            <code className="text-label bg-surface-3 px-1 rounded">{'{{nombre}}'}</code> en el cuerpo.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 px-4 py-2 border border-line rounded-control text-body-sm font-medium text-ink-2 hover:bg-surface-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <Link
            href="/dashboard/admin/emails/plantillas/nuevo"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-control text-body-sm font-semibold hover:bg-primary-hover"
          >
            <Plus className="w-4 h-4" />
            Nueva plantilla
          </Link>
        </div>
      </div>

      <div className="bg-surface rounded-card border border-line shadow-raise overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-ink-2 text-body-sm">Cargando…</div>
        ) : list.length === 0 ? (
          <div className="py-16 text-center px-6">
            <p className="text-ink-2 font-medium">No hay plantillas en la base de datos.</p>
            <p className="text-ink-3 text-body-sm mt-2">Creá una nueva o insertá datos por SQL si migraste sin seed.</p>
            <Link
              href="/dashboard/admin/emails/plantillas/nuevo"
              className="inline-block mt-4 text-primary font-semibold hover:underline"
            >
              Crear plantilla
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-left text-label font-semibold text-ink-2 uppercase tracking-wider">
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Clave</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {list.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-2/80">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink">{t.displayName}</p>
                      <p className="text-label text-ink-2 truncate max-w-xs">{t.subject}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-label text-ink-2">{t.name}</td>
                    <td className="px-4 py-3 text-ink-2">{t.category}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleActive(t.id, t.isActive)}
                          className={`text-label font-semibold px-2 py-1 rounded-control ${
                            t.isActive ? 'bg-success-soft text-success' : 'bg-n-200 text-ink-2'
                          }`}
                        >
                          {t.isActive ? 'Activa' : 'Inactiva'}
                        </button>
                        {t.isSystem && (
                          <span className="inline-flex items-center gap-1 text-label text-warning" title="No se puede eliminar ni cambiar la clave">
                            <Shield className="w-3.5 h-3.5" />
                            Sistema
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/dashboard/admin/emails/plantillas/${t.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-control border border-line text-ink-2 hover:bg-surface-2 text-label font-semibold"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Editar
                        </Link>
                        {!t.isSystem && (
                          <button
                            type="button"
                            onClick={() => setAEliminar({ id: t.id, displayName: t.displayName })}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-control border border-danger-line text-danger hover:bg-danger-soft text-label font-semibold"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!aEliminar}
        onOpenChange={(abierto) => !abierto && setAEliminar(null)}
        title="¿Eliminar esta plantilla?"
        description={
          aEliminar
            ? `Se va a borrar «${aEliminar.displayName}». Los emails que la usen dejarán de encontrarla.`
            : undefined
        }
        confirmLabel="Eliminar plantilla"
        loading={eliminando}
        onConfirm={remove}
      />
    </div>
  )
}
