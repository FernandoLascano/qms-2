import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  const calcularProgreso = (tramite: {
    formularioCompleto: boolean
    denominacionReservada: boolean
    capitalDepositado: boolean
    tasaPagada: boolean
    documentosFirmados: boolean
    tramiteIngresado: boolean
    sociedadInscripta: boolean
  }) => {
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <span className="inline-block text-brand-700 font-semibold text-sm tracking-wider uppercase mb-2">
          Administración
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-gray-900">
          Panel de <span className="text-brand-700">Control</span>
        </h2>
        <p className="text-gray-500 mt-2 text-lg">
          Gestiona todos los trámites y usuarios de la plataforma
        </p>
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
            <p className="text-xs text-gray-500 mt-1">
              En el sistema
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
              Requieren atención
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
              Finalizados
            </p>
          </CardContent>
        </Card>

        <Card className={`hover:shadow-lg ${tramitesEsperandoCliente > 0 ? 'border-2 border-orange-300 bg-orange-50' : 'hover:border-orange-200'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Esperando Cliente</CardTitle>
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${tramitesEsperandoCliente > 0 ? 'bg-orange-200' : 'bg-orange-100'}`}>
              <AlertCircle className={`h-5 w-5 ${tramitesEsperandoCliente > 0 ? 'text-orange-600' : 'text-orange-400'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-black ${tramitesEsperandoCliente > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
              {tramitesEsperandoCliente}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Acción requerida
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerta de Trámites Pendientes de Validación */}
      {tramitesPendientesValidacion > 0 && (
        <Card className="border-2 border-yellow-400 bg-yellow-50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-yellow-200 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-yellow-700" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-yellow-900 mb-1">
                  Trámites Pendientes de Validación
                </h3>
                <p className="text-sm text-yellow-800 mb-4">
                  Tienes <strong>{tramitesPendientesValidacion}</strong> trámite{tramitesPendientesValidacion !== 1 ? 's' : ''} esperando tu revisión inicial.
                </p>
                <Link href="/dashboard/admin/tramites?filter=pendientes-validacion">
                  <Button className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl shadow-lg">
                    Ver Trámites Pendientes
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Adicionales */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
        <Card className="hover:shadow-lg hover:border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Usuarios Registrados</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-purple-600">{totalUsuarios}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg hover:border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Docs. Pendientes</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-orange-600">{documentosPendientes}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg hover:border-gray-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Iniciados</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-900">{tramitesIniciados}</div>
          </CardContent>
        </Card>
      </div>

      {/* Acciones Rápidas */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Ver Trámites */}
          <Link href="/dashboard/admin/tramites" className="group">
            <Card className="hover:shadow-xl hover:border-brand-300 transition-all duration-200 h-full">
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-brand-100 flex items-center justify-center group-hover:bg-brand-700 transition-colors">
                    <FileText className="h-6 w-6 text-brand-700 group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {totalTramites}
                  </span>
                </div>
                <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-brand-700 transition-colors">
                  Ver Trámites
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Gestionar todos los trámites
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Documentos Pendientes */}
          <Link href="/dashboard/admin/tramites?filter=documentos-pendientes" className="group">
            <Card className="hover:shadow-xl hover:border-yellow-400 transition-all duration-200 h-full">
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-yellow-100 flex items-center justify-center group-hover:bg-yellow-500 transition-colors">
                    <FileText className="h-6 w-6 text-yellow-600 group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    Revisar
                  </span>
                </div>
                <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-yellow-600 transition-colors">
                  Docs. Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Aprobar documentos de clientes
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Analytics */}
          <Link href="/dashboard/admin/analytics" className="group">
            <Card className="hover:shadow-xl hover:border-purple-300 transition-all duration-200 h-full">
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                    <TrendingUp className="h-6 w-6 text-purple-600 group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                    Nuevo
                  </span>
                </div>
                <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                  Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Métricas y reportes
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Calendario */}
          <Link href="/dashboard/admin/calendario" className="group">
            <Card className="hover:shadow-xl hover:border-blue-300 transition-all duration-200 h-full">
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <Calendar className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                </div>
                <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  Calendario
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Eventos y vencimientos
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Tracking de Tiempo */}
          <Link href="/dashboard/admin/tracking-tiempo" className="group">
            <Card className="hover:shadow-xl hover:border-green-300 transition-all duration-200 h-full">
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center group-hover:bg-green-600 transition-colors">
                    <Clock className="h-6 w-6 text-green-600 group-hover:text-white transition-colors" />
                  </div>
                </div>
                <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                  Tracking Tiempo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Análisis de tiempos
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Cuentas Bancarias */}
          <Link href="/dashboard/admin/configuracion-cuentas" className="group">
            <Card className="hover:shadow-xl hover:border-indigo-300 transition-all duration-200 h-full">
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                    <CreditCard className="h-6 w-6 text-indigo-600 group-hover:text-white transition-colors" />
                  </div>
                </div>
                <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  Cuentas Bancarias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Configurar cuentas
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Blog */}
          <Link href="/dashboard/admin/blog" className="group">
            <Card className="hover:shadow-xl hover:border-rose-300 transition-all duration-200 h-full">
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-rose-100 flex items-center justify-center group-hover:bg-rose-600 transition-colors">
                    <BookOpen className="h-6 w-6 text-rose-600 group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    SEO
                  </span>
                </div>
                <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-rose-600 transition-colors">
                  Blog
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Gestionar artículos
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Usuarios */}
          <Link href="/dashboard/admin/usuarios" className="group">
            <Card className="hover:shadow-xl hover:border-cyan-300 transition-all duration-200 h-full">
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-cyan-100 flex items-center justify-center group-hover:bg-cyan-600 transition-colors">
                    <Users className="h-6 w-6 text-cyan-600 group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {totalUsuarios}
                  </span>
                </div>
                <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-cyan-600 transition-colors">
                  Usuarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Administrar usuarios
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Trámites Recientes */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Trámites Recientes</h3>
            <p className="text-sm text-gray-500">Últimos {tramitesRecientes.length} trámites creados</p>
          </div>
          <Link
            href="/dashboard/admin/tramites"
            className="text-sm font-semibold text-brand-700 hover:text-brand-800 flex items-center gap-1 transition"
          >
            Ver todos
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {tramitesRecientes.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="py-12 text-center">
              <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium mb-2">No hay trámites aún</p>
              <p className="text-sm text-gray-500">Los trámites aparecerán aquí cuando los clientes los creen</p>
            </CardContent>
          </Card>
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
                  <Card className="hover:shadow-xl hover:border-brand-300 transition-all duration-200">
                    <CardContent className="p-5">
                      {/* Header con denominación y estado */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-brand-700 transition-colors truncate">
                            {tramite.denominacionSocial1}
                          </h4>
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
                        </div>
                      </div>

                      {/* Info del cliente */}
                      <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                        <div className="w-9 h-9 bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-200">
                          <span className="text-white font-bold text-sm">
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
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand-700 group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
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
