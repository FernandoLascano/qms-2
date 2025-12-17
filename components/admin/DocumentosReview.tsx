'use client'

import { useState } from 'react'
import CollapsibleCard from '@/components/admin/CollapsibleCard'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Eye, Download, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Documento {
  id: string
  tipo: string | null
  nombre: string
  url: string
  estado: string
  tamanio: number
  fechaSubida: Date
  observaciones: string | null
  userId?: string
}

interface DocumentosReviewProps {
  tramiteId: string
  documentos: Documento[]
}

export default function DocumentosReview({ tramiteId, documentos }: DocumentosReviewProps) {
  const router = useRouter()
  const [procesando, setProcesando] = useState<string | null>(null)

  // Filtrar solo documentos que el CLIENTE subió (excluir los que el admin envió para firmar)
  const tiposDeAdmin = ['DOCUMENTO_PARA_FIRMAR', 'ESTATUTO_PARA_FIRMAR', 'ACTA_PARA_FIRMAR']
  const documentosDelCliente = documentos.filter(doc => {
    // Excluir documentos que el admin envió para firmar (por tipo)
    if (tiposDeAdmin.includes(doc.tipo || '')) {
      return false
    }
    // Excluir documentos subidos por usuarios ADMIN (aunque no tengan el tipo correcto)
    // Esto cubre casos donde el tipo no se asignó correctamente
    if ((doc as any).user?.rol === 'ADMIN') {
      return false
    }
    // Solo mostrar documentos del cliente
    return true
  })

  const handleAprobar = async (documentoId: string) => {
    setProcesando(documentoId)

    try {
      const response = await fetch(`/api/admin/documentos/${documentoId}/aprobar`, {
        method: 'PATCH'
      })

      if (response.ok) {
        toast.success('Documento aprobado')
        router.refresh()
      } else {
        toast.error('Error al aprobar el documento')
      }
    } catch (error) {
      toast.error('Error al aprobar el documento')
    } finally {
      setProcesando(null)
    }
  }

  const handleRechazar = async (documentoId: string) => {
    const observacion = prompt('¿Por qué se rechaza el documento?')
    if (!observacion) return

    setProcesando(documentoId)

    try {
      const response = await fetch(`/api/admin/documentos/${documentoId}/rechazar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ observaciones: observacion })
      })

      if (response.ok) {
        toast.success('Documento rechazado')
        router.refresh()
      } else {
        toast.error('Error al rechazar el documento')
      }
    } catch (error) {
      toast.error('Error al rechazar el documento')
    } finally {
      setProcesando(null)
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

  const getTipoTexto = (tipo: string | null) => {
    if (!tipo) return 'Sin tipo'
    switch (tipo) {
      case 'DNI_SOCIO': return 'DNI de Socio'
      case 'CUIT_SOCIO': return 'CUIT de Socio'
      case 'COMPROBANTE_DOMICILIO': return 'Comprobante de Domicilio'
      case 'COMPROBANTE_DEPOSITO': return 'Comprobante de Depósito'
      case 'ESTATUTO_FIRMADO': return 'Estatuto Firmado'
      default: return 'Otro Documento'
    }
  }

  return (
    <div className="rounded-lg">
      <CollapsibleCard
        title={`Documentos Subidos por el Cliente (${documentosDelCliente.length})`}
        description="Revisa y aprueba o rechaza los documentos que el cliente ha subido"
        icon={<FileText className="h-5 w-5 text-indigo-700" />}
      >
        {documentosDelCliente.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            El cliente aún no ha subido documentos
          </p>
        ) : (
          <div className="space-y-3">
            {documentosDelCliente.map((doc) => (
              <div key={doc.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{doc.nombre}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(doc.estado)}`}>
                        {getEstadoTexto(doc.estado)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{getTipoTexto(doc.tipo)}</span>
                      <span>•</span>
                      <span>{format(new Date(doc.fechaSubida), "d 'de' MMM", { locale: es })}</span>
                      <span>•</span>
                      <span>{(doc.tamanio / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    {doc.observaciones && (
                      <p className="text-sm text-red-600 mt-2 italic">
                        {doc.observaciones}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="h-4 w-4" />
                        Ver
                      </Button>
                    </a>
                    
                    {doc.estado === 'PENDIENTE' || doc.estado === 'EN_REVISION' ? (
                      <>
                        <Button
                          size="sm"
                          className="gap-2 bg-green-600 hover:bg-green-700"
                          onClick={() => handleAprobar(doc.id)}
                          disabled={procesando === doc.id}
                        >
                          <CheckCircle className="h-4 w-4" />
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-2"
                          onClick={() => handleRechazar(doc.id)}
                          disabled={procesando === doc.id}
                        >
                          <XCircle className="h-4 w-4" />
                          Rechazar
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleCard>
    </div>
  )
}

