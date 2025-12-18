import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { FileText, Building2, DollarSign, Users, User, CheckCircle, Calendar, Tag, Briefcase, MapPin } from 'lucide-react'
import CollapsibleCard from '@/components/admin/CollapsibleCard'
import EstadoManager from '@/components/admin/EstadoManager'
import DatosFinalesForm from '@/components/admin/DatosFinalesForm'
import DocumentosReview from '@/components/admin/DocumentosReview'
import ObservacionesForm from '@/components/admin/ObservacionesForm'
import EtapasManager from '@/components/admin/EtapasManager'
import DenominacionSelector from '@/components/admin/DenominacionSelector'
import PagosControl from '@/components/admin/PagosControl'
import EnlacesPagoExterno from '@/components/admin/EnlacesPagoExterno'
import HonorariosMercadoPago from '@/components/admin/HonorariosMercadoPago'
import SubirDocumentosParaCliente from '@/components/admin/SubirDocumentosParaCliente'
import ChatBox from '@/components/chat/ChatBox'
import ComprobantesReview from '@/components/admin/ComprobantesReview'
import CuentaCapital from '@/components/admin/CuentaCapital'
import ValidacionTramite from '@/components/admin/ValidacionTramite'
import ReportingPagos from '@/components/admin/ReportingPagos'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

async function AdminTramiteDetallePage({ params }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.rol !== 'ADMIN') {
    redirect('/dashboard')
  }

  const { id } = await params

  const tramite = await prisma.tramite.findUnique({
    where: { id },
    include: {
      user: true,
      documentos: {
        include: {
          user: {
            select: {
              id: true,
              rol: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      pagos: {
        orderBy: { createdAt: 'desc' }
      },
      notificaciones: {
        orderBy: { createdAt: 'desc' },
        take: 5
      },
      enlacesPago: {
        orderBy: { createdAt: 'desc' }
      },
      mensajes: {
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
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
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin/tramites">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-red-900">
            Gestión de Trámite
          </h2>
          <p className="text-gray-600 mt-1">
            {tramite.denominacionAprobada || tramite.denominacionSocial1}
          </p>
        </div>
      </div>

      {/* Info del Cliente */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Cliente</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Nombre</p>
            <p className="font-semibold text-gray-900">{tramite.user.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Email</p>
            <p className="font-semibold text-gray-900">{tramite.user.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Teléfono</p>
            <p className="font-semibold text-gray-900">{tramite.user.phone || 'No proporcionado'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Divisor - Información Detallada */}
      <div className="border-t-2 border-gray-200 my-8">
        <h3 className="text-xl font-bold text-red-900 mt-8 mb-4">
          📋 Información Detallada del Formulario
        </h3>
        <p className="text-gray-600 mb-6">
          Todos los datos completados por el cliente en el formulario
        </p>
      </div>

      {/* Info General */}
      <CollapsibleCard
        title="Información General"
        icon={<FileText className="h-5 w-5 text-gray-600" />}
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
        icon={<Tag className="h-5 w-5 text-gray-600" />}
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
          icon={<Briefcase className="h-5 w-5 text-gray-600" />}
        >
          <div className="mb-3">
            {(() => {
              // Detectar si es objeto pre-aprobado - buscar el inicio característico del texto pre-aprobado
              const objetoText = tramite.objetoSocial || ''
              // El texto pre-aprobado puede tener variaciones, buscamos frases clave
              const esPreAprobado = 
                objetoText.includes('La sociedad tiene por objeto realizar por cuenta propia y/o de terceros') ||
                objetoText.includes('1) Construcción de todo tipo de obras') ||
                objetoText.includes('2) Servicios inmobiliarios y de consultoría') ||
                objetoText.includes('3) Comercialización de productos y servicios') ||
                objetoText.includes('4) Inversiones y participación en sociedades')
              
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
          icon={<MapPin className="h-5 w-5 text-gray-600" />}
        >
          <p className="text-sm text-gray-700">
            {tramite.domicilioLegal}
          </p>
        </CollapsibleCard>
      </div>

      {/* Socios / Accionistas - INFORMACIÓN COMPLETA */}
      <CollapsibleCard
        title={`Socios / Accionistas (${socios.length})`}
        description="Información completa para documentación"
        icon={<Users className="h-5 w-5 text-gray-600" />}
      >
          <div className="space-y-4">
            {socios.map((socio: any, index: number) => {
              const capitalSocial = tramite.capitalSocial || 0
              
              // Calcular el aporteCapital correctamente
              let aporteCapital = 0
              if (typeof socio.aporteCapital === 'number') {
                aporteCapital = socio.aporteCapital
              } else if (typeof socio.aporteCapital === 'string') {
                const aporteStr = socio.aporteCapital.replace(/\./g, '').replace(',', '.')
                aporteCapital = parseFloat(aporteStr) || 0
              } else {
                aporteCapital = 0
              }
              
              // Calcular porcentaje desde el aporteCapital
              let porcentaje = capitalSocial > 0 ? ((aporteCapital / capitalSocial) * 100) : 0
              
              // Si el porcentaje calculado es > 100 o el aporte es mucho mayor que el capital, hay un error
              if (porcentaje > 100 || aporteCapital > capitalSocial * 1.1) {
                // Intentar corregir usando el porcentaje guardado
                let porcentajeGuardado = 0
                
                if (socio.aportePorcentaje) {
                  porcentajeGuardado = parseFloat(String(socio.aportePorcentaje).replace('%', '').replace(',', '.')) || 0
                } else if (socio.porcentaje) {
                  porcentajeGuardado = parseFloat(String(socio.porcentaje).replace('%', '').replace(',', '.')) || 0
                }
                
                // Si el porcentaje guardado es > 100, probablemente está en formato incorrecto (2500 en lugar de 25)
                if (porcentajeGuardado > 100 && porcentajeGuardado <= 10000) {
                  porcentajeGuardado = porcentajeGuardado / 100
                }
                
                // Si tenemos un porcentaje válido, recalcular el aporte
                if (porcentajeGuardado > 0 && porcentajeGuardado <= 100) {
                  aporteCapital = (capitalSocial * porcentajeGuardado) / 100
                  porcentaje = porcentajeGuardado
                } else {
                  // Si no hay porcentaje válido, intentar calcular desde el aporte pero dividiendo por 100 si es muy grande
                  if (aporteCapital > capitalSocial) {
                    const aporteCorregido = aporteCapital / 100
                    if (aporteCorregido <= capitalSocial) {
                      aporteCapital = aporteCorregido
                      porcentaje = capitalSocial > 0 ? ((aporteCapital / capitalSocial) * 100) : 0
                    }
                  }
                }
              }
              
              const porcentajeFormateado = porcentaje.toFixed(2)
              
              return (
              <div key={index} className="border-2 rounded-lg p-5 bg-gradient-to-br from-blue-50 to-white">
                {/* Header del Socio */}
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

                {/* Datos Completos en Grid */}
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

      {/* Administradores - INFORMACIÓN COMPLETA */}
      <CollapsibleCard
        title={`Órgano de Administración (${administradores.length})`}
        description="Información completa para documentación"
        icon={<User className="h-5 w-5 text-gray-600" />}
      >
          <div className="space-y-4">
            {administradores.map((admin: any, index: number) => (
              <div key={index} className="border-2 rounded-lg p-5 bg-gradient-to-br from-purple-50 to-white">
                {/* Header del Administrador */}
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

                {/* Datos Completos en Grid */}
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
              icon={<Building2 className="h-5 w-5 text-gray-600" />}
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

      {/* Validación Inicial del Formulario */}
      <ValidacionTramite
        tramiteId={tramite.id}
        estadoValidacion={tramite.estadoValidacion}
        observacionesValidacion={tramite.observacionesValidacion}
      />

      {/* Gestión de Estado */}
      <EstadoManager 
        tramiteId={tramite.id} 
        estadoActual={tramite.estadoGeneral}
        etapas={{
          formularioCompleto: tramite.formularioCompleto,
          denominacionReservada: tramite.denominacionReservada,
          capitalDepositado: tramite.capitalDepositado,
          tasaPagada: tramite.tasaPagada,
          documentosRevisados: tramite.documentosRevisados,
          documentosFirmados: tramite.documentosFirmados,
          tramiteIngresado: tramite.tramiteIngresado,
          sociedadInscripta: tramite.sociedadInscripta,
        }}
      />

      {/* Grid con herramientas principales */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Examen de Homonimia */}
        <DenominacionSelector
          tramiteId={tramite.id}
          denominacion1={tramite.denominacionSocial1}
          denominacion2={tramite.denominacionSocial2}
          denominacion3={tramite.denominacionSocial3}
          denominacionAprobada={tramite.denominacionAprobada}
        />

        {/* Control de Pagos */}
        <PagosControl
          tramiteId={tramite.id}
          userId={tramite.userId}
          pagos={tramite.pagos}
        />
      </div>

      {/* Reporting de Pagos */}
      {tramite.pagos.length > 0 && (
        <ReportingPagos pagos={tramite.pagos} />
      )}

      {/* Grid de Sistemas de Pago */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Honorarios - Mercado Pago */}
        <HonorariosMercadoPago
          tramiteId={tramite.id}
          pagos={tramite.pagos}
          plan={tramite.plan}
        />

        {/* Enlaces de Pago Externos (Tasas) */}
        <EnlacesPagoExterno
          tramiteId={tramite.id}
          enlaces={tramite.enlacesPago}
        />
      </div>

      {/* Datos Bancarios para Depósito de Capital */}
      <CuentaCapital
        tramiteId={tramite.id}
        capitalSocial={tramite.capitalSocial}
        cuentaInicial={null}
      />

      {/* Subir Documentos para que el Cliente Firme */}
      <SubirDocumentosParaCliente tramiteId={tramite.id} userId={tramite.userId} />

      {/* Enviar Observación al Cliente */}
      <ObservacionesForm tramiteId={tramite.id} userId={tramite.userId} />

      {/* Control de Etapas - Gestión del Proceso */}
      <EtapasManager 
        tramiteId={tramite.id}
        etapas={{
          formularioCompleto: tramite.formularioCompleto,
          denominacionReservada: tramite.denominacionReservada,
          capitalDepositado: tramite.capitalDepositado,
          tasaPagada: tramite.tasaPagada,
          documentosRevisados: tramite.documentosRevisados,
          documentosFirmados: tramite.documentosFirmados,
          tramiteIngresado: tramite.tramiteIngresado,
          sociedadInscripta: tramite.sociedadInscripta,
        }}
      />

      {/* Comprobantes de Pago */}
      <ComprobantesReview 
        tramiteId={tramite.id} 
        comprobantes={tramite.documentos.filter(doc => 
          doc.tipo === 'COMPROBANTE_DEPOSITO' || 
          doc.nombre.toLowerCase().includes('comprobante') ||
          doc.descripcion?.toLowerCase().includes('comprobante')
        )}
        enlacesPago={tramite.enlacesPago}
      />

      {/* Documentos */}
      <DocumentosReview tramiteId={tramite.id} documentos={tramite.documentos} />

      {/* Chat con el Cliente */}
      <ChatBox tramiteId={tramite.id} mensajesIniciales={tramite.mensajes} />

      {/* Datos Finales */}
      <DatosFinalesForm 
        tramiteId={tramite.id}
        cuitActual={tramite.cuit}
        matriculaActual={tramite.matricula}
        numeroResolucionActual={tramite.numeroResolucion}
        fechaInscripcionActual={tramite.fechaSociedadInscripta 
          ? new Date(tramite.fechaSociedadInscripta).toISOString().split('T')[0]
          : tramite.fechaInscripcion
          ? new Date(tramite.fechaInscripcion).toISOString().split('T')[0]
          : null}
      />
    </div>
  )
}

export default AdminTramiteDetallePage

