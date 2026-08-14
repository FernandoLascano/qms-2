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
        return <CheckCircle className="h-5 w-5 text-success" />
      case 'RECHAZADO':
        return <XCircle className="h-5 w-5 text-primary" />
      case 'EN_REVISION':
        return <Clock className="h-5 w-5 text-info" />
      default:
        return <AlertCircle className="h-5 w-5 text-warning" />
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'APROBADO':
        return 'bg-success-soft text-success border-success-line'
      case 'RECHAZADO':
        return 'bg-primary-soft text-primary border-primary-line'
      case 'EN_REVISION':
        return 'bg-info-soft text-info border-info-line'
      default:
        return 'bg-warning-soft text-warning border-warning-line'
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
          <h1 className="text-display text-ink">
            Mis Documentos
          </h1>
          <p className="mt-1 text-body text-ink-2">
            Gestiona todos los documentos de tus trámites
          </p>
        </div>
        <Link href="/dashboard/documentos/subir">
          <Button size="lg" className="gap-2 bg-primary hover:bg-primary-hover rounded-control shadow-raise font-semibold">
            <Upload className="h-5 w-5" />
            Subir Documento
          </Button>
        </Link>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="hover:shadow-raise hover:border-line-strong transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-body-sm font-medium text-ink-2">Total</CardTitle>
            <div className="h-10 w-10 rounded-control bg-surface-3 flex items-center justify-center">
              <FileText className="h-5 w-5 text-ink-2" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-display text-ink">{documentos.length}</p>
            <p className="text-label text-ink-2 mt-1">Documentos subidos</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-raise hover:border-success-line transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-body-sm font-medium text-ink-2">Aprobados</CardTitle>
            <div className="h-10 w-10 rounded-control bg-success-soft flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-display font-semibold text-success">
              {documentos.filter(d => d.estado === 'APROBADO').length}
            </p>
            <p className="text-label text-ink-2 mt-1">Documentos validados</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-raise hover:border-info-line transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-body-sm font-medium text-ink-2">En Revisión</CardTitle>
            <div className="h-10 w-10 rounded-control bg-info-soft flex items-center justify-center">
              <Clock className="h-5 w-5 text-info" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-display font-semibold text-info">
              {documentos.filter(d => d.estado === 'EN_REVISION').length}
            </p>
            <p className="text-label text-ink-2 mt-1">En proceso</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-raise hover:border-warning-line transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-body-sm font-medium text-ink-2">Pendientes</CardTitle>
            <div className="h-10 w-10 rounded-control bg-warning-soft flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-display font-semibold text-warning">
              {documentos.filter(d => d.estado === 'PENDIENTE').length}
            </p>
            <p className="text-label text-ink-2 mt-1">Por revisar</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Documentos */}
      {documentos.length === 0 ? (
        <Card className="shadow-raise">
          <CardContent className="py-16">
            <div className="text-center">
              <div className="h-20 w-20 rounded-card bg-surface-3 flex items-center justify-center mx-auto mb-6">
                <FileText className="h-10 w-10 text-ink-3" />
              </div>
              <h3 className="text-title font-semibold text-ink mb-2">
                No hay documentos aún
              </h3>
              <p className="text-ink-2 mb-8 max-w-md mx-auto text-heading">
                Comienza subiendo los documentos necesarios para tu trámite de constitución.
              </p>
              <Link href="/dashboard/documentos/subir">
                <Button size="lg" className="gap-2 bg-primary hover:bg-primary-hover rounded-control shadow-raise">
                  <Upload className="h-5 w-5" />
                  Subir Mi Primer Documento
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-raise">
          <CardHeader className="border-b border-line">
            <CardTitle className="text-title font-semibold text-ink">Documentos Subidos</CardTitle>
            <CardDescription>
              Todos tus documentos organizados por trámite
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {documentos.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-card border-2 border-line rounded-card hover:border-line-strong hover:shadow-raise transition-all"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-12 w-12 rounded-control bg-surface-3 flex items-center justify-center flex-shrink-0">
                      {getEstadoIcon(doc.estado)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h4 className="font-semibold text-ink">{doc.nombre}</h4>
                        <span className={`px-3 py-1 rounded-control text-label font-medium border ${getEstadoColor(doc.estado)}`}>
                          {getEstadoTexto(doc.estado)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-body-sm text-ink-2 flex-wrap">
                        <span className="font-medium text-primary">{getTipoTexto(doc.tipo)}</span>
                        <span className="text-ink-3">•</span>
                        <span>{doc.tramite.denominacionAprobada || doc.tramite.denominacionSocial1}</span>
                        <span className="text-ink-3">•</span>
                        <span>{format(new Date(doc.fechaSubida), "d 'de' MMMM, yyyy", { locale: es })}</span>
                        <span className="text-ink-3">•</span>
                        <span>{(doc.tamanio / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      {doc.observaciones && (
                        <p className="text-body-sm text-ink-2 mt-2 italic">
                          {doc.observaciones}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a href={`/api/documentos/${doc.id}/view?download=1`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="gap-2 rounded-control border-line hover:border-primary-line hover:text-primary">
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

