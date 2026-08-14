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
          email: true,
          partner: {
            select: {
              nombre: true
            }
          }
        }
      }
    },
    orderBy: {
      fechaSociedadInscripta: 'desc'
    }
  })

  // Calcular estadísticas
  const esteMes = sociedades.filter(s => {
    const fecha = s.fechaSociedadInscripta || s.fechaInscripcion || s.createdAt
    const mesActual = new Date().getMonth()
    const añoActual = new Date().getFullYear()
    return new Date(fecha).getMonth() === mesActual &&
           new Date(fecha).getFullYear() === añoActual
  }).length

  const esteAño = sociedades.filter(s => {
    const fecha = s.fechaSociedadInscripta || s.fechaInscripcion || s.createdAt
    return new Date(fecha).getFullYear() === new Date().getFullYear()
  }).length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-display text-ink">
          Sociedades Constituidas
        </h1>
        <p className="mt-1 text-body text-ink-2">
          Listado completo de todas las sociedades inscriptas
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="hover:shadow-raise hover:border-line-strong">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-body-sm font-medium text-ink-2">Total Sociedades</CardTitle>
            <div className="h-10 w-10 rounded-control bg-success-soft flex items-center justify-center">
              <Building2 className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-display text-ink">{sociedades.length}</p>
            <p className="text-label text-ink-2 mt-1">Inscriptas exitosamente</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-raise hover:border-info-line">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-body-sm font-medium text-ink-2">Este Mes</CardTitle>
            <div className="h-10 w-10 rounded-control bg-info-soft flex items-center justify-center">
              <Building2 className="h-5 w-5 text-info" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-display font-semibold text-info">{esteMes}</p>
            <p className="text-label text-ink-2 mt-1">Nuevas este mes</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-raise hover:border-info-line">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-body-sm font-medium text-ink-2">Este Año</CardTitle>
            <div className="h-10 w-10 rounded-control bg-info-soft flex items-center justify-center">
              <Building2 className="h-5 w-5 text-info" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-display font-semibold text-info">{esteAño}</p>
            <p className="text-label text-ink-2 mt-1">Total {new Date().getFullYear()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Sociedades */}
      <Card className="shadow-raise">
        <CardHeader className="border-b border-line">
          <CardTitle className="text-title font-semibold text-ink">Listado de Sociedades</CardTitle>
          <CardDescription>
            Todas las sociedades que han sido constituidas exitosamente
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {sociedades.length === 0 ? (
            <div className="text-center py-16">
              <div className="h-20 w-20 rounded-card bg-surface-3 flex items-center justify-center mx-auto mb-6">
                <Building2 className="h-10 w-10 text-ink-3" />
              </div>
              <h3 className="text-title font-semibold text-ink mb-2">No hay sociedades aún</h3>
              <p className="text-ink-2">Las sociedades constituidas aparecerán aquí</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sociedades.map((sociedad) => (
                <Link
                  key={sociedad.id}
                  href={`/dashboard/admin/sociedades/${sociedad.id}`}
                  className="block group"
                >
                  <div className="p-6 border-2 border-line rounded-card hover:border-success-line hover:shadow-raise transition-all duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-title font-semibold text-ink">
                              {sociedad.denominacionAprobada || sociedad.denominacionSocial1}
                            </h3>
                            <span className="px-2 py-1 bg-success-soft text-success text-label font-semibold rounded-full">
                              ✓ Inscripta
                            </span>
                          </div>
                          
                          <div className="grid md:grid-cols-4 gap-4 mt-4">
                            <div>
                              <p className="text-label text-ink-2 mb-1">CUIT</p>
                              <p className="font-semibold text-ink">{sociedad.cuit}</p>
                            </div>
                            <div>
                              <p className="text-label text-ink-2 mb-1">Matrícula</p>
                              <p className="font-semibold text-ink">{sociedad.matricula}</p>
                            </div>
                            <div>
                              <p className="text-label text-ink-2 mb-1">Resolución</p>
                              <p className="font-semibold text-ink">{sociedad.numeroResolucion}</p>
                            </div>
                            <div>
                              <p className="text-label text-ink-2 mb-1">Fecha de Inscripción</p>
                              <p className="font-semibold text-ink">
                                {sociedad.fechaSociedadInscripta || sociedad.fechaInscripcion
                                  ? format(new Date(sociedad.fechaSociedadInscripta || sociedad.fechaInscripcion!), "d 'de' MMMM, yyyy", { locale: es })
                                  : 'N/A'}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-line">
                            <div className="flex items-center gap-4 text-body-sm text-ink-2">
                              <span>
                                <strong>Cliente:</strong> {sociedad.user.name}
                              </span>
                              {sociedad.user.partner && (
                                <span className="px-2 py-1 bg-primary-soft text-primary text-label font-semibold rounded-full">
                                  Referido por {sociedad.user.partner.nombre}
                                </span>
                              )}
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
                  </div>
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

