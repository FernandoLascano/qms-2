import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Users, Clock, CheckCircle, AlertCircle, TrendingUp, ArrowRight, Calendar, CreditCard, BookOpen } from 'lucide-react'
import Link from 'next/link'

async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)

  // Verificar que sea admin
  if (!session?.user?.id || session.user.rol !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Obtener todos los trámites para calcular correctamente
  const todosTramites = await prisma.tramite.findMany({
    select: {
      id: true,
      formularioCompleto: true,
      denominacionReservada: true,
      capitalDepositado: true,
      tasaPagada: true,
      documentosFirmados: true,
      tramiteIngresado: true,
      sociedadInscripta: true
    }
  })

  // Función para calcular progreso (igual que en panel de usuario)
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

  // Calcular estadísticas basadas en progreso (igual que panel de usuario)
  const totalTramites = todosTramites.length
  const enProceso = todosTramites.filter(t => {
    const progreso = calcularProgreso(t)
    return t.formularioCompleto && progreso < 100
  }).length
  const completados = todosTramites.filter(t => {
    const progreso = calcularProgreso(t)
    return progreso === 100 || t.sociedadInscripta
  }).length

  // Obtener otras estadísticas
  const [
    tramitesIniciados,
    tramitesEsperandoCliente,
    totalUsuarios,
    documentosPendientes,
    tramitesPendientesValidacion,
    tramitesRecientes
  ] = await Promise.all([
    prisma.tramite.count({ where: { estadoGeneral: 'INICIADO' } }),
    prisma.tramite.count({ where: { estadoGeneral: 'ESPERANDO_CLIENTE' } }),
    prisma.user.count(),
    prisma.documento.count({ where: { estado: 'PENDIENTE' } }),
    prisma.tramite.count({ where: { estadoValidacion: 'PENDIENTE_VALIDACION' } }),
    prisma.tramite.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-red-900">Panel de Administración</h2>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Gestiona todos los trámites y usuarios de la plataforma
        </p>
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
              Todos los trámites en el sistema
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
              Requieren tu atención
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esperando Cliente</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-orange-600">{tramitesEsperandoCliente}</div>
            <p className="text-xs text-gray-500 mt-1">
              Acción del cliente requerida
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerta de Trámites Pendientes de Validación */}
      {tramitesPendientesValidacion > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-yellow-900 mb-1">
                Trámites Pendientes de Validación
              </h3>
              <p className="text-sm text-yellow-800 mb-4">
                Tienes <strong>{tramitesPendientesValidacion}</strong> trámite{tramitesPendientesValidacion !== 1 ? 's' : ''} esperando tu revisión inicial.
              </p>
              <Link href="/dashboard/admin/tramites?filter=pendientes-validacion">
                <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">
                  Ver Trámites Pendientes
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Adicionales */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Registrados</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-purple-600">{totalUsuarios}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documentos Pendientes</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-orange-600">{documentosPendientes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Iniciados</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{tramitesIniciados}</div>
          </CardContent>
        </Card>
      </div>

      {/* Acciones Rápidas */}
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-red-900 mb-2">⚡ Acciones Rápidas</h2>
        <p className="text-gray-600 mb-6">Accesos directos a funciones administrativas</p>
        
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {/* Ver Trámites */}
          <Link href="/dashboard/admin/tramites" className="group">
            <div className="bg-white hover:bg-red-50 border-2 border-gray-200 hover:border-red-700 rounded-xl p-6 transition-all duration-200 hover:shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-red-100 rounded-lg group-hover:bg-red-700 transition-colors">
                  <FileText className="h-6 w-6 text-red-700 group-hover:text-white transition-colors" />
                </div>
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {totalTramites}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Ver Todos los Trámites</h3>
              <p className="text-sm text-gray-600">
                Gestionar y revisar todos los trámites del sistema
              </p>
            </div>
          </Link>

          {/* Documentos Pendientes */}
          <Link href="/dashboard/admin/tramites?filter=documentos-pendientes" className="group">
            <div className="bg-white hover:bg-yellow-50 border-2 border-gray-200 hover:border-yellow-500 rounded-xl p-6 transition-all duration-200 hover:shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-yellow-100 rounded-lg group-hover:bg-yellow-500 transition-colors">
                  <FileText className="h-6 w-6 text-yellow-600 group-hover:text-white transition-colors" />
                </div>
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  Revisar
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Documentos Pendientes</h3>
              <p className="text-sm text-gray-600">
                Aprobar o rechazar documentos subidos por clientes
              </p>
            </div>
          </Link>

          {/* Analytics */}
          <Link href="/dashboard/admin/analytics" className="group">
            <div className="bg-white hover:bg-purple-50 border-2 border-gray-200 hover:border-purple-500 rounded-xl p-6 transition-all duration-200 hover:shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-500 transition-colors">
                  <TrendingUp className="h-6 w-6 text-purple-600 group-hover:text-white transition-colors" />
                </div>
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  Nuevo
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Dashboard Analytics</h3>
              <p className="text-sm text-gray-600">
                Ver métricas, gráficos y reportes en tiempo real
              </p>
            </div>
          </Link>

          {/* Calendario */}
          <Link href="/dashboard/admin/calendario" className="group">
            <div className="bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-500 rounded-xl p-6 transition-all duration-200 hover:shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-500 transition-colors">
                  <Calendar className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Calendario de Eventos</h3>
              <p className="text-sm text-gray-600">
                Reuniones, vencimientos y fechas importantes
              </p>
            </div>
          </Link>

          {/* Tracking de Tiempo */}
          <Link href="/dashboard/admin/tracking-tiempo" className="group">
            <div className="bg-white hover:bg-green-50 border-2 border-gray-200 hover:border-green-500 rounded-xl p-6 transition-all duration-200 hover:shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-500 transition-colors">
                  <Clock className="h-6 w-6 text-green-600 group-hover:text-white transition-colors" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Tracking de Tiempo</h3>
              <p className="text-sm text-gray-600">
                Analiza tiempos promedio y cuellos de botella
              </p>
            </div>
          </Link>

          {/* Configuración de Cuentas Bancarias */}
          <Link href="/dashboard/admin/configuracion-cuentas" className="group">
            <div className="bg-white hover:bg-indigo-50 border-2 border-gray-200 hover:border-indigo-500 rounded-xl p-6 transition-all duration-200 hover:shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-500 transition-colors">
                  <CreditCard className="h-6 w-6 text-indigo-600 group-hover:text-white transition-colors" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Cuentas Bancarias</h3>
              <p className="text-sm text-gray-600">
                Configurar cuentas pre-establecidas para transferencias
              </p>
            </div>
          </Link>

          {/* Gestión del Blog */}
          <Link href="/dashboard/admin/blog" className="group">
            <div className="bg-white hover:bg-rose-50 border-2 border-gray-200 hover:border-rose-500 rounded-xl p-6 transition-all duration-200 hover:shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-rose-100 rounded-lg group-hover:bg-rose-500 transition-colors">
                  <BookOpen className="h-6 w-6 text-rose-600 group-hover:text-white transition-colors" />
                </div>
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  SEO
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Blog y Notas</h3>
              <p className="text-sm text-gray-600">
                Crear y gestionar artículos del blog
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Trámites Recientes */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-red-900 mb-1">📋 Trámites Recientes</h2>
            <p className="text-sm sm:text-base text-gray-600">Últimos {tramitesRecientes.length} trámites creados</p>
          </div>
          <Link 
            href="/dashboard/admin/tramites"
            className="text-sm font-semibold text-red-700 hover:text-red-900 flex items-center gap-1 transition"
          >
            Ver todos
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {tramitesRecientes.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium mb-2">No hay trámites aún</p>
            <p className="text-sm text-gray-500">Los trámites aparecerán aquí cuando los clientes los creen</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {tramitesRecientes.map((tramite) => {
              const getEstadoColor = (estado: string) => {
                switch (estado) {
                  case 'COMPLETADO':
                    return 'bg-green-100 text-green-800 border-green-200'
                  case 'EN_PROCESO':
                    return 'bg-blue-100 text-blue-800 border-blue-200'
                  case 'ESPERANDO_CLIENTE':
                    return 'bg-orange-100 text-orange-800 border-orange-200'
                  case 'ESPERANDO_APROBACION':
                    return 'bg-yellow-100 text-yellow-800 border-yellow-200'
                  case 'INICIADO':
                    return 'bg-purple-100 text-purple-800 border-purple-200'
                  default:
                    return 'bg-gray-100 text-gray-800 border-gray-200'
                }
              }

              const getEstadoIcon = (estado: string) => {
                switch (estado) {
                  case 'COMPLETADO':
                    return <CheckCircle className="w-4 h-4" />
                  case 'EN_PROCESO':
                    return <Clock className="w-4 h-4" />
                  case 'ESPERANDO_CLIENTE':
                    return <AlertCircle className="w-4 h-4" />
                  default:
                    return <FileText className="w-4 h-4" />
                }
              }

              const fechaCreacion = new Date(tramite.createdAt)
              const fechaFormateada = fechaCreacion.toLocaleDateString('es-AR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })

              return (
                <Link 
                  key={tramite.id}
                  href={`/dashboard/admin/tramites/${tramite.id}`}
                  className="group"
                >
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-red-700 hover:shadow-lg transition-all duration-200">
                    {/* Header con denominación y estado */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-red-700 transition-colors truncate">
                          {tramite.denominacionSocial1}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>{fechaFormateada}</span>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${getEstadoColor(tramite.estadoGeneral)}`}>
                        {getEstadoIcon(tramite.estadoGeneral)}
                        <span className="hidden sm:inline">
                          {tramite.estadoGeneral.replace(/_/g, ' ')}
                        </span>
                        <span className="sm:hidden">
                          {tramite.estadoGeneral.split('_')[0]}
                        </span>
                      </div>
                    </div>

                    {/* Info del cliente */}
                    <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-red-700 font-bold text-sm">
                          {tramite.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {tramite.user.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {tramite.user.email}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-red-700 transition-colors flex-shrink-0" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}

export default AdminDashboardPage

