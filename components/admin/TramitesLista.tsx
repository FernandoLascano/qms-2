'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { Building2, FileText, Search, Trash2, User } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { EmptyState } from '@/components/ui/states'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import TramitesFiltros, {
  FILTRO_POR_SLUG,
  SLUG_POR_FILTRO,
  type FiltroTipo,
} from './TramitesFiltros'
import { calcularProgreso, etapaActual, getEstado } from '@/lib/tramites/estado'
import { cn } from '@/lib/utils'

/** Trámites que no se pueden borrar desde la interfaz. */
const PROTEGIDOS = [
  'DRIX SAS',
  'SPEED AI SOFTWARE',
  'ADOCOR SERVICIOS DE CONSTRUCCION SAS',
]

const esProtegido = (denominacion: string) =>
  PROTEGIDOS.some((p) => denominacion.toUpperCase().includes(p.toUpperCase()))

const coincideFiltro = (tramite: any, filtro: FiltroTipo) => {
  switch (filtro) {
    case 'PENDIENTE_VALIDACION':
      return tramite.estadoValidacion === 'PENDIENTE_VALIDACION'
    case 'DOCUMENTOS_PENDIENTES':
      return (tramite._count?.documentos ?? 0) > 0
    case 'ESPERANDO_CLIENTE':
      return tramite.estadoGeneral === 'ESPERANDO_CLIENTE'
    case 'EN_PROCESO':
      return !tramite.sociedadInscripta && calcularProgreso(tramite) < 100
    case 'COMPLETADOS':
      return tramite.sociedadInscripta || calcularProgreso(tramite) === 100
    default:
      return true
  }
}

export default function TramitesLista({ tramites }: { tramites: any[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const filtroUrl = FILTRO_POR_SLUG[searchParams.get('filter') ?? ''] ?? 'TODOS'
  const [busqueda, setBusqueda] = useState('')
  const [aEliminar, setAEliminar] = useState<string | null>(null)
  const [eliminando, setEliminando] = useState(false)

  // El filtro vive en la URL: así los enlaces del panel "Hoy" funcionan de
  // verdad. Antes apuntaban a ?filter=… y este componente no lo leía.
  const cambiarFiltro = (nuevo: FiltroTipo) => {
    const url =
      nuevo === 'TODOS'
        ? '/dashboard/admin/tramites'
        : `/dashboard/admin/tramites?filter=${SLUG_POR_FILTRO[nuevo]}`
    router.replace(url, { scroll: false })
  }

  const contadores = useMemo(
    () =>
      ({
        TODOS: tramites.length,
        PENDIENTE_VALIDACION: tramites.filter((t) => coincideFiltro(t, 'PENDIENTE_VALIDACION'))
          .length,
        DOCUMENTOS_PENDIENTES: tramites.filter((t) => coincideFiltro(t, 'DOCUMENTOS_PENDIENTES'))
          .length,
        ESPERANDO_CLIENTE: tramites.filter((t) => coincideFiltro(t, 'ESPERANDO_CLIENTE')).length,
        EN_PROCESO: tramites.filter((t) => coincideFiltro(t, 'EN_PROCESO')).length,
        COMPLETADOS: tramites.filter((t) => coincideFiltro(t, 'COMPLETADOS')).length,
      }) as Record<FiltroTipo, number>,
    [tramites],
  )

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return tramites.filter((t) => {
      if (!coincideFiltro(t, filtroUrl)) return false
      if (!q) return true
      return [t.denominacionAprobada, t.denominacionSocial1, t.user?.name, t.user?.email]
        .filter(Boolean)
        .some((campo: string) => campo.toLowerCase().includes(q))
    })
  }, [tramites, filtroUrl, busqueda])

  const eliminar = async () => {
    if (!aEliminar) return
    setEliminando(true)
    try {
      const res = await fetch(`/api/admin/tramites/${aEliminar}/eliminar`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Trámite eliminado')
        setAEliminar(null)
        router.refresh()
      } else {
        toast.error(data.error || 'No se pudo eliminar el trámite')
      }
    } catch {
      toast.error('No se pudo eliminar el trámite')
    } finally {
      setEliminando(false)
    }
  }

  const tramiteAEliminar = tramites.find((t) => t.id === aEliminar)

  return (
    <div className="space-y-4">
      {/* Barra de herramientas */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <TramitesFiltros contadores={contadores} activo={filtroUrl} onChange={cambiarFiltro} />
        <div className="relative lg:w-72">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3"
            aria-hidden
          />
          <Input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por sociedad o cliente"
            aria-label="Buscar trámites"
            className="pl-9"
          />
        </div>
      </div>

      {/* Listado denso */}
      {visibles.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title={busqueda ? 'Sin resultados' : 'No hay trámites con este filtro'}
            description={
              busqueda
                ? `No encontramos nada que coincida con «${busqueda}».`
                : 'Probá con otro filtro para ver más trámites.'
            }
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-line">
            {visibles.map((tramite) => {
              const estado = getEstado(tramite, 'admin')
              const progreso = calcularProgreso(tramite)
              const docsPendientes = tramite._count?.documentos ?? 0
              const nombre = tramite.denominacionAprobada || tramite.denominacionSocial1

              return (
                <li
                  key={tramite.id}
                  className="group relative flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/dashboard/admin/tramites/${tramite.id}`}
                        className="truncate rounded-chip text-body font-medium text-ink hover:text-primary"
                      >
                        {/* Área clickeable extendida a toda la fila */}
                        <span className="absolute inset-0" aria-hidden />
                        {nombre}
                      </Link>
                      <Badge tone={estado.tone} dot>
                        {estado.label}
                      </Badge>
                      {docsPendientes > 0 && (
                        <Badge tone="warning">{docsPendientes} doc. por aprobar</Badge>
                      )}
                    </div>

                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-body-sm text-ink-2">
                      <span className="inline-flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-ink-3" aria-hidden />
                        {tramite.user.name}
                      </span>
                      <span className="hidden items-center gap-2 sm:inline-flex">
                        <Building2 className="h-3.5 w-3.5 text-ink-3" aria-hidden />
                        {tramite.jurisdiccion === 'CORDOBA' ? 'Córdoba' : 'CABA'}
                      </span>
                      <span className="hidden sm:inline">Plan {tramite.plan}</span>
                      <span className="text-ink-3">{etapaActual(tramite, 'admin')}</span>
                    </div>
                  </div>

                  {/* Progreso */}
                  <div className="hidden w-32 shrink-0 md:block">
                    <Progress
                      value={progreso}
                      size="sm"
                      tone={progreso === 100 ? 'success' : 'primary'}
                      label={`${nombre}: ${progreso}%`}
                    />
                    <p className="mt-1 text-right text-label text-ink-3 tnum">{progreso}%</p>
                  </div>

                  <time
                    dateTime={new Date(tramite.updatedAt ?? tramite.createdAt).toISOString()}
                    className="hidden w-20 shrink-0 text-right text-body-sm text-ink-3 tnum lg:block"
                  >
                    {format(new Date(tramite.updatedAt ?? tramite.createdAt), 'd MMM', {
                      locale: es,
                    })}
                  </time>

                  {!esProtegido(nombre) && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Eliminar ${nombre}`}
                      onClick={() => setAEliminar(tramite.id)}
                      className={cn(
                        'relative z-10 shrink-0 text-ink-3',
                        'hover:bg-danger-soft hover:text-danger',
                      )}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      {/* Confirmación: el único botón rojo relleno del sistema */}
      <Dialog open={!!aEliminar} onOpenChange={(open) => !open && setAEliminar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar este trámite?</DialogTitle>
            <DialogDescription>
              Vas a borrar{' '}
              {tramiteAEliminar
                ? `«${tramiteAEliminar.denominacionAprobada || tramiteAEliminar.denominacionSocial1}»`
                : 'el trámite'}{' '}
              junto con sus documentos, pagos, notificaciones y mensajes. No se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setAEliminar(null)} disabled={eliminando}>
              Cancelar
            </Button>
            <Button variant="danger-solid" onClick={eliminar} loading={eliminando}>
              Eliminar definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
