import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, Building2, DollarSign, Users, User, CheckCircle, Clock, FileText, Download } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { notFound } from 'next/navigation'
import EnlacesPagoCliente from '@/components/cliente/EnlacesPagoCliente'
import HonorariosPagoCliente from '@/components/cliente/HonorariosPagoCliente'
import ProximosPasos from '@/components/cliente/ProximosPasos'
import TimelineProgreso from '@/components/cliente/TimelineProgreso'
import MensajesDelEquipo from '@/components/cliente/MensajesDelEquipo'
import DocumentosParaFirmar from '@/components/cliente/DocumentosParaFirmar'
import DepositoCapitalCliente from '@/components/cliente/DepositoCapitalCliente'
import ChatBox from '@/components/chat/ChatBox'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

async function TramiteDetallePage({ params }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return null
  }

  const { id } = await params

  const tramite = await prisma.tramite.findFirst({
    where: {
      id: id,
      userId: session.user.id // Solo puede ver sus propios trámites
    },
    include: {
      enlacesPago: {
        orderBy: { createdAt: 'desc' }
      },
      pagos: {
        orderBy: { createdAt: 'desc' }
      },
      documentos: {
        orderBy: { createdAt: 'desc' }
      },
      notificaciones: {
        orderBy: { createdAt: 'desc' },
        take: 10
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
      case 'COMPLETADO': return 'Completado'
      case 'EN_PROCESO': return 'En Proceso'
      case 'ESPERANDO_CLIENTE': return 'Requiere tu atención'
      case 'ESPERANDO_APROBACION': return 'Esperando aprobación'
      case 'INICIADO': return 'Iniciado'
      case 'CANCELADO': return 'Cancelado'
      default: return estado
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/tramites">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-red-900">
            {tramite.denominacionAprobada || tramite.denominacionSocial1}
          </h2>
          <p className="text-gray-600 mt-1">
            Detalle completo del trámite
          </p>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getEstadoColor(tramite.estadoGeneral)}`}>
          {getEstadoTexto(tramite.estadoGeneral)}
        </span>
      </div>

      {/* Próximos Pasos - Lo que el cliente DEBE hacer */}
      <ProximosPasos 
        tramite={tramite}
        pagos={tramite.pagos || []}
        enlacesPago={tramite.enlacesPago || []}
        documentos={tramite.documentos || []}
        notificaciones={tramite.notificaciones || []}
      />

      {/* Timeline de Progreso */}
      <TimelineProgreso tramite={tramite} />

      {/* Datos Finales - Si está inscripta (MOVIDO AQUÍ ARRIBA) */}
      {(tramite.cuit || tramite.matricula || tramite.numeroResolucion) && (
        <div className="space-y-6">
          <Card className="border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg animate-in fade-in slide-in-from-top-4 duration-500">
            <CardHeader>
              <CardTitle className="text-green-900 flex items-center gap-2 text-2xl">
                <CheckCircle className="h-8 w-8" />
                🎉 ¡Tu Sociedad Está Inscripta!
              </CardTitle>
              <CardDescription className="text-green-700 text-base">
                Estos son los datos oficiales de tu sociedad. Ya puedes comenzar a operar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                {tramite.cuit && (
                  <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                    <p className="text-sm text-green-700 mb-1 font-medium text-center uppercase tracking-wider">CUIT</p>
                    <p className="text-2xl font-bold text-green-900 text-center">{tramite.cuit}</p>
                  </div>
                )}
                {tramite.matricula && (
                  <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                    <p className="text-sm text-green-700 mb-1 font-medium text-center uppercase tracking-wider">Matrícula</p>
                    <p className="text-2xl font-bold text-green-900 text-center">{tramite.matricula}</p>
                  </div>
                )}
                {tramite.numeroResolucion && (
                  <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                    <p className="text-sm text-green-700 mb-1 font-medium text-center uppercase tracking-wider">Fecha Inscrip.</p>
                    <p className="text-2xl font-bold text-green-900 text-center">
                      {tramite.fechaInscripcion ? format(new Date(tramite.fechaInscripcion), "dd/MM/yyyy") : tramite.numeroResolucion}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Resolución de Inscripción - Documento destacado */}
              {(() => {
                const resolucionDoc = tramite.documentos.find(
                  (doc: any) => doc.tipo === 'RESOLUCION_FINAL' && doc.estado === 'APROBADO'
                )
                
                if (resolucionDoc) {
                  return (
                    <div className="bg-white/60 backdrop-blur-sm border-2 border-green-400 rounded-xl p-6 shadow-md">
                      <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="bg-green-600 p-4 rounded-full shadow-lg shrink-0">
                          <FileText className="h-10 w-10 text-white" />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                          <h3 className="text-xl font-bold text-green-900 mb-2">
                            📄 Resolución de Inscripción Oficial
                          </h3>
                          <p className="text-green-800 mb-4">
                            Ya puedes descargar el documento oficial emitido por el organismo.
                          </p>
                          <a
                            href={resolucionDoc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-4 rounded-full shadow-xl transition-all active:scale-95 hover:shadow-green-200"
                          >
                            <Download className="h-5 w-5" />
                            DESCARGAR RESOLUCIÓN
                          </a>
                        </div>
                      </div>
                    </div>
                  )
                }
                return null
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pago de Honorarios - DEBE estar visible para que funcione el link #pago-honorarios */}
      <HonorariosPagoCliente pagos={tramite.pagos || []} />

      {/* Mensajes del Equipo / Observaciones */}
      {tramite.notificaciones && tramite.notificaciones.length > 0 && (
        <MensajesDelEquipo notificaciones={tramite.notificaciones} />
      )}

      {/* Chat del Trámite - Antes de Información Detallada */}
      <ChatBox tramiteId={tramite.id} mensajesIniciales={tramite.mensajes} />

      {/* Divisor */}
      <div className="border-t-2 border-gray-200 my-8">
        <h3 className="text-xl font-bold text-red-900 mt-8 mb-4">
          📋 Información Detallada
        </h3>
        <p className="text-gray-600 mb-6">
          Datos completos de tu trámite y sociedad
        </p>
      </div>

      {/* Info General */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Información General
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        </CardContent>
      </Card>

      {/* Denominaciones Propuestas */}
      <Card>
        <CardHeader>
          <CardTitle>Denominaciones Propuestas</CardTitle>
          <CardDescription>Opciones de nombre para la sociedad</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
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
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Objeto Social */}
        <Card>
          <CardHeader>
            <CardTitle>Objeto Social</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-line">
              {tramite.objetoSocial}
            </p>
          </CardContent>
        </Card>

        {/* Domicilio Legal */}
        <Card>
          <CardHeader>
            <CardTitle>Domicilio Legal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">
              {tramite.domicilioLegal}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Socios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Socios / Accionistas ({socios.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {socios.map((socio: any, index: number) => {
              const capitalSocial = tramite.capitalSocial || 0
              
              // Calcular el aporteCapital correctamente
              let aporteCapital = 0
              if (typeof socio.aporteCapital === 'number') {
                aporteCapital = socio.aporteCapital
              } else if (typeof socio.aporteCapital === 'string') {
                // Si viene como string, puede tener formato con puntos o comas
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
                
                // Intentar obtener el porcentaje de diferentes campos
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
                    // El aporte puede estar guardado con un error de formato (multiplicado por 100)
                    const aporteCorregido = aporteCapital / 100
                    if (aporteCorregido <= capitalSocial) {
                      aporteCapital = aporteCorregido
                      porcentaje = capitalSocial > 0 ? ((aporteCapital / capitalSocial) * 100) : 0
                    }
                  }
                }
              }
              
              // Formatear porcentaje para mostrar
              const porcentajeFormateado = porcentaje.toFixed(2)
              
              // Construir domicilio completo con formato: calle - ciudad - departamento - provincia
              const domicilioCompleto = [
                socio.domicilio,
                socio.ciudad,
                socio.departamento,
                socio.provincia
              ].filter(Boolean).join(' - ') || 'No especificado'
              
              return (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {socio.nombre} {socio.apellido}
                      </h4>
                      <p className="text-sm text-gray-500">DNI: {socio.dni} • CUIT: {socio.cuit}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Aporte</p>
                      <p className="font-bold text-blue-600">${Math.round(aporteCapital).toLocaleString('es-AR')}</p>
                      <p className="text-xs text-gray-500">{porcentajeFormateado}%</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Domicilio</p>
                      <p className="text-gray-900">{domicilioCompleto}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Estado Civil</p>
                      <p className="text-gray-900">{socio.estadoCivil}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Profesión</p>
                      <p className="text-gray-900">{socio.profesion}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Administradores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Órgano de Administración ({administradores.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {administradores.map((admin: any, index: number) => {
              // Construir domicilio completo con formato: calle - ciudad - departamento - provincia
              const domicilioCompleto = [
                admin.domicilio,
                admin.ciudad,
                admin.departamento,
                admin.provincia
              ].filter(Boolean).join(' - ') || admin.domicilio || 'No especificado'
              
              return (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {admin.nombre} {admin.apellido}
                      </h4>
                      <p className="text-sm text-gray-500">DNI: {admin.dni} • CUIT: {admin.cuit}</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      {admin.cargo}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Domicilio</p>
                      <p className="text-gray-900">{domicilioCompleto}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Estado Civil</p>
                      <p className="text-gray-900">{admin.estadoCivil}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Profesión</p>
                      <p className="text-gray-900">{admin.profesion}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}

export default TramiteDetallePage

