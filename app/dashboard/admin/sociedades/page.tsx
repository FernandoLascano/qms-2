import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2 } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

async function SociedadesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.rol !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Obtener todas las sociedades (trámites completados con CUIT, Matrícula y Resolución)
  const sociedades = await prisma.tramite.findMany({
    where: {
      estadoGeneral: 'COMPLETADO',
      cuit: { not: null },
      matricula: { not: null },
      numeroResolucion: { not: null }
    },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      fechaSociedadInscripta: 'desc'
    }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Building2 className="h-8 w-8 text-red-700" />
            Sociedades Constituidas
          </h1>
          <p className="text-gray-600 mt-2">
            Listado completo de todas las sociedades inscriptas
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Sociedades</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{sociedades.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Este Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">
              {sociedades.filter(s => {
                const fecha = s.fechaSociedadInscripta || s.fechaInscripcion || s.createdAt
                const mesActual = new Date().getMonth()
                const añoActual = new Date().getFullYear()
                return new Date(fecha).getMonth() === mesActual && 
                       new Date(fecha).getFullYear() === añoActual
              }).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Este Año</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">
              {sociedades.filter(s => {
                const fecha = s.fechaSociedadInscripta || s.fechaInscripcion || s.createdAt
                return new Date(fecha).getFullYear() === new Date().getFullYear()
              }).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Sociedades */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Sociedades</CardTitle>
          <CardDescription>
            Todas las sociedades que han sido constituidas exitosamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sociedades.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aún no hay sociedades constituidas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sociedades.map((sociedad) => (
                <Link
                  key={sociedad.id}
                  href={`/dashboard/admin/sociedades/${sociedad.id}`}
                  className="block"
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-red-600">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-bold text-gray-900">
                              {sociedad.denominacionAprobada || sociedad.denominacionSocial1}
                            </h3>
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                              ✓ Inscripta
                            </span>
                          </div>
                          
                          <div className="grid md:grid-cols-4 gap-4 mt-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">CUIT</p>
                              <p className="font-semibold text-gray-900">{sociedad.cuit}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Matrícula</p>
                              <p className="font-semibold text-gray-900">{sociedad.matricula}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Resolución</p>
                              <p className="font-semibold text-gray-900">{sociedad.numeroResolucion}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Fecha de Inscripción</p>
                              <p className="font-semibold text-gray-900">
                                {sociedad.fechaSociedadInscripta || sociedad.fechaInscripcion
                                  ? format(new Date(sociedad.fechaSociedadInscripta || sociedad.fechaInscripcion!), "d 'de' MMMM, yyyy", { locale: es })
                                  : 'N/A'}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>
                                <strong>Cliente:</strong> {sociedad.user.name}
                              </span>
                              <span>
                                <strong>Jurisdicción:</strong> {sociedad.jurisdiccion === 'CORDOBA' ? 'Córdoba (IPJ)' : 'CABA (IGJ)'}
                              </span>
                              <span>
                                <strong>Plan:</strong> {sociedad.plan}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default SociedadesPage

