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
        return <XCircle className="h-5 w-5 text-red-600" />
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
        return 'bg-red-100 text-red-800 border-red-200'
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

  const getTipoTexto = (tipo: string) => {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-red-900">Mis Documentos</h2>
          <p className="text-gray-600 mt-1">
            Gestiona todos los documentos de tus trámites
          </p>
        </div>
        <Link href="/dashboard/documentos/subir">
          <Button size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Upload className="h-5 w-5" />
            Subir Documento
          </Button>
        </Link>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentos.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprobados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {documentos.filter(d => d.estado === 'APROBADO').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Revisión</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {documentos.filter(d => d.estado === 'EN_REVISION').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {documentos.filter(d => d.estado === 'PENDIENTE').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Documentos */}
      {documentos.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No hay documentos aún
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Comienza subiendo los documentos necesarios para tu trámite de constitución.
              </p>
              <Link href="/dashboard/documentos/subir">
                <Button size="lg" className="gap-2">
                  <Upload className="h-5 w-5" />
                  Subir Mi Primer Documento
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Documentos Subidos</CardTitle>
            <CardDescription>
              Todos tus documentos organizados por trámite
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documentos.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {getEstadoIcon(doc.estado)}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-medium text-gray-900">{doc.nombre}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getEstadoColor(doc.estado)}`}>
                          {getEstadoTexto(doc.estado)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{getTipoTexto(doc.tipo)}</span>
                        <span>•</span>
                        <span>{doc.tramite.denominacionAprobada || doc.tramite.denominacionSocial1}</span>
                        <span>•</span>
                        <span>{format(new Date(doc.fechaSubida), "d 'de' MMMM, yyyy", { locale: es })}</span>
                        <span>•</span>
                        <span>{(doc.tamanio / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      {doc.observaciones && (
                        <p className="text-sm text-gray-600 mt-2 italic">
                          {doc.observaciones}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="gap-2">
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

