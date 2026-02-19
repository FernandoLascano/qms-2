import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Upload, Download, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

async function DocumentosPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return null
  }

  const documentos = await prisma.documento.findMany({
    where: {
      userId: session.user.id
    },
    include: {
      tramite: {
        select: {
          denominacionSocial1: true,
          denominacionAprobada: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'APROBADO':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'RECHAZADO':
        return <XCircle className="h-5 w-5 text-brand-600" />
      case 'EN_REVISION':
        return <Clock className="h-5 w-5 text-blue-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-orange-600" />
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'APROBADO':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'RECHAZADO':
        return 'bg-brand-100 text-brand-800 border-brand-200'
      case 'EN_REVISION':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-orange-100 text-orange-800 border-orange-200'
    }
  }

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case 'APROBADO': return 'Aprobado'
      case 'RECHAZADO': return 'Rechazado'
      case 'EN_REVISION': return 'En Revisión'
      default: return 'Pendiente'
    }
  }

  const getTipoTexto = (tipo: string | null) => {
    if (!tipo) return 'Sin tipo'
    switch (tipo) {
      case 'DNI_SOCIO': return 'DNI de Socio'
      case 'CUIT_SOCIO': return 'CUIT de Socio'
      case 'COMPROBANTE_DOMICILIO': return 'Comprobante de Domicilio'
      case 'COMPROBANTE_DEPOSITO': return 'Comprobante de Depósito'
      case 'ESTATUTO_FIRMADO': return 'Estatuto Firmado'
      case 'ACTA_CONSTITUTIVA': return 'Acta Constitutiva'
      case 'CERTIFICACION_FIRMA': return 'Certificación de Firma'
      case 'RESOLUCION_FINAL': return 'Resolución Final'
      case 'CONSTANCIA_CUIT': return 'Constancia de CUIT'
      default: return 'Otro Documento'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <span className="inline-block text-brand-700 font-semibold text-sm tracking-wider uppercase mb-2">
            Archivos
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900">
            Mis <span className="text-brand-700">Documentos</span>
          </h1>
          <p className="text-gray-500 mt-2 text-lg">
            Gestiona todos los documentos de tus trámites
          </p>
        </div>
        <Link href="/dashboard/documentos/subir">
          <Button size="lg" className="gap-2 bg-brand-700 hover:bg-brand-800 rounded-xl shadow-lg shadow-brand-200 font-semibold">
            <Upload className="h-5 w-5" />
            Subir Documento
          </Button>
        </Link>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="hover:shadow-lg hover:border-gray-300 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-gray-900">{documentos.length}</p>
            <p className="text-xs text-gray-500 mt-1">Documentos subidos</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg hover:border-green-200 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Aprobados</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-green-600">
              {documentos.filter(d => d.estado === 'APROBADO').length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Documentos validados</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg hover:border-blue-200 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">En Revisión</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-blue-600">
              {documentos.filter(d => d.estado === 'EN_REVISION').length}
            </p>
            <p className="text-xs text-gray-500 mt-1">En proceso</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg hover:border-orange-200 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pendientes</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-orange-600">
              {documentos.filter(d => d.estado === 'PENDIENTE').length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Por revisar</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Documentos */}
      {documentos.length === 0 ? (
        <Card className="shadow-lg">
          <CardContent className="py-16">
            <div className="text-center">
              <div className="h-20 w-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <FileText className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No hay documentos aún
              </h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto text-lg">
                Comienza subiendo los documentos necesarios para tu trámite de constitución.
              </p>
              <Link href="/dashboard/documentos/subir">
                <Button size="lg" className="gap-2 bg-brand-700 hover:bg-brand-800 rounded-xl shadow-lg shadow-brand-200">
                  <Upload className="h-5 w-5" />
                  Subir Mi Primer Documento
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-xl font-bold text-gray-900">Documentos Subidos</CardTitle>
            <CardDescription>
              Todos tus documentos organizados por trámite
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {documentos.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-5 border-2 border-gray-200 rounded-2xl hover:border-gray-300 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {getEstadoIcon(doc.estado)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h4 className="font-semibold text-gray-900">{doc.nombre}</h4>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${getEstadoColor(doc.estado)}`}>
                          {getEstadoTexto(doc.estado)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                        <span className="font-medium text-brand-700">{getTipoTexto(doc.tipo)}</span>
                        <span className="text-gray-300">•</span>
                        <span>{doc.tramite.denominacionAprobada || doc.tramite.denominacionSocial1}</span>
                        <span className="text-gray-300">•</span>
                        <span>{format(new Date(doc.fechaSubida), "d 'de' MMMM, yyyy", { locale: es })}</span>
                        <span className="text-gray-300">•</span>
                        <span>{(doc.tamanio / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      {doc.observaciones && (
                        <p className="text-sm text-gray-600 mt-2 italic">
                          {doc.observaciones}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="gap-2 rounded-xl border-gray-200 hover:border-brand-300 hover:text-brand-700">
                        <Download className="h-4 w-4" />
                        Descargar
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default DocumentosPage

