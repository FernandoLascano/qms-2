import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Building2, FileText, Tag, Briefcase, MapPin, Users, User, CheckCircle, Calendar, DollarSign, Download } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import CollapsibleCard from '@/components/admin/CollapsibleCard'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

async function SociedadDetallePage({ params }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.rol !== 'ADMIN') {
    redirect('/dashboard')
  }

  const { id } = await params

  const tramite = await prisma.tramite.findFirst({
    where: {
      id: id,
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
          phone: true
        }
      },
      documentos: {
        where: {
          tipo: 'RESOLUCION_FINAL',
          estado: 'APROBADO'
        },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  })

  if (!tramite) {
    notFound()
  }

  const socios = (tramite.socios as any[]) || []
  const administradores = (tramite.administradores as any[]) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/admin/sociedades">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Sociedades
            </Link>
          </Button>
          <div>
            <h1 className="text-display font-semibold text-ink flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              {tramite.denominacionAprobada || tramite.denominacionSocial1}
            </h1>
            <p className="text-ink-2 mt-1">Sociedad Constituida</p>
          </div>
        </div>
      </div>

      {/* Información Principal de la Sociedad */}
      <Card className="border-2 border-success-line bg-success-soft shadow-raise">
        <CardHeader>
          <CardTitle className="text-success flex items-center gap-2 text-title">
            <CheckCircle className="h-8 w-8" />
            Datos Oficiales de la Sociedad
          </CardTitle>
          <CardDescription className="text-success text-body">
            Información registrada en el organismo de control
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-surface p-4 rounded-control border-2 border-success-line shadow-raise">
              <p className="text-body-sm text-success mb-1 font-medium">Denominación Social</p>
              <p className="text-heading font-semibold text-success">{tramite.denominacionAprobada || tramite.denominacionSocial1}</p>
            </div>
            <div className="bg-surface p-4 rounded-control border-2 border-success-line shadow-raise">
              <p className="text-body-sm text-success mb-1 font-medium">CUIT</p>
              <p className="text-title font-semibold text-success">{tramite.cuit}</p>
            </div>
            <div className="bg-surface p-4 rounded-control border-2 border-success-line shadow-raise">
              <p className="text-body-sm text-success mb-1 font-medium">Matrícula</p>
              <p className="text-title font-semibold text-success">{tramite.matricula}</p>
            </div>
            <div className="bg-surface p-4 rounded-control border-2 border-success-line shadow-raise">
              <p className="text-body-sm text-success mb-1 font-medium">Resolución</p>
              <p className="text-title font-semibold text-success">{tramite.numeroResolucion}</p>
            </div>
          </div>

          {/* Resolución de Inscripción - Documento destacado */}
          {tramite.documentos.length > 0 && (
            <div className="bg-success-soft border-2 border-success-line rounded-control p-6 shadow-raise">
              <div className="flex items-start gap-4">
                <div className="bg-success-solid p-3 rounded-control shadow-raise">
                  <FileText className="h-8 w-8 text-on-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-title font-semibold text-success mb-2">
                    Resolución de Inscripción
                  </h3>
                  <p className="text-success mb-4">
                    Documento oficial de inscripción de la sociedad
                  </p>
                  <a
                    href={`/api/documentos/${tramite.documentos[0].id}/view?download=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-success-solid hover:bg-success-solid text-on-primary font-semibold px-6 py-3 rounded-control shadow-raise transition-colors"
                  >
                    <Download className="h-5 w-5" />
                    Descargar Resolución de Inscripción
                  </a>
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-success-line">
            <div>
              <p className="text-body-sm text-success mb-1">Fecha de Inscripción</p>
              <p className="font-semibold text-success">
                {tramite.fechaSociedadInscripta || tramite.fechaInscripcion
                  ? format(new Date(tramite.fechaSociedadInscripta || tramite.fechaInscripcion!), "d 'de' MMMM, yyyy", { locale: es })
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-body-sm text-success mb-1">Jurisdicción</p>
              <p className="font-semibold text-success">
                {tramite.jurisdiccion === 'CORDOBA' ? 'Córdoba (IPJ)' : 'CABA (IGJ)'}
              </p>
            </div>
            <div>
              <p className="text-body-sm text-success mb-1">Cliente</p>
              <p className="font-semibold text-success">{tramite.user.name}</p>
              <p className="text-label text-success">{tramite.user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Divisor */}
      <div className="border-t-2 border-line my-8">
        <h3 className="text-title font-semibold text-primary mt-8 mb-4">
          Información Completa del Trámite
        </h3>
        <p className="text-ink-2 mb-6">
          Todos los datos del trámite de constitución
        </p>
      </div>

      {/* Info General */}
      <CollapsibleCard
        title="Información General"
        icon={<FileText className="h-5 w-5" />}
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-body-sm text-ink-2 mb-1">Fecha de Inicio</p>
            <p className="font-semibold text-ink">
              {format(new Date(tramite.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
            </p>
          </div>
          <div>
            <p className="text-body-sm text-ink-2 mb-1">Jurisdicción</p>
            <p className="font-semibold text-ink flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {tramite.jurisdiccion === 'CORDOBA' ? 'Córdoba (IPJ)' : 'CABA (IGJ)'}
            </p>
          </div>
          <div>
            <p className="text-body-sm text-ink-2 mb-1">Plan Contratado</p>
            <p className="font-semibold text-ink flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {tramite.plan}
            </p>
          </div>
          <div>
            <p className="text-body-sm text-ink-2 mb-1">Capital Social</p>
            <p className="font-semibold text-ink">
              ${tramite.capitalSocial.toLocaleString('es-AR')}
            </p>
          </div>
          {(() => {
            const datosUsuario = (tramite.datosUsuario as any) || {}
            const fechaCierre = datosUsuario.fechaCierre
            return fechaCierre ? (
              <div>
                <p className="text-body-sm text-ink-2 mb-1">Cierre de Ejercicio</p>
                <p className="font-semibold text-ink flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {fechaCierre}
                </p>
              </div>
            ) : null
          })()}
        </div>
      </CollapsibleCard>

      {/* Denominaciones Propuestas */}
      <CollapsibleCard
        title="Denominaciones Propuestas"
        description="Opciones de nombre para la sociedad"
        icon={<Tag className="h-5 w-5" />}
      >
        <div className="space-y-2">
          <div className="p-3 border rounded-control bg-surface-2">
            <span className="text-label text-ink-2">Opción 1 (Preferida)</span>
            <p className="font-medium text-ink mt-1">{tramite.denominacionSocial1}</p>
          </div>
          {tramite.denominacionSocial2 && (
            <div className="p-3 border rounded-control">
              <span className="text-label text-ink-2">Opción 2</span>
              <p className="font-medium text-ink mt-1">{tramite.denominacionSocial2}</p>
            </div>
          )}
          {tramite.denominacionSocial3 && (
            <div className="p-3 border rounded-control">
              <span className="text-label text-ink-2">Opción 3</span>
              <p className="font-medium text-ink mt-1">{tramite.denominacionSocial3}</p>
            </div>
          )}
          {tramite.denominacionAprobada && (
            <div className="p-3 border-2 border-success-line rounded-control bg-success-soft">
              <span className="text-label text-success font-medium flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Denominación Aprobada
              </span>
              <p className="font-semibold text-success mt-1">{tramite.denominacionAprobada}</p>
            </div>
          )}
        </div>
      </CollapsibleCard>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Objeto Social */}
        <CollapsibleCard
          title="Objeto Social"
          icon={<Briefcase className="h-5 w-5" />}
        >
          <div className="mb-3">
            {(() => {
              const objetoText = tramite.objetoSocial || ''
              const esPreAprobado = 
                objetoText.includes('La sociedad tiene por objeto realizar por cuenta propia y/o de terceros, o asociadas a terceros en el país o en el extranjero, las siguientes actividades:') &&
                objetoText.includes('1) Construcción de todo tipo de obras')
              return esPreAprobado ? (
                <span className="px-2 py-1 bg-success-soft text-success text-label font-medium rounded-full">
                  Pre-aprobado
                </span>
              ) : (
                <span className="px-2 py-1 bg-info-soft text-info text-label font-medium rounded-full">
                  Personalizado
                </span>
              )
            })()}
          </div>
          <p className="text-body-sm text-ink-2 whitespace-pre-line">
            {tramite.objetoSocial}
          </p>
        </CollapsibleCard>

        {/* Domicilio Legal */}
        <CollapsibleCard
          title="Domicilio Legal"
          icon={<MapPin className="h-5 w-5" />}
        >
          <p className="text-body-sm text-ink-2">
            {tramite.domicilioLegal}
          </p>
        </CollapsibleCard>
      </div>

      {/* Socios / Accionistas */}
      <CollapsibleCard
        title={`Socios / Accionistas (${socios.length})`}
        description="Información completa para documentación"
        icon={<Users className="h-5 w-5" />}
      >
        <div className="space-y-4">
          {socios.map((socio: any, index: number) => {
            const capitalSocial = tramite.capitalSocial || 0
            let aporteCapital = 0
            if (typeof socio.aporteCapital === 'number') {
              aporteCapital = socio.aporteCapital
            } else if (typeof socio.aporteCapital === 'string') {
              const aporteStr = socio.aporteCapital.replace(/\./g, '').replace(',', '.')
              aporteCapital = parseFloat(aporteStr) || 0
            }
            let porcentaje = capitalSocial > 0 ? ((aporteCapital / capitalSocial) * 100) : 0
            if (porcentaje > 100 || aporteCapital > capitalSocial * 1.1) {
              let porcentajeGuardado = 0
              if (socio.aportePorcentaje) {
                porcentajeGuardado = parseFloat(String(socio.aportePorcentaje).replace('%', '').replace(',', '.')) || 0
              } else if (socio.porcentaje) {
                porcentajeGuardado = parseFloat(String(socio.porcentaje).replace('%', '').replace(',', '.')) || 0
              }
              if (porcentajeGuardado > 100 && porcentajeGuardado <= 10000) {
                porcentajeGuardado = porcentajeGuardado / 100
              }
              if (porcentajeGuardado > 0 && porcentajeGuardado <= 100) {
                aporteCapital = (capitalSocial * porcentajeGuardado) / 100
                porcentaje = porcentajeGuardado
              }
            }
            const porcentajeFormateado = porcentaje.toFixed(2)
            
            return (
              <div key={index} className="border-2 rounded-control p-card bg-surface-2">
                <div className="flex items-start justify-between mb-4 pb-3 border-b">
                  <div>
                    <h4 className="text-heading font-semibold text-ink mb-1">
                      {socio.nombre} {socio.apellido}
                    </h4>
                    <p className="text-body-sm text-ink-2">Socio #{index + 1}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-label text-ink-2 mb-1">Participación</p>
                    <p className="text-title font-semibold text-info">{porcentajeFormateado}%</p>
                    <p className="text-body-sm text-ink-2">${Math.round(aporteCapital).toLocaleString('es-AR')}</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-surface p-3 rounded-control border">
                    <p className="text-label text-ink-2 mb-1">DNI</p>
                    <p className="font-semibold text-ink">{socio.dni}</p>
                  </div>
                  <div className="bg-surface p-3 rounded-control border">
                    <p className="text-label text-ink-2 mb-1">CUIT</p>
                    <p className="font-semibold text-ink">{socio.cuit}</p>
                  </div>
                  {socio.email && (
                    <div className="bg-surface p-3 rounded-control border">
                      <p className="text-label text-ink-2 mb-1">Email</p>
                      <p className="font-semibold text-ink text-body-sm break-all">{socio.email}</p>
                    </div>
                  )}
                  {socio.telefono && (
                    <div className="bg-surface p-3 rounded-control border">
                      <p className="text-label text-ink-2 mb-1">Teléfono</p>
                      <p className="font-semibold text-ink">{socio.telefono}</p>
                    </div>
                  )}
                  <div className="bg-surface p-3 rounded-control border md:col-span-2">
                    <p className="text-label text-ink-2 mb-1">Domicilio</p>
                    <p className="font-semibold text-ink">
                      {[
                        socio.domicilio,
                        socio.ciudad,
                        socio.departamento,
                        socio.provincia
                      ].filter(Boolean).join(' - ') || socio.domicilio || 'No especificado'}
                    </p>
                  </div>
                  {socio.nacionalidad && (
                    <div className="bg-surface p-3 rounded-control border">
                      <p className="text-label text-ink-2 mb-1">Nacionalidad</p>
                      <p className="font-semibold text-ink">{socio.nacionalidad}</p>
                    </div>
                  )}
                  <div className="bg-surface p-3 rounded-control border">
                    <p className="text-label text-ink-2 mb-1">Estado Civil</p>
                    <p className="font-semibold text-ink">{socio.estadoCivil}</p>
                  </div>
                  <div className="bg-surface p-3 rounded-control border">
                    <p className="text-label text-ink-2 mb-1">Profesión</p>
                    <p className="font-semibold text-ink">{socio.profesion}</p>
                  </div>
                  {socio.fechaNacimiento && (
                    <div className="bg-surface p-3 rounded-control border">
                      <p className="text-label text-ink-2 mb-1">Fecha de Nacimiento</p>
                      <p className="font-semibold text-ink">{socio.fechaNacimiento}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CollapsibleCard>

      {/* Administradores */}
      <CollapsibleCard
        title={`Órgano de Administración (${administradores.length})`}
        description="Información completa para documentación"
        icon={<User className="h-5 w-5" />}
      >
        <div className="space-y-4">
          {administradores.map((admin: any, index: number) => (
            <div key={index} className="border-2 rounded-control p-card bg-surface-2">
              <div className="flex items-start justify-between mb-4 pb-3 border-b">
                <div>
                  <h4 className="text-heading font-semibold text-ink mb-1">
                    {admin.nombre} {admin.apellido}
                  </h4>
                  <span className="inline-flex items-center px-3 py-1 bg-info-soft text-info text-body-sm font-medium rounded-full">
                    {admin.cargo}
                  </span>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-surface p-3 rounded-control border">
                  <p className="text-label text-ink-2 mb-1">DNI</p>
                  <p className="font-semibold text-ink">{admin.dni}</p>
                </div>
                <div className="bg-surface p-3 rounded-control border">
                  <p className="text-label text-ink-2 mb-1">CUIT</p>
                  <p className="font-semibold text-ink">{admin.cuit}</p>
                </div>
                {admin.email && (
                  <div className="bg-surface p-3 rounded-control border">
                    <p className="text-label text-ink-2 mb-1">Email</p>
                    <p className="font-semibold text-ink text-body-sm break-all">{admin.email}</p>
                  </div>
                )}
                {admin.telefono && (
                  <div className="bg-surface p-3 rounded-control border">
                    <p className="text-label text-ink-2 mb-1">Teléfono</p>
                    <p className="font-semibold text-ink">{admin.telefono}</p>
                  </div>
                )}
                <div className="bg-surface p-3 rounded-control border md:col-span-2">
                  <p className="text-label text-ink-2 mb-1">Domicilio</p>
                  <p className="font-semibold text-ink">
                    {[
                      admin.domicilio,
                      admin.ciudad,
                      admin.departamento,
                      admin.provincia
                    ].filter(Boolean).join(' - ') || admin.domicilio || 'No especificado'}
                  </p>
                </div>
                {admin.nacionalidad && (
                  <div className="bg-surface p-3 rounded-control border">
                    <p className="text-label text-ink-2 mb-1">Nacionalidad</p>
                    <p className="font-semibold text-ink">{admin.nacionalidad}</p>
                  </div>
                )}
                <div className="bg-surface p-3 rounded-control border">
                  <p className="text-label text-ink-2 mb-1">Estado Civil</p>
                  <p className="font-semibold text-ink">{admin.estadoCivil}</p>
                </div>
                <div className="bg-surface p-3 rounded-control border">
                  <p className="text-label text-ink-2 mb-1">Profesión</p>
                  <p className="font-semibold text-ink">{admin.profesion}</p>
                </div>
                {admin.fechaNacimiento && (
                  <div className="bg-surface p-3 rounded-control border">
                    <p className="text-label text-ink-2 mb-1">Fecha de Nacimiento</p>
                    <p className="font-semibold text-ink">{admin.fechaNacimiento}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleCard>

      {/* CBU Informados */}
      {(() => {
        const datosUsuario = (tramite.datosUsuario as any) || {}
        const cbuPrincipal = datosUsuario.cbuPrincipal
        const cbuSecundario = datosUsuario.cbuSecundario
        if (cbuPrincipal || cbuSecundario) {
          return (
            <CollapsibleCard
              title="CBU Informados"
              description="Datos bancarios proporcionados por el cliente"
              icon={<Building2 className="h-5 w-5" />}
            >
              <div className="grid md:grid-cols-2 gap-4">
                {cbuPrincipal && (
                  <div className="bg-surface-2 p-3 rounded-control border">
                    <p className="text-label text-ink-2 mb-1">CBU Principal</p>
                    <p className="font-semibold text-ink">{cbuPrincipal}</p>
                    <p className="text-label text-ink-2 mt-1">Administrador Titular</p>
                  </div>
                )}
                {cbuSecundario && (
                  <div className="bg-surface-2 p-3 rounded-control border">
                    <p className="text-label text-ink-2 mb-1">CBU Secundario</p>
                    <p className="font-semibold text-ink">{cbuSecundario}</p>
                    <p className="text-label text-ink-2 mt-1">Administrador Suplente</p>
                  </div>
                )}
              </div>
            </CollapsibleCard>
          )
        }
        return null
      })()}
    </div>
  )
}

export default SociedadDetallePage

