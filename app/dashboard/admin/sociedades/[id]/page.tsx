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
          <Link href="/dashboard/admin/sociedades">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Sociedades
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Building2 className="h-8 w-8 text-brand-700" />
              {tramite.denominacionAprobada || tramite.denominacionSocial1}
            </h1>
            <p className="text-gray-600 mt-1">Sociedad Constituida</p>
          </div>
        </div>
      </div>

      {/* Información Principal de la Sociedad */}
      <Card className="border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
        <CardHeader>
          <CardTitle className="text-green-900 flex items-center gap-2 text-2xl">
            <CheckCircle className="h-8 w-8" />
            Datos Oficiales de la Sociedad
          </CardTitle>
          <CardDescription className="text-green-700 text-base">
            Información registrada en el organismo de control
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
              <p className="text-sm text-green-700 mb-1 font-medium">Denominación Social</p>
              <p className="text-lg font-bold text-green-900">{tramite.denominacionAprobada || tramite.denominacionSocial1}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
              <p className="text-sm text-green-700 mb-1 font-medium">CUIT</p>
              <p className="text-2xl font-bold text-green-900">{tramite.cuit}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
              <p className="text-sm text-green-700 mb-1 font-medium">Matrícula</p>
              <p className="text-2xl font-bold text-green-900">{tramite.matricula}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
              <p className="text-sm text-green-700 mb-1 font-medium">Resolución</p>
              <p className="text-2xl font-bold text-green-900">{tramite.numeroResolucion}</p>
            </div>
          </div>

          {/* Resolución de Inscripción - Documento destacado */}
          {tramite.documentos.length > 0 && (
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-400 rounded-lg p-6 shadow-md">
              <div className="flex items-start gap-4">
                <div className="bg-green-600 p-3 rounded-lg shadow-lg">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-green-900 mb-2">
                    📄 Resolución de Inscripción
                  </h3>
                  <p className="text-green-800 mb-4">
                    Documento oficial de inscripción de la sociedad
                  </p>
                  <a
                    href={tramite.documentos[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition-colors"
                  >
                    <Download className="h-5 w-5" />
                    Descargar Resolución de Inscripción
                  </a>
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-green-200">
            <div>
              <p className="text-sm text-green-700 mb-1">Fecha de Inscripción</p>
              <p className="font-semibold text-green-900">
                {tramite.fechaSociedadInscripta || tramite.fechaInscripcion
                  ? format(new Date(tramite.fechaSociedadInscripta || tramite.fechaInscripcion!), "d 'de' MMMM, yyyy", { locale: es })
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-green-700 mb-1">Jurisdicción</p>
              <p className="font-semibold text-green-900">
                {tramite.jurisdiccion === 'CORDOBA' ? 'Córdoba (IPJ)' : 'CABA (IGJ)'}
              </p>
            </div>
            <div>
              <p className="text-sm text-green-700 mb-1">Cliente</p>
              <p className="font-semibold text-green-900">{tramite.user.name}</p>
              <p className="text-xs text-green-600">{tramite.user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Divisor */}
      <div className="border-t-2 border-gray-200 my-8">
        <h3 className="text-xl font-bold text-brand-900 mt-8 mb-4">
          📋 Información Completa del Trámite
        </h3>
        <p className="text-gray-600 mb-6">
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
            <p className="text-sm text-gray-500 mb-1">Fecha de Inicio</p>
            <p className="font-semibold text-gray-900">
              {format(new Date(tramite.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Jurisdicción</p>
            <p className="font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {tramite.jurisdiccion === 'CORDOBA' ? 'Córdoba (IPJ)' : 'CABA (IGJ)'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Plan Contratado</p>
            <p className="font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {tramite.plan}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Capital Social</p>
            <p className="font-semibold text-gray-900">
              ${tramite.capitalSocial.toLocaleString('es-AR')}
            </p>
          </div>
          {(() => {
            const datosUsuario = (tramite.datosUsuario as any) || {}
            const fechaCierre = datosUsuario.fechaCierre
            return fechaCierre ? (
              <div>
                <p className="text-sm text-gray-500 mb-1">Cierre de Ejercicio</p>
                <p className="font-semibold text-gray-900 flex items-center gap-2">
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
          <div className="p-3 border rounded-lg bg-gray-50">
            <span className="text-xs text-gray-500">Opción 1 (Preferida)</span>
            <p className="font-medium text-gray-900 mt-1">{tramite.denominacionSocial1}</p>
          </div>
          {tramite.denominacionSocial2 && (
            <div className="p-3 border rounded-lg">
              <span className="text-xs text-gray-500">Opción 2</span>
              <p className="font-medium text-gray-900 mt-1">{tramite.denominacionSocial2}</p>
            </div>
          )}
          {tramite.denominacionSocial3 && (
            <div className="p-3 border rounded-lg">
              <span className="text-xs text-gray-500">Opción 3</span>
              <p className="font-medium text-gray-900 mt-1">{tramite.denominacionSocial3}</p>
            </div>
          )}
          {tramite.denominacionAprobada && (
            <div className="p-3 border-2 border-green-500 rounded-lg bg-green-50">
              <span className="text-xs text-green-700 font-medium flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Denominación Aprobada
              </span>
              <p className="font-bold text-green-900 mt-1">{tramite.denominacionAprobada}</p>
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
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  Pre-aprobado
                </span>
              ) : (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  Personalizado
                </span>
              )
            })()}
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-line">
            {tramite.objetoSocial}
          </p>
        </CollapsibleCard>

        {/* Domicilio Legal */}
        <CollapsibleCard
          title="Domicilio Legal"
          icon={<MapPin className="h-5 w-5" />}
        >
          <p className="text-sm text-gray-700">
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
              <div key={index} className="border-2 rounded-lg p-5 bg-gradient-to-br from-blue-50 to-white">
                <div className="flex items-start justify-between mb-4 pb-3 border-b">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-1">
                      {socio.nombre} {socio.apellido}
                    </h4>
                    <p className="text-sm text-gray-600">Socio #{index + 1}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">Participación</p>
                    <p className="text-2xl font-bold text-blue-600">{porcentajeFormateado}%</p>
                    <p className="text-sm text-gray-700">${Math.round(aporteCapital).toLocaleString('es-AR')}</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-lg border">
                    <p className="text-xs text-gray-500 mb-1">DNI</p>
                    <p className="font-semibold text-gray-900">{socio.dni}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <p className="text-xs text-gray-500 mb-1">CUIT</p>
                    <p className="font-semibold text-gray-900">{socio.cuit}</p>
                  </div>
                  {socio.email && (
                    <div className="bg-white p-3 rounded-lg border">
                      <p className="text-xs text-gray-500 mb-1">Email</p>
                      <p className="font-semibold text-gray-900 text-sm break-all">{socio.email}</p>
                    </div>
                  )}
                  {socio.telefono && (
                    <div className="bg-white p-3 rounded-lg border">
                      <p className="text-xs text-gray-500 mb-1">Teléfono</p>
                      <p className="font-semibold text-gray-900">{socio.telefono}</p>
                    </div>
                  )}
                  <div className="bg-white p-3 rounded-lg border md:col-span-2">
                    <p className="text-xs text-gray-500 mb-1">Domicilio</p>
                    <p className="font-semibold text-gray-900">
                      {[
                        socio.domicilio,
                        socio.ciudad,
                        socio.departamento,
                        socio.provincia
                      ].filter(Boolean).join(' - ') || socio.domicilio || 'No especificado'}
                    </p>
                  </div>
                  {socio.nacionalidad && (
                    <div className="bg-white p-3 rounded-lg border">
                      <p className="text-xs text-gray-500 mb-1">Nacionalidad</p>
                      <p className="font-semibold text-gray-900">{socio.nacionalidad}</p>
                    </div>
                  )}
                  <div className="bg-white p-3 rounded-lg border">
                    <p className="text-xs text-gray-500 mb-1">Estado Civil</p>
                    <p className="font-semibold text-gray-900">{socio.estadoCivil}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <p className="text-xs text-gray-500 mb-1">Profesión</p>
                    <p className="font-semibold text-gray-900">{socio.profesion}</p>
                  </div>
                  {socio.fechaNacimiento && (
                    <div className="bg-white p-3 rounded-lg border">
                      <p className="text-xs text-gray-500 mb-1">Fecha de Nacimiento</p>
                      <p className="font-semibold text-gray-900">{socio.fechaNacimiento}</p>
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
            <div key={index} className="border-2 rounded-lg p-5 bg-gradient-to-br from-purple-50 to-white">
              <div className="flex items-start justify-between mb-4 pb-3 border-b">
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-1">
                    {admin.nombre} {admin.apellido}
                  </h4>
                  <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                    {admin.cargo}
                  </span>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500 mb-1">DNI</p>
                  <p className="font-semibold text-gray-900">{admin.dni}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500 mb-1">CUIT</p>
                  <p className="font-semibold text-gray-900">{admin.cuit}</p>
                </div>
                {admin.email && (
                  <div className="bg-white p-3 rounded-lg border">
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="font-semibold text-gray-900 text-sm break-all">{admin.email}</p>
                  </div>
                )}
                {admin.telefono && (
                  <div className="bg-white p-3 rounded-lg border">
                    <p className="text-xs text-gray-500 mb-1">Teléfono</p>
                    <p className="font-semibold text-gray-900">{admin.telefono}</p>
                  </div>
                )}
                <div className="bg-white p-3 rounded-lg border md:col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Domicilio</p>
                  <p className="font-semibold text-gray-900">
                    {[
                      admin.domicilio,
                      admin.ciudad,
                      admin.departamento,
                      admin.provincia
                    ].filter(Boolean).join(' - ') || admin.domicilio || 'No especificado'}
                  </p>
                </div>
                {admin.nacionalidad && (
                  <div className="bg-white p-3 rounded-lg border">
                    <p className="text-xs text-gray-500 mb-1">Nacionalidad</p>
                    <p className="font-semibold text-gray-900">{admin.nacionalidad}</p>
                  </div>
                )}
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500 mb-1">Estado Civil</p>
                  <p className="font-semibold text-gray-900">{admin.estadoCivil}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500 mb-1">Profesión</p>
                  <p className="font-semibold text-gray-900">{admin.profesion}</p>
                </div>
                {admin.fechaNacimiento && (
                  <div className="bg-white p-3 rounded-lg border">
                    <p className="text-xs text-gray-500 mb-1">Fecha de Nacimiento</p>
                    <p className="font-semibold text-gray-900">{admin.fechaNacimiento}</p>
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
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <p className="text-xs text-gray-500 mb-1">CBU Principal</p>
                    <p className="font-semibold text-gray-900">{cbuPrincipal}</p>
                    <p className="text-xs text-gray-600 mt-1">Administrador Titular</p>
                  </div>
                )}
                {cbuSecundario && (
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <p className="text-xs text-gray-500 mb-1">CBU Secundario</p>
                    <p className="font-semibold text-gray-900">{cbuSecundario}</p>
                    <p className="text-xs text-gray-600 mt-1">Administrador Suplente</p>
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

