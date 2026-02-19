import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Plus, Calendar, Building2, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

async function TramitesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return null
  }

  const tramites = await prisma.tramite.findMany({
    where: {
      userId: session.user.id
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

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
      case 'CANCELADO':
        return 'bg-brand-100 text-brand-800 border-brand-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case 'COMPLETADO':
        return 'Completado'
      case 'EN_PROCESO':
        return 'En Proceso'
      case 'ESPERANDO_CLIENTE':
        return 'Requiere tu atención'
      case 'ESPERANDO_APROBACION':
        return 'Esperando aprobación'
      case 'INICIADO':
        return 'Iniciado'
      case 'CANCELADO':
        return 'Cancelado'
      default:
        return estado
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <span className="inline-block text-brand-700 font-semibold text-sm tracking-wider uppercase mb-2">
            Gestión
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900">
            Mis <span className="text-brand-700">Trámites</span>
          </h2>
          <p className="text-gray-500 mt-2 text-lg">
            Gestiona y consulta todos tus trámites de constitución
          </p>
        </div>
        <Link href="/tramite/nuevo" className="w-full sm:w-auto">
          <Button size="lg" className="gap-2 bg-brand-700 hover:bg-brand-800 w-full sm:w-auto rounded-xl shadow-lg shadow-brand-200 h-12 px-6 text-base font-semibold">
            <Plus className="h-5 w-5" />
            Nuevo Trámite
          </Button>
        </Link>
      </div>

      {/* Lista de Trámites */}
      {tramites.length === 0 ? (
        <Card className="shadow-lg">
          <CardContent className="py-20">
            <div className="text-center">
              <div className="h-20 w-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <FileText className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No tenés trámites aún
              </h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto text-lg">
                Comenzá tu primer trámite de constitución de S.A.S. y te guiaremos en cada paso del proceso.
              </p>
              <Link href="/tramite/nuevo">
                <Button size="lg" className="gap-2 bg-brand-700 hover:bg-brand-800 rounded-xl shadow-lg shadow-brand-200">
                  <Plus className="h-5 w-5" />
                  Iniciar Mi Primer Trámite
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {tramites.map((tramite) => {
            const socios = (tramite.socios as any) || []
            const administradores = (tramite.administradores as any) || []
            const progreso = ((tramite.formularioCompleto ? 1 : 0) +
              (tramite.denominacionReservada ? 1 : 0) +
              (tramite.capitalDepositado ? 1 : 0) +
              (tramite.tasaPagada ? 1 : 0) +
              (tramite.documentosRevisados ? 1 : 0) +
              (tramite.documentosFirmados ? 1 : 0) +
              (tramite.tramiteIngresado ? 1 : 0) +
              (tramite.sociedadInscripta ? 1 : 0)) / 8 * 100

            return (
              <Link
                key={tramite.id}
                href={!tramite.formularioCompleto
                  ? `/tramite/nuevo?tramiteId=${tramite.id}`
                  : `/dashboard/tramites/${tramite.id}`}
                className="group"
              >
                <Card className="hover:shadow-xl hover:border-brand-200 transition-all duration-200">
                  <CardHeader className="border-b border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-brand-700 transition-colors">
                            {tramite.denominacionAprobada || tramite.denominacionSocial1}
                          </CardTitle>
                          <span className={`px-4 py-1.5 rounded-full text-xs font-semibold border ${getEstadoColor(tramite.estadoGeneral)}`}>
                            {getEstadoTexto(tramite.estadoGeneral)}
                          </span>
                        </div>
                        <CardDescription className="flex flex-wrap items-center gap-4 text-sm">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(tramite.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Building2 className="h-4 w-4" />
                            {tramite.jurisdiccion === 'CORDOBA' ? 'Córdoba (IPJ)' : 'CABA (IGJ)'}
                          </span>
                          <span className="flex items-center gap-1.5 font-semibold text-brand-700">
                            <DollarSign className="h-4 w-4" />
                            Plan {tramite.plan}
                          </span>
                        </CardDescription>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-xl border-gray-300 group-hover:border-brand-300 group-hover:text-brand-700">
                        {!tramite.formularioCompleto ? 'Continuar' : 'Ver Detalle'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-3 gap-6 text-sm mb-6">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-gray-500 mb-1 text-xs uppercase tracking-wide">Capital Social</p>
                        <p className="font-bold text-gray-900 text-lg">
                          ${tramite.capitalSocial.toLocaleString('es-AR')}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-gray-500 mb-1 text-xs uppercase tracking-wide">Socios</p>
                        <p className="font-bold text-gray-900 text-lg">
                          {Array.isArray(socios) ? socios.length : 0} accionista{socios.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-gray-500 mb-1 text-xs uppercase tracking-wide">Administradores</p>
                        <p className="font-bold text-gray-900 text-lg">
                          {Array.isArray(administradores) ? administradores.length : 0}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Progreso del trámite</span>
                        <span className="text-sm font-bold text-brand-700">{Math.round(progreso)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-gradient-to-r from-brand-600 to-green-500 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${progreso}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default TramitesPage

