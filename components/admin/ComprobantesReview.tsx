'use client'

import { useState } from 'react'
import CollapsibleCard from '@/components/admin/CollapsibleCard'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Eye, FileText, Clock, AlertCircle, Download } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Comprobante {
  id: string
  nombre: string
  url: string
  estado: string
  tamanio: number
  fechaSubida: Date
  observaciones: string | null
  tipo: string
}

interface EnlacePago {
  id: string
  concepto: string
  monto: number
  estado: string
  fechaEnvio: Date
}

interface ComprobantesReviewProps {
  tramiteId: string
  comprobantes: Comprobante[]
  enlacesPago: EnlacePago[]
}

export default function ComprobantesReview({ tramiteId, comprobantes, enlacesPago }: ComprobantesReviewProps) {
  const router = useRouter()
  const [procesando, setProcesando] = useState<string | null>(null)

  const handleAprobar = async (comprobanteId: string) => {
    setProcesando(comprobanteId)

    try {
      const response = await fetch(`/api/admin/documentos/${comprobanteId}/aprobar`, {
        method: 'PATCH'
      })

      if (response.ok) {
        toast.success('Comprobante aprobado')
        router.refresh()
      } else {
        toast.error('Error al aprobar el comprobante')
      }
    } catch (error) {
      toast.error('Error al aprobar el comprobante')
    } finally {
      setProcesando(null)
    }
  }

  const handleRechazar = async (comprobanteId: string) => {
    const observacion = prompt('¿Por qué se rechaza el comprobante?')
    if (!observacion) return

    setProcesando(comprobanteId)

    try {
      const response = await fetch(`/api/admin/documentos/${comprobanteId}/rechazar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ observaciones: observacion })
      })

      if (response.ok) {
        toast.success('Comprobante rechazado')
        router.refresh()
      } else {
        toast.error('Error al rechazar el comprobante')
      }
    } catch (error) {
      toast.error('Error al rechazar el comprobante')
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

  const getConceptoTexto = (concepto: string) => {
    const conceptos: Record<string, string> = {
      'TASA_RESERVA_NOMBRE': 'Tasa de Reserva de Nombre',
      'TASA_RETRIBUTIVA': 'Tasa Retributiva Final',
      'PUBLICACION_BOLETIN': 'Publicación en Boletín',
      'OTROS': 'Otro Pago'
    }
    return conceptos[concepto] || concepto
  }

  // Encontrar el enlace de pago relacionado
  const getEnlaceRelacionado = (comprobanteNombre: string) => {
    return enlacesPago.find(enlace => 
      comprobanteNombre.includes(enlace.concepto) || 
      comprobanteNombre.includes(getConceptoTexto(enlace.concepto))
    )
  }

  return (
    <div className="rounded-lg">
      <CollapsibleCard
        title={`Comprobantes de Pago${comprobantes.length > 0 ? ` (${comprobantes.length})` : ''}`}
        description={comprobantes.length > 0 
          ? "Revisa y verifica los comprobantes de pago subidos por el cliente"
          : "Comprobantes de pago subidos por el cliente"
        }
        icon={<FileText className="h-5 w-5 text-sky-700" />}
      >
        {comprobantes.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            El cliente aún no ha subido comprobantes de pago
          </p>
        ) : (
          <div className="space-y-4">
            {comprobantes.map((comprobante) => {
            const enlaceRelacionado = getEnlaceRelacionado(comprobante.nombre)
            
            return (
              <div key={comprobante.id} className="border-2 rounded-lg p-4 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{comprobante.nombre}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(comprobante.estado)}`}>
                        {getEstadoTexto(comprobante.estado)}
                      </span>
                    </div>

                    {enlaceRelacionado && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
                        <p className="text-xs text-blue-900 flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          <strong>Pago relacionado:</strong> {getConceptoTexto(enlaceRelacionado.concepto)} - ${enlaceRelacionado.monto.toLocaleString('es-AR')}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(comprobante.fechaSubida), "d 'de' MMM, HH:mm", { locale: es })}
                      </span>
                      <span>•</span>
                      <span>{(comprobante.tamanio / 1024 / 1024).toFixed(2)} MB</span>
                    </div>

                    {comprobante.observaciones && (
                      <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          <strong>Observación:</strong> {comprobante.observaciones}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => {
                      try {
                        // Intentar abrir directamente la URL de Cloudinary
                        const url = comprobante.url
                        console.log('Abriendo URL:', url)
                        
                        // Si es un PDF de Cloudinary, usar la URL de descarga
                        if (url.includes('cloudinary.com') && url.includes('.pdf')) {
                          // Forzar descarga/visualización
                          const downloadUrl = url.replace('/upload/', '/upload/fl_attachment/')
                          window.open(downloadUrl, '_blank', 'noopener,noreferrer')
                        } else {
                          window.open(url, '_blank', 'noopener,noreferrer')
                        }
                      } catch (error) {
                        console.error('Error al abrir documento:', error)
                        toast.error('Error al abrir el documento')
                      }
                    }}
                  >
                    <Eye className="h-4 w-4" />
                    Ver Comprobante
                  </Button>
                  
                  <a 
                    href={comprobante.url} 
                    download={comprobante.nombre}
                    className="inline-block"
                  >
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Descargar
                    </Button>
                  </a>

                  {(comprobante.estado === 'PENDIENTE' || comprobante.estado === 'EN_REVISION') && (
                    <>
                      <Button
                        size="sm"
                        className="gap-2 bg-green-600 hover:bg-green-700"
                        onClick={() => handleAprobar(comprobante.id)}
                        disabled={procesando === comprobante.id}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-2"
                        onClick={() => handleRechazar(comprobante.id)}
                        disabled={procesando === comprobante.id}
                      >
                        <XCircle className="h-4 w-4" />
                        Rechazar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
          </div>
        )}
      </CollapsibleCard>
    </div>
  )
}

