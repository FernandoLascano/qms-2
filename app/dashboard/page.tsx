import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Clock, CheckCircle, AlertCircle, Plus, ArrowRight, Bell, Upload } from 'lucide-react'

async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return null
  }

  // Obtener trámites del usuario
  // Filtrar para evitar duplicados: si hay un trámite completado y un borrador con la misma denominación, mostrar solo el completado
  const todosTramites = await prisma.tramite.findMany({
    where: {
      userId: session.user.id
    },
    include: {
      pagos: {
        where: {
          estado: 'PENDIENTE'
        }
      },
      enlacesPago: {
        where: {
          estado: 'PENDIENTE'
        }
      },
      documentos: {
        where: {
          tipo: {
            in: ['ESTATUTO_PARA_FIRMAR', 'ACTA_PARA_FIRMAR', 'DOCUMENTO_PARA_FIRMAR']
          }
        }
      },
      notificaciones: {
        where: {
          leida: false
        },
        take: 5,
        orderBy: {
          createdAt: 'desc'
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
  
  // Filtrar duplicados: si hay un trámite completado y un borrador con la misma denominación, mostrar solo el completado
  const tramitesMap = new Map()
  todosTramites.forEach(tramite => {
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
  
  const tramites = Array.from(tramitesMap.values()).slice(0, 10)
  
  // Calcular progreso de cada trámite
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
    const completadas = etapas.filter(e => e).length
    return Math.round((completadas / etapas.length) * 100)
  }
  
  // Contar estados
  const totalTramites = tramites.length
  // "En Proceso" = trámites con formulario completado pero no al 100%
  const enProceso = tramites.filter(t => {
    const progreso = calcularProgreso(t)
    return t.formularioCompleto && progreso < 100
  }).length
  // "Completados" = trámites al 100% (sociedad inscripta)
  const completados = tramites.filter(t => {
    const progreso = calcularProgreso(t)
    return progreso === 100 || t.sociedadInscripta
  }).length
  // "Requieren Atención" = trámites con acciones pendientes del usuario
  const requierenAtencion = tramites.filter(t => {
    // Tiene pagos pendientes
    const tienePagosPendientes = t.pagos && t.pagos.length > 0
    // Tiene enlaces de pago pendientes
    const tieneEnlacesPendientes = t.enlacesPago && t.enlacesPago.length > 0
    // Tiene documentos para firmar pendientes
    const tieneDocumentosParaFirmar = t.documentos && t.documentos.length > 0
    // Estado esperando cliente
    const esperandoCliente = t.estadoGeneral === 'ESPERANDO_CLIENTE'
    
    return tienePagosPendientes || tieneEnlacesPendientes || tieneDocumentosParaFirmar || esperandoCliente
  }).length

  // Obtener notificaciones no leídas
  const notificacionesNoLeidas = await prisma.notificacion.count({
    where: {
      userId: session.user.id,
      leida: false
    }
  })

  const getEstadoColor = (tramite: any) => {
    // Calcular el progreso del trámite
    const progreso = calcularProgreso(tramite)
    
    // Si está al 100%, mostrar verde (Completado)
    if (progreso === 100 || tramite.sociedadInscripta) {
      return 'bg-green-100 text-green-800 border-green-200'
    }
    
    // Si tiene formulario completado pero no está al 100%, mostrar azul (En Proceso)
    if (tramite.formularioCompleto && progreso < 100) {
      return 'bg-blue-100 text-blue-800 border-blue-200'
    }
    
    // Para otros estados, usar el estado general
    switch (tramite.estadoGeneral) {
      case 'COMPLETADO':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'EN_PROCESO':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'ESPERANDO_CLIENTE':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'ESPERANDO_APROBACION':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getEstadoTexto = (tramite: any) => {
    // Calcular el progreso del trámite
    const progreso = calcularProgreso(tramite)
    
    // Si está al 100%, mostrar "Completado"
    if (progreso === 100 || tramite.sociedadInscripta) {
      return 'Completado'
    }
    
    // Si tiene formulario completado pero no está al 100%, mostrar "En Proceso"
    if (tramite.formularioCompleto && progreso < 100) {
      return 'En Proceso'
    }
    
    // Para otros estados, usar el estado general
    switch (tramite.estadoGeneral) {
      case 'COMPLETADO': return 'Completado'
      case 'EN_PROCESO': return 'En Proceso'
      case 'ESPERANDO_CLIENTE': return 'Requiere Atención'
      case 'ESPERANDO_APROBACION': return 'En Aprobación'
      case 'INICIADO': return 'Iniciado'
      default: return tramite.estadoGeneral
    }
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
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-red-900">¡Hola, {session.user.name}! 👋</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Resumen de tus trámites y acciones pendientes
          </p>
        </div>
        <Link href="/tramite/nuevo" className="w-full sm:w-auto">
          <Button size="lg" className="gap-2 bg-red-600 hover:bg-red-700 w-full sm:w-auto">
            <Plus className="h-5 w-5" />
            Nuevo Trámite
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trámites</CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{totalTramites}</div>
            <p className="text-xs text-gray-500 mt-1">
              Trámites iniciados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{enProceso}</div>
            <p className="text-xs text-gray-500 mt-1">
              Siendo procesados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">{completados}</div>
            <p className="text-xs text-gray-500 mt-1">
              Finalizados exitosamente
            </p>
          </CardContent>
        </Card>

        <Card className={requierenAtencion > 0 ? 'border-2 border-orange-300 bg-orange-50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requieren Atención</CardTitle>
            <AlertCircle className={`h-4 w-4 ${requierenAtencion > 0 ? 'text-orange-600 animate-pulse' : 'text-gray-400'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-xl sm:text-2xl font-bold ${requierenAtencion > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
              {requierenAtencion}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {requierenAtencion > 0 ? 'Acciones pendientes' : 'Todo al día'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trámites Activos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tus Trámites</CardTitle>
              <CardDescription>
                {totalTramites === 0 ? 'Aún no has iniciado ningún trámite' : `${totalTramites} trámite${totalTramites > 1 ? 's' : ''} en total`}
              </CardDescription>
            </div>
            {totalTramites > 0 && (
              <Link href="/dashboard/tramites">
                <Button variant="outline" size="sm" className="gap-2">
                  Ver Todos
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {tramites.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay trámites aún
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Comenzá tu primer trámite para constituir tu Sociedad por Acciones Simplificada (S.A.S.)
              </p>
              <Link href="/tramite/nuevo">
                <Button size="lg" className="gap-2 bg-red-600 hover:bg-red-700">
                  <Plus className="h-5 w-5" />
                  Iniciar Primer Trámite
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {tramites.slice(0, 5).map((tramite) => {
                const progreso = calcularProgreso(tramite)
                const tieneAccionesPendientes = 
                  (tramite.pagos && tramite.pagos.length > 0) ||
                  (tramite.enlacesPago && tramite.enlacesPago.length > 0) ||
                  (tramite.documentos && tramite.documentos.length > 0) ||
                  tramite.estadoGeneral === 'ESPERANDO_CLIENTE'
                
                // Si el formulario no está completo, redirigir al formulario para continuar
                const href = !tramite.formularioCompleto 
                  ? `/tramite/nuevo?tramiteId=${tramite.id}`
                  : `/dashboard/tramites/${tramite.id}`

                return (
                  <Link key={tramite.id} href={href}>
                    <div className={`
                      p-4 border-2 rounded-lg hover:shadow-md transition cursor-pointer
                      ${tieneAccionesPendientes 
                        ? 'border-orange-200 bg-orange-50 hover:border-orange-300' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">
                              {tramite.denominacionAprobada || tramite.denominacionSocial1}
                            </h4>
                            {tieneAccionesPendientes && (
                              <div className="relative">
                                <AlertCircle className="h-5 w-5 text-orange-600" />
                                <span className="absolute -top-1 -right-1 h-2 w-2 bg-orange-600 rounded-full animate-ping"></span>
                                <span className="absolute -top-1 -right-1 h-2 w-2 bg-orange-600 rounded-full"></span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {tramite.jurisdiccion === 'CORDOBA' ? 'Córdoba (IPJ)' : 'CABA (IGJ)'} • {tramite.plan}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getEstadoColor(tramite)}`}>
                          {getEstadoTexto(tramite)}
                        </span>
                      </div>

                      {/* Barra de Progreso */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600 font-medium">Progreso</span>
                          <span className="text-xs font-bold text-red-600">{progreso}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-red-600 to-green-500 transition-all duration-500"
                            style={{ width: `${progreso}%` }}
                          />
                        </div>
                        {/* Indicador de etapa actual */}
                        <p className="text-xs text-gray-600 mt-1">
                          {obtenerEtapaActual(tramite)}
                        </p>
                      </div>

                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acciones Rápidas */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/tramite/nuevo">
          <Card className="hover:shadow-lg transition cursor-pointer border-2 border-red-200 hover:border-red-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-900">
                <Plus className="h-5 w-5" />
                Nuevo Trámite
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Iniciá la constitución de una nueva S.A.S.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/notificaciones">
          <Card className="hover:shadow-lg transition cursor-pointer border-2 hover:border-blue-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificaciones
                {notificacionesNoLeidas > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-red-600 text-white rounded-full">
                    {notificacionesNoLeidas}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                {notificacionesNoLeidas > 0 
                  ? `Tenés ${notificacionesNoLeidas} notificación${notificacionesNoLeidas > 1 ? 'es' : ''} nueva${notificacionesNoLeidas > 1 ? 's' : ''}`
                  : 'Ver todas tus notificaciones'
                }
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/documentos">
          <Card className="hover:shadow-lg transition cursor-pointer border-2 hover:border-green-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Documentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Subí y gestioná tus documentos
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}

export default DashboardPage
