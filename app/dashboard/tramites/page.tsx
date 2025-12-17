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
        return 'bg-red-100 text-red-800 border-red-200'
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-red-900">Mis Trámites</h2>
          <p className="text-gray-600 mt-1">
            Gestiona y consulta todos tus trámites de constitución
          </p>
        </div>
        <Link href="/tramite/nuevo">
          <Button size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-5 w-5" />
            Nuevo Trámite
          </Button>
        </Link>
      </div>

      {/* Lista de Trámites */}
      {tramites.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No tienes trámites aún
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Comienza tu primer trámite de constitución de S.A.S. y te guiaremos en cada paso del proceso.
              </p>
              <Link href="/tramite/nuevo">
                <Button size="lg" className="gap-2">
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
            
            return (
              <Card key={tramite.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">
                          {tramite.denominacionAprobada || tramite.denominacionSocial1}
                        </CardTitle>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(tramite.estadoGeneral)}`}>
                          {getEstadoTexto(tramite.estadoGeneral)}
                        </span>
                      </div>
                      <CardDescription className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(tramite.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {tramite.jurisdiccion === 'CORDOBA' ? 'Córdoba (IPJ)' : 'CABA (IGJ)'}
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <DollarSign className="h-4 w-4" />
                          Plan {tramite.plan}
                        </span>
                      </CardDescription>
                    </div>
                    <Link href={!tramite.formularioCompleto 
                      ? `/tramite/nuevo?tramiteId=${tramite.id}`
                      : `/dashboard/tramites/${tramite.id}`}>
                      <Button variant="outline" size="sm">
                        {!tramite.formularioCompleto ? 'Continuar' : 'Ver Detalle'}
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 mb-1">Capital Social</p>
                      <p className="font-semibold text-gray-900">
                        ${tramite.capitalSocial.toLocaleString('es-AR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Socios</p>
                      <p className="font-semibold text-gray-900">
                        {Array.isArray(socios) ? socios.length : 0} accionista{socios.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Administradores</p>
                      <p className="font-semibold text-gray-900">
                        {Array.isArray(administradores) ? administradores.length : 0}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-700">Progreso del trámite</span>
                      <span className="text-xs text-gray-500">
                        {tramite.formularioCompleto && '✓ Formulario'}
                        {tramite.denominacionReservada && ' • ✓ Denominación'}
                        {tramite.capitalDepositado && ' • ✓ Capital'}
                        {tramite.sociedadInscripta && ' • ✓ Inscripta'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${
                            ((tramite.formularioCompleto ? 1 : 0) +
                            (tramite.denominacionReservada ? 1 : 0) +
                            (tramite.capitalDepositado ? 1 : 0) +
                            (tramite.tasaPagada ? 1 : 0) +
                            (tramite.documentosRevisados ? 1 : 0) +
                            (tramite.documentosFirmados ? 1 : 0) +
                            (tramite.tramiteIngresado ? 1 : 0) +
                            (tramite.sociedadInscripta ? 1 : 0)) / 8 * 100
                          }%`
                        }}
                      />
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

export default TramitesPage

