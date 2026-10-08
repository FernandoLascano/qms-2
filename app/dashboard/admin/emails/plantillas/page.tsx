'use client'

import { useEffect, useState, useCallback } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import Link from 'next/link'
import { Plus, Pencil, Trash2, RefreshCw, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { etiquetaCategoria } from '@/lib/emails/categorias-plantilla'

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

      <PageHeader
        title="Plantillas de correo"
        description="Para usar al redactar o responder desde la bandeja. En el cuerpo podés usar variables como {{nombre}}."
        breadcrumbs={[{ label: 'Hoy', href: '/dashboard/admin' }, { label: 'Emails', href: '/dashboard/admin/emails' }, { label: 'Plantillas' }]}
        actions={
          <>
            <Button variant="ghost" onClick={load} loading={loading}>
              {!loading && <RefreshCw className="h-4 w-4" aria-hidden />}
              Actualizar
            </Button>
            <Button asChild>
              <Link href="/dashboard/admin/emails/plantillas/nuevo">
                <Plus className="h-4 w-4" aria-hidden />
                Nueva plantilla
              </Link>
            </Button>
          </>
        }
      />

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
                <tr className="border-b border-line bg-surface-2 text-left text-label font-semibold text-ink-2">
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
                    <td className="px-4 py-3 text-ink-2">{etiquetaCategoria(t.category, t.isSystem)}</td>
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
