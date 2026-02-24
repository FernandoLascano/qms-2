import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Clock, CheckCircle, AlertCircle, Plus, ArrowRight, Bell, Upload, TrendingUp } from 'lucide-react'

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
        },
        select: { id: true, monto: true }
      },
      enlacesPago: {
        where: {
          estado: 'PENDIENTE'
        },
        select: { id: true, monto: true }
      },
      documentos: {
        where: {
          tipo: {
            in: ['ESTATUTO_PARA_FIRMAR', 'ACTA_PARA_FIRMAR', 'DOCUMENTO_PARA_FIRMAR']
          }
        },
        select: { id: true, nombre: true }
      },
      notificaciones: {
        where: {
          leida: false
        },
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        select: { id: true, titulo: true }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 20
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

  // Obtener el nombre de visualización del usuario (primer nombre)
  const firstName = session.user.name?.split(' ')[0] || 'Usuario'

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <span className="inline-block text-brand-700 font-semibold text-sm tracking-wider uppercase mb-2">
            Dashboard
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900">
            Hola, <span className="text-brand-700">{firstName}</span>
          </h2>
          <p className="text-gray-500 mt-2 text-lg">
            Resumen de tus trámites y acciones pendientes
          </p>
        </div>
        <Link href="/tramite/nuevo" className="w-full sm:w-auto">
          <Button size="lg" className="gap-2 bg-brand-700 hover:bg-brand-800 w-full sm:w-auto rounded-xl shadow-lg shadow-brand-200 h-12 px-6 text-base font-semibold">
            <Plus className="h-5 w-5" />
            Nuevo Trámite
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg hover:border-gray-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Trámites</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-900">{totalTramites}</div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Trámites iniciados
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg hover:border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">En Proceso</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-blue-600">{enProceso}</div>
            <p className="text-xs text-gray-500 mt-1">
              Siendo procesados
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg hover:border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completados</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-green-600">{completados}</div>
            <p className="text-xs text-gray-500 mt-1">
              Finalizados exitosamente
            </p>
          </CardContent>
        </Card>

        <Card className={`hover:shadow-lg ${requierenAtencion > 0 ? 'border-2 border-orange-300 bg-orange-50' : 'hover:border-orange-200'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Requieren Atención</CardTitle>
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${requierenAtencion > 0 ? 'bg-orange-200' : 'bg-orange-100'}`}>
              <AlertCircle className={`h-5 w-5 ${requierenAtencion > 0 ? 'text-orange-600 animate-pulse' : 'text-orange-400'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-black ${requierenAtencion > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
              {requierenAtencion}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {requierenAtencion > 0 ? 'Acciones pendientes' : 'Todo al día'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trámites Activos */}
      <Card className="shadow-lg">
        <CardHeader className="border-b border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-black text-gray-900">Tus Trámites</CardTitle>
              <CardDescription className="mt-1">
                {totalTramites === 0 ? 'Aún no has iniciado ningún trámite' : `${totalTramites} trámite${totalTramites > 1 ? 's' : ''} en total`}
              </CardDescription>
            </div>
            {totalTramites > 0 && (
              <Link href="/dashboard/tramites">
                <Button variant="outline" size="sm" className="gap-2 rounded-xl border-gray-300 hover:border-brand-300 hover:text-brand-700">
                  Ver Todos
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {tramites.length === 0 ? (
            <div className="text-center py-16">
              <div className="h-20 w-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <FileText className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No hay trámites aún
              </h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Comenzá tu primer trámite para constituir tu Sociedad por Acciones Simplificada (S.A.S.)
              </p>
              <Link href="/tramite/nuevo">
                <Button size="lg" className="gap-2 bg-brand-700 hover:bg-brand-800 rounded-xl shadow-lg shadow-brand-200">
                  <Plus className="h-5 w-5" />
                  Iniciar Nuevo Trámite
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
                      p-5 border-2 rounded-2xl hover:shadow-lg transition-all duration-200 cursor-pointer group
                      ${tieneAccionesPendientes
                        ? 'border-orange-200 bg-orange-50/50 hover:border-orange-300'
                        : 'border-gray-200 hover:border-brand-200'
                      }
                    `}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-bold text-gray-900 text-lg group-hover:text-brand-700 transition-colors">
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
                        <span className={`px-4 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap ${getEstadoColor(tramite)}`}>
                          {getEstadoTexto(tramite)}
                        </span>
                      </div>

                      {/* Barra de Progreso */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600 font-medium">Progreso</span>
                          <span className="text-sm font-bold text-brand-700">{progreso}%</span>
                        </div>
                        <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-brand-600 to-green-500 transition-all duration-500 rounded-full"
                            style={{ width: `${progreso}%` }}
                          />
                        </div>
                        {/* Indicador de etapa actual */}
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                          <Clock className="h-3 w-3" />
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
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/tramite/nuevo" className="group">
            <Card className="hover:shadow-xl hover:border-brand-300 transition-all duration-200 h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-xl bg-brand-100 flex items-center justify-center group-hover:bg-brand-700 transition-colors">
                    <Plus className="h-6 w-6 text-brand-700 group-hover:text-white transition-colors" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-brand-700 group-hover:translate-x-1 transition-all" />
                </div>
                <CardTitle className="text-lg font-bold text-gray-900 mt-4 group-hover:text-brand-700 transition-colors">
                  Nuevo Trámite
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Iniciá la constitución de una nueva S.A.S.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/notificaciones" className="group">
            <Card className="hover:shadow-xl hover:border-blue-300 transition-all duration-200 h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-600 transition-colors relative">
                    <Bell className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors" />
                    {notificacionesNoLeidas > 0 && (
                      <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-bold bg-brand-600 text-white rounded-full">
                        {notificacionesNoLeidas}
                      </span>
                    )}
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
                <CardTitle className="text-lg font-bold text-gray-900 mt-4 group-hover:text-blue-600 transition-colors">
                  Notificaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  {notificacionesNoLeidas > 0
                    ? `Tenés ${notificacionesNoLeidas} notificación${notificacionesNoLeidas > 1 ? 'es' : ''} nueva${notificacionesNoLeidas > 1 ? 's' : ''}`
                    : 'Ver todas tus notificaciones'
                  }
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/documentos" className="group">
            <Card className="hover:shadow-xl hover:border-green-300 transition-all duration-200 h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center group-hover:bg-green-600 transition-colors">
                    <Upload className="h-6 w-6 text-green-600 group-hover:text-white transition-colors" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
                </div>
                <CardTitle className="text-lg font-bold text-gray-900 mt-4 group-hover:text-green-600 transition-colors">
                  Documentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Subí y gestioná tus documentos
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
