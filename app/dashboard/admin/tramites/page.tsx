import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Calendar, Building2, User, DollarSign, Eye } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

async function AdminTramitesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.rol !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Obtener todos los trámites
  const todosTramites = await prisma.tramite.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Filtrar duplicados: si hay un trámite completado y un borrador con la misma denominación, mostrar solo el completado
  const tramitesMap = new Map()
  todosTramites.forEach((tramite: any) => {
    const key = tramite.denominacionSocial1
    const existing = tramitesMap.get(key)
    
    if (!existing) {
      tramitesMap.set(key, tramite)
    } else {
      // Si el nuevo es completado y el existente es borrador, reemplazar
      if (tramite.formularioCompleto && !existing.formularioCompleto) {
        tramitesMap.set(key, tramite)
      }
      // Si ambos son completados o ambos son borradores, mantener el más reciente
      else if (tramite.createdAt > existing.createdAt) {
        tramitesMap.set(key, tramite)
      }
    }
  })

  const tramites = Array.from(tramitesMap.values())

  const getEstadoColor = (tramite: any) => {
    const progreso = calcularProgreso(tramite)
    
    // Si está al 100%, mostrar verde (Completado)
    if (progreso === 100 || tramite.sociedadInscripta) {
      return 'bg-green-100 text-green-800 border-green-200'
    }
    
    // Si tiene formulario completado pero no está al 100%, mostrar azul (En Proceso)
    if (tramite.formularioCompleto && progreso < 100) {
      return 'bg-blue-100 text-blue-800 border-blue-200'
    }
    
    // Para otros estados
    switch (tramite.estadoGeneral) {
      case 'ESPERANDO_CLIENTE':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'ESPERANDO_APROBACION':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'CANCELADO':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getEstadoTexto = (tramite: any) => {
    const progreso = calcularProgreso(tramite)
    
    // Si está al 100%, mostrar "Completado"
    if (progreso === 100 || tramite.sociedadInscripta) {
      return 'Completado'
    }
    
    // Si tiene formulario completado pero no está al 100%, mostrar "En Proceso"
    if (tramite.formularioCompleto && progreso < 100) {
      return 'En Proceso'
    }
    
    // Para otros estados
    switch (tramite.estadoGeneral) {
      case 'ESPERANDO_CLIENTE': return 'Esperando Cliente'
      case 'ESPERANDO_APROBACION': return 'Esperando Aprobación'
      case 'INICIADO': return 'Iniciado'
      case 'CANCELADO': return 'Cancelado'
      default: return tramite.estadoGeneral
    }
  }

  // Calcular progreso (igual que en panel de usuario)
  const calcularProgreso = (tramite: any) => {
    const etapas = [
      tramite.formularioCompleto,
      tramite.denominacionReservada,
      tramite.capitalDepositado,
      tramite.tasaPagada,
      tramite.documentosFirmados,
      tramite.tramiteIngresado,
      tramite.sociedadInscripta
    ]
    const completadas = etapas.filter(Boolean).length
    return Math.round((completadas / etapas.length) * 100)
  }

  // Obtener la etapa actual del trámite
  const obtenerEtapaActual = (tramite: any) => {
    if (!tramite.formularioCompleto) return 'Formulario pendiente'
    if (!tramite.denominacionReservada) return 'Esperando reserva de denominación'
    if (!tramite.capitalDepositado) return 'Esperando depósito de capital'
    if (!tramite.tasaPagada) return 'Esperando pago de tasa'
    if (!tramite.documentosFirmados) return 'Esperando firma de documentos'
    if (!tramite.tramiteIngresado) return 'Esperando ingreso del trámite'
    if (!tramite.sociedadInscripta) return 'Esperando inscripción'
    return 'Sociedad inscripta'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-red-900">Gestión de Trámites</h2>
          <p className="text-gray-600 mt-1">
            Administra todos los trámites de la plataforma
          </p>
        </div>
        <Link href="/dashboard/admin">
          <Button variant="outline">
            ← Volver al Panel
          </Button>
        </Link>
      </div>

      {/* Filtros rápidos */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros Rápidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm">
              Todos ({tramites.length})
            </Button>
            <Button variant="outline" size="sm">
              Iniciados ({tramites.filter(t => t.estadoGeneral === 'INICIADO').length})
            </Button>
            <Button variant="outline" size="sm">
              En Proceso ({tramites.filter(t => {
                const progreso = calcularProgreso(t)
                return t.formularioCompleto && progreso < 100
              }).length})
            </Button>
            <Button variant="outline" size="sm">
              Esperando Cliente ({tramites.filter(t => t.estadoGeneral === 'ESPERANDO_CLIENTE').length})
            </Button>
            <Button variant="outline" size="sm">
              Completados ({tramites.filter(t => {
                const progreso = calcularProgreso(t)
                return progreso === 100 || t.sociedadInscripta
              }).length})
            </Button>
            <Button variant="outline" size="sm" className="bg-yellow-50 border-yellow-300 text-yellow-900 hover:bg-yellow-100">
              Pendientes Validación ({tramites.filter(t => t.estadoValidacion === 'PENDIENTE_VALIDACION').length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Trámites */}
      {tramites.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No hay trámites aún
              </h3>
              <p className="text-gray-500">
                Los trámites aparecerán aquí cuando los usuarios los creen
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tramites.map((tramite) => {
            const socios = (tramite.socios as any[]) || []
            const administradores = (tramite.administradores as any[]) || []
            const progreso = calcularProgreso(tramite)
            const etapaActual = obtenerEtapaActual(tramite)
            const esCompletado = progreso === 100 || tramite.sociedadInscripta
            
            return (
              <Card key={tramite.id} className={`hover:shadow-lg transition-shadow ${esCompletado ? 'border-green-300 bg-green-50/30' : ''}`}>
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
                    
                    <Link href={`/dashboard/admin/tramites/${tramite.id}`}>
                      <Button className="gap-2">
                        <Eye className="h-4 w-4" />
                        Gestionar
                      </Button>
                    </Link>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-gray-500 mb-1">Capital Social</p>
                      <p className="font-semibold text-gray-900">
                        ${tramite.capitalSocial.toLocaleString('es-AR')}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-gray-500 mb-1">Socios</p>
                      <p className="font-semibold text-gray-900">
                        {socios.length}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-gray-500 mb-1">Administradores</p>
                      <p className="font-semibold text-gray-900">
                        {administradores.length}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-gray-500 mb-1">Contacto</p>
                      <p className="font-semibold text-gray-900 text-xs">
                        {tramite.user.email}
                      </p>
                    </div>
                  </div>

                  {/* Barra de Progreso Mejorada */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-700">
                        Progreso del trámite
                      </span>
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
    </div>
  )
}

export default AdminTramitesPage

