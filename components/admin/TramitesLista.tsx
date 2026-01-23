'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Calendar, Building2, User, DollarSign, Eye, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import TramitesFiltros from './TramitesFiltros'
import { calcularProgreso, getEstadoColor, getEstadoTexto, obtenerEtapaActual } from '@/lib/tramites-helpers'

type FiltroTipo = 'TODOS' | 'INICIADOS' | 'EN_PROCESO' | 'ESPERANDO_CLIENTE' | 'COMPLETADOS' | 'PENDIENTE_VALIDACION'

interface TramitesListaProps {
  tramites: any[]
}

export default function TramitesLista({ tramites }: TramitesListaProps) {
  const router = useRouter()
  const [filtroActivo, setFiltroActivo] = useState<FiltroTipo>('TODOS')
  const [tramiteAEliminar, setTramiteAEliminar] = useState<string | null>(null)
  const [eliminando, setEliminando] = useState(false)

  const tramitesFiltrados = tramites.filter(tramite => {
    switch (filtroActivo) {
      case 'INICIADOS':
        return tramite.estadoGeneral === 'INICIADO'
      case 'EN_PROCESO':
        const progreso = calcularProgreso(tramite)
        return tramite.formularioCompleto && progreso < 100
      case 'ESPERANDO_CLIENTE':
        return tramite.estadoGeneral === 'ESPERANDO_CLIENTE'
      case 'COMPLETADOS':
        const progresoCompleto = calcularProgreso(tramite)
        return progresoCompleto === 100 || tramite.sociedadInscripta
      case 'PENDIENTE_VALIDACION':
        return tramite.estadoValidacion === 'PENDIENTE_VALIDACION'
      case 'TODOS':
      default:
        return true
    }
  })

  // Verificar si un trámite está protegido
  const esTramiteProtegido = (denominacion: string) => {
    const tramitesProtegidos = [
      'DRIX SAS',
      'SPEED AI SOFTWARE',
      'ADOCOR SERVICIOS DE CONSTRUCCION SAS',
      'Drixs SAS',
      'Speed AI Software',
      'Adocor Servicios de Construccion SAS'
    ]
    return tramitesProtegidos.some(protegido => denominacion.toUpperCase().includes(protegido.toUpperCase()))
  }

  const handleEliminar = async () => {
    if (!tramiteAEliminar) return

    setEliminando(true)
    try {
      const response = await fetch(`/api/admin/tramites/${tramiteAEliminar}/eliminar`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || 'Trámite eliminado exitosamente')
        setTramiteAEliminar(null)
        router.refresh()
      } else {
        toast.error(data.error || 'Error al eliminar el trámite')
      }
    } catch (error) {
      console.error('Error al eliminar trámite:', error)
      toast.error('Error al eliminar el trámite')
    } finally {
      setEliminando(false)
    }
  }

  return (
    <>
      <TramitesFiltros
        tramites={tramites}
        onFiltroChange={setFiltroActivo}
      />

      {tramitesFiltrados.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No hay trámites con este filtro
              </h3>
              <p className="text-gray-500">
                Intenta con otro filtro para ver más trámites
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tramitesFiltrados.map((tramite) => {
            const socios = (tramite.socios as any[]) || []
            const administradores = (tramite.administradores as any[]) || []
            const progreso = calcularProgreso(tramite)
            const etapaActual = obtenerEtapaActual(tramite)
            const esCompletado = progreso === 100 || tramite.sociedadInscripta

            return (
              <Card
                key={tramite.id}
                className={`hover:shadow-lg transition-shadow ${esCompletado ? 'border-green-300 bg-green-50/30' : ''}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {tramite.denominacionAprobada || tramite.denominacionSocial1}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(tramite)}`}>
                          {getEstadoTexto(tramite)}
                        </span>
                        {tramite.estadoValidacion === 'PENDIENTE_VALIDACION' && (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-500 text-white animate-pulse">
                            ⚠ Pendiente Validación
                          </span>
                        )}
                        {esCompletado && (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-600 text-white">
                            ✓ Completado
                          </span>
                        )}
                      </div>
                      <div className="mb-2">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Etapa actual:</span> {etapaActual}
                        </p>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {tramite.user.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(tramite.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {tramite.jurisdiccion === 'CORDOBA' ? 'Córdoba' : 'CABA'}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          Plan {tramite.plan}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/admin/tramites/${tramite.id}`}>
                        <Button className="gap-2">
                          <Eye className="h-4 w-4" />
                          Gestionar
                        </Button>
                      </Link>
                      {!esTramiteProtegido(tramite.denominacionAprobada || tramite.denominacionSocial1) && (
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => setTramiteAEliminar(tramite.id)}
                          className="gap-2"
                          title="Eliminar trámite"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-gray-500 mb-1">Capital Social</p>
                      <p className="font-semibold text-gray-900">${tramite.capitalSocial.toLocaleString('es-AR')}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-gray-500 mb-1">Socios</p>
                      <p className="font-semibold text-gray-900">{socios.length}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-gray-500 mb-1">Administradores</p>
                      <p className="font-semibold text-gray-900">{administradores.length}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-gray-500 mb-1">Contacto</p>
                      <p className="font-semibold text-gray-900 text-xs">{tramite.user.email}</p>
                    </div>
                  </div>

                  {/* Barra de Progreso */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-700">Progreso del trámite</span>
                      <span className={`text-xs font-bold ${esCompletado ? 'text-green-600' : 'text-red-600'}`}>
                        {progreso}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all ${
                          esCompletado
                            ? 'bg-gradient-to-r from-green-500 to-green-600'
                            : 'bg-gradient-to-r from-red-600 to-red-700'
                        }`}
                        style={{ width: `${progreso}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                      {tramite.formularioCompleto && <span className="text-green-600">✓ Formulario</span>}
                      {tramite.denominacionReservada && <span className="text-green-600">• ✓ Denominación</span>}
                      {tramite.capitalDepositado && <span className="text-green-600">• ✓ Capital</span>}
                      {tramite.tasaPagada && <span className="text-green-600">• ✓ Tasa</span>}
                      {tramite.documentosFirmados && <span className="text-green-600">• ✓ Documentos</span>}
                      {tramite.tramiteIngresado && <span className="text-green-600">• ✓ Ingresado</span>}
                      {tramite.sociedadInscripta && <span className="text-green-600">• ✓ Inscripta</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog de confirmación de eliminación */}
      <Dialog open={!!tramiteAEliminar} onOpenChange={(open) => !open && setTramiteAEliminar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar trámite?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todos los datos relacionados con este trámite
              (documentos, pagos, notificaciones, mensajes, etc.).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTramiteAEliminar(null)}
              disabled={eliminando}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleEliminar}
              disabled={eliminando}
            >
              {eliminando ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
