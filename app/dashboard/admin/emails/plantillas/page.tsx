'use client'

import { useEffect, useState, useCallback } from 'react'
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

  const remove = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la plantilla "${name}"? Esta acción no se puede deshacer.`)) return
    try {
      const res = await fetch(`/api/admin/email-templates/${id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Error al eliminar')
      toast.success('Plantilla eliminada')
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error')
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/admin/emails"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a la bandeja
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-sm font-semibold text-brand-700 uppercase tracking-wider">Correo</span>
          <h1 className="text-2xl font-black text-gray-900 mt-1">Plantillas de correo</h1>
          <p className="text-gray-500 text-sm mt-1">
            Editá el HTML y el asunto; usalas al redactar desde la bandeja. Podés usar variables tipo{' '}
            <code className="text-xs bg-gray-100 px-1 rounded">{'{{nombre}}'}</code> en el cuerpo.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <Link
            href="/dashboard/admin/emails/plantillas/nuevo"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-700 text-white rounded-xl text-sm font-semibold hover:bg-brand-800"
          >
            <Plus className="w-4 h-4" />
            Nueva plantilla
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-gray-500 text-sm">Cargando…</div>
        ) : list.length === 0 ? (
          <div className="py-16 text-center px-6">
            <p className="text-gray-600 font-medium">No hay plantillas en la base de datos.</p>
            <p className="text-gray-400 text-sm mt-2">Creá una nueva o insertá datos por SQL si migraste sin seed.</p>
            <Link
              href="/dashboard/admin/emails/plantillas/nuevo"
              className="inline-block mt-4 text-brand-700 font-semibold hover:underline"
            >
              Crear plantilla
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Clave</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {list.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{t.displayName}</p>
                      <p className="text-xs text-gray-500 truncate max-w-xs">{t.subject}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{t.name}</td>
                    <td className="px-4 py-3 text-gray-600">{t.category}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleActive(t.id, t.isActive)}
                          className={`text-xs font-bold px-2 py-1 rounded-lg ${
                            t.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {t.isActive ? 'Activa' : 'Inactiva'}
                        </button>
                        {t.isSystem && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-700" title="No se puede eliminar ni cambiar la clave">
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
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Editar
                        </Link>
                        {!t.isSystem && (
                          <button
                            type="button"
                            onClick={() => remove(t.id, t.displayName)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold"
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
    </div>
  )
}
