'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileText, Download, Upload, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Documento {
  id: string
  nombre: string
  descripcion: string | null
  url: string
  estado: string
  tipo: string | null
  createdAt: Date
  fechaAprobacion?: Date | null
  observaciones?: string | null
}

interface DocumentosParaFirmarProps {
  documentos: Documento[]
  tramiteId: string
}

export default function DocumentosParaFirmar({ documentos, tramiteId }: DocumentosParaFirmarProps) {
  const router = useRouter()
  const [archivosSeleccionados, setArchivosSeleccionados] = useState<Record<string, File | null>>({})
  const [subiendo, setSubiendo] = useState<Record<string, boolean>>({})

  // Tipos de documentos para firmar y sus correspondientes firmados
  const tiposParaFirmar = ['ESTATUTO_PARA_FIRMAR', 'ACTA_PARA_FIRMAR', 'DOCUMENTO_PARA_FIRMAR']
  
  // Mapeo de tipos para firmar a tipos firmados
  // NOTA: No incluimos 'OTROS' porque es demasiado genérico y causaría falsos positivos
  const mapeoTipos: Record<string, string[]> = {
    'ESTATUTO_PARA_FIRMAR': ['ESTATUTO_FIRMADO'],
    'ACTA_PARA_FIRMAR': ['ACTA_CONSTITUTIVA'],
    'DOCUMENTO_PARA_FIRMAR': ['ESTATUTO_FIRMADO', 'ACTA_CONSTITUTIVA']
  }

  // Debug: ver todos los documentos
  console.log('📄 Todos los documentos:', documentos.map(d => ({
    nombre: d.nombre,
    tipo: d.tipo,
    estado: d.estado,
    createdAt: d.createdAt
  })))
  
  // Debug: verificar documentos para firmar específicamente
  const docsParaFirmar = documentos.filter(d => tiposParaFirmar.includes(d.tipo || ''))
  console.log('📋 Documentos para firmar encontrados:', docsParaFirmar.map(d => ({
    nombre: d.nombre,
    tipo: d.tipo,
    estado: d.estado,
    fecha: d.createdAt
  })))

  // Función auxiliar para verificar si un documento tiene su versión firmada aprobada
  const tieneFirmadoAprobado = (doc: Documento) => {
    // Solo buscar si el documento es del tipo PARA_FIRMAR
    if (!tiposParaFirmar.includes(doc.tipo || '')) {
      return false
    }
    
    const tiposFirmadosCorrespondientes = mapeoTipos[doc.tipo || ''] || []
    
    // Buscar documentos firmados que:
    // 1. NO son del tipo PARA_FIRMAR (estos son los originales del admin)
    // 2. Están en estado APROBADO
    // 3. Fueron creados DESPUÉS del documento para firmar
    // 4. Para DOCUMENTO_PARA_FIRMAR, aceptamos cualquier tipo de documento firmado
    //    (porque el cliente puede subirlo como OTROS, ESTATUTO_FIRMADO, etc.)
    const encontrado = documentos.some(docFirmado => {
      // Excluir documentos PARA_FIRMAR (estos son los originales del admin)
      if (tiposParaFirmar.includes(docFirmado.tipo || '')) {
        return false
      }
      
      // El documento firmado debe haber sido creado después del documento para firmar
      const fechaValida = new Date(docFirmado.createdAt) >= new Date(doc.createdAt)
      
      // Verificar que esté aprobado
      const estaAprobado = docFirmado.estado === 'APROBADO'
      
      // Verificar que el documento firmado esté relacionado con el original
      // La descripción siempre contiene "correspondiente a: [nombre del documento original]"
      // cuando se sube desde este componente
      const descripcionFirmado = docFirmado.descripcion?.toLowerCase() || ''
      const nombreOriginal = doc.nombre.toLowerCase()
      const estaRelacionado = descripcionFirmado.includes('correspondiente a') && 
                             descripcionFirmado.includes(nombreOriginal)
      
      // Para DOCUMENTO_PARA_FIRMAR, aceptamos cualquier tipo de documento firmado
      // PERO debe estar relacionado con el documento original (verificado por la descripción)
      if (doc.tipo === 'DOCUMENTO_PARA_FIRMAR') {
        if (fechaValida && estaAprobado && estaRelacionado) {
          console.log('✅ Encontrado documento firmado aprobado para DOCUMENTO_PARA_FIRMAR:', {
            paraFirmar: doc.nombre,
            paraFirmarFecha: doc.createdAt,
            firmado: docFirmado.nombre,
            firmadoTipo: docFirmado.tipo,
            firmadoEstado: docFirmado.estado,
            firmadoFecha: docFirmado.createdAt
          })
          return true
        }
        return false
      }
      
      // Para otros tipos (ESTATUTO_PARA_FIRMAR, ACTA_PARA_FIRMAR), usar el mapeo estricto
      // Y también verificar que esté relacionado por la descripción
      const esTipoCorrecto = tiposFirmadosCorrespondientes.includes(docFirmado.tipo || '')
      
      if (esTipoCorrecto && estaAprobado && fechaValida && estaRelacionado) {
        console.log('✅ Encontrado documento firmado aprobado:', {
          original: doc.nombre,
          originalTipo: doc.tipo,
          originalFecha: doc.createdAt,
          firmado: docFirmado.nombre,
          tipoFirmado: docFirmado.tipo,
          estado: docFirmado.estado,
          firmadoFecha: docFirmado.createdAt
        })
      }
      
      return esTipoCorrecto && estaAprobado && fechaValida && estaRelacionado
    })
    
    return encontrado
  }

  // Función auxiliar para verificar si un documento tiene su versión firmada subida pero aún no aprobada
  const tieneFirmadoPendiente = (doc: Documento): Documento | null => {
    // Solo buscar si el documento es del tipo PARA_FIRMAR
    if (!tiposParaFirmar.includes(doc.tipo || '')) {
      return null
    }
    
    const tiposFirmadosCorrespondientes = mapeoTipos[doc.tipo || ''] || []
    
    // Buscar documentos firmados que:
    // 1. NO son del tipo PARA_FIRMAR (estos son los originales del admin)
    // 2. Están en estado PENDIENTE o RECHAZADO (subidos pero no aprobados aún)
    // 3. Fueron creados DESPUÉS del documento para firmar
    // 4. Tienen el nombre del documento original en su nombre o descripción (para relacionarlos)
    const encontrado = documentos.find(docFirmado => {
      // Excluir documentos PARA_FIRMAR (estos son los originales del admin)
      if (tiposParaFirmar.includes(docFirmado.tipo || '')) {
        return false
      }
      
      // El documento firmado debe haber sido creado después del documento para firmar
      const fechaValida = new Date(docFirmado.createdAt) >= new Date(doc.createdAt)
      
      // Verificar que esté pendiente o rechazado
      const estaPendiente = docFirmado.estado === 'PENDIENTE' || docFirmado.estado === 'RECHAZADO'
      
      if (!fechaValida || !estaPendiente) {
        return false
      }
      
      // Verificar que el documento firmado esté relacionado con el original
      // La descripción siempre contiene "correspondiente a: [nombre del documento original]"
      // cuando se sube desde este componente, así que usamos eso para relacionarlos
      const descripcionFirmado = docFirmado.descripcion?.toLowerCase() || ''
      const nombreOriginal = doc.nombre.toLowerCase()
      // Verificar que la descripción contenga "correspondiente a" y el nombre del documento original
      const estaRelacionado = descripcionFirmado.includes('correspondiente a') && 
                             descripcionFirmado.includes(nombreOriginal)
      
      // Para DOCUMENTO_PARA_FIRMAR, aceptamos cualquier tipo de documento firmado
      // PERO debe estar relacionado con el documento original (verificado por la descripción)
      if (doc.tipo === 'DOCUMENTO_PARA_FIRMAR') {
        if (estaRelacionado) {
          console.log('✅ Encontrado documento firmado pendiente para DOCUMENTO_PARA_FIRMAR:', {
            paraFirmar: doc.nombre,
            paraFirmarFecha: doc.createdAt,
            firmado: docFirmado.nombre,
            firmadoTipo: docFirmado.tipo,
            firmadoEstado: docFirmado.estado,
            firmadoFecha: docFirmado.createdAt,
            relacionado: estaRelacionado
          })
          return true
        }
        return false
      }
      
      // Para otros tipos (ESTATUTO_PARA_FIRMAR, ACTA_PARA_FIRMAR), usar el mapeo estricto
      // Y también verificar que esté relacionado por la descripción
      const esTipoCorrecto = tiposFirmadosCorrespondientes.includes(docFirmado.tipo || '')
      
      return esTipoCorrecto && estaRelacionado
    })
    
    return encontrado || null
  }

  // Función para obtener el tipo de documento firmado basado en el tipo original
  const getTipoDocumentoFirmado = (tipoOriginal: string | null): string => {
    if (tipoOriginal === 'ESTATUTO_PARA_FIRMAR') return 'ESTATUTO_FIRMADO'
    if (tipoOriginal === 'ACTA_PARA_FIRMAR') return 'ACTA_CONSTITUTIVA'
    // Para DOCUMENTO_PARA_FIRMAR, usamos OTROS ya que puede ser cualquier tipo
    return 'OTROS'
  }

  const handleFileChange = (docId: string, file: File | null) => {
    if (file) {
      // Validar tamaño (máx 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo no puede superar los 10MB')
        return
      }
      // Validar tipo
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Solo se permiten archivos PDF, JPG o PNG')
        return
      }
    }
    setArchivosSeleccionados(prev => ({ ...prev, [docId]: file }))
  }

  const handleSubirFirmado = async (doc: Documento) => {
    // Validación estricta: verificar que hay archivo seleccionado
    const archivo = archivosSeleccionados[doc.id]
    if (!archivo) {
      toast.error('Debes seleccionar un archivo para este documento')
      return
    }

    // Prevenir múltiples subidas simultáneas
    if (subiendo[doc.id]) {
      toast.warning('Ya se está subiendo este documento')
      return
    }

    // Verificar que el archivo sigue siendo válido
    if (archivo.size === 0) {
      toast.error('El archivo seleccionado está vacío')
      return
    }

    setSubiendo(prev => ({ ...prev, [doc.id]: true }))

    try {
      const formData = new FormData()
      formData.append('file', archivo)
      formData.append('tramiteId', tramiteId)
      formData.append('tipo', getTipoDocumentoFirmado(doc.tipo))
      formData.append('nombre', `${doc.nombre} - Firmado`)
      formData.append('descripcion', `Documento firmado correspondiente a: ${doc.nombre}`)
      formData.append('documentoOriginalId', doc.id) // Para relacionarlo explícitamente

      const response = await fetch('/api/documentos/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success(`Documento "${doc.nombre}" subido correctamente`)
        // Limpiar el archivo seleccionado para este documento específico
        setArchivosSeleccionados(prev => {
          const nuevo = { ...prev }
          delete nuevo[doc.id]
          return nuevo
        })
        // Esperar un momento antes de refrescar para que el servidor procese
        setTimeout(() => {
          router.refresh()
        }, 500)
      } else {
        toast.error(result.error || 'Error al subir el documento')
        setSubiendo(prev => ({ ...prev, [doc.id]: false }))
      }
    } catch (error) {
      console.error('Error al subir documento:', error)
      toast.error('Error al subir el documento')
      setSubiendo(prev => ({ ...prev, [doc.id]: false }))
    }
  }

  // Filtrar documentos para firmar que:
  // 1. Son del tipo correcto (PARA_FIRMAR)
  // 2. Están en estado PENDIENTE
  // 3. NO tienen un documento firmado correspondiente APROBADO
  // 4. NO tienen un documento firmado subido esperando validación
  const documentosPendientes = documentos.filter(doc => {
    if (!tiposParaFirmar.includes(doc.tipo || '')) {
      return false
    }
    if (doc.estado !== 'PENDIENTE') {
      return false
    }
    // Excluir si ya tiene un documento firmado aprobado
    if (tieneFirmadoAprobado(doc)) {
      return false
    }
    // Excluir si ya tiene un documento firmado subido esperando validación
    if (tieneFirmadoPendiente(doc)) {
      return false
    }
    return true
  })

  // Documentos que ya fueron subidos pero están esperando validación
  const documentosEnValidacion = documentos.filter(doc => {
    if (!tiposParaFirmar.includes(doc.tipo || '')) {
      return false
    }
    // Solo mostrar si tiene un documento firmado pendiente (no aprobado aún)
    const firmadoPendiente = tieneFirmadoPendiente(doc)
    return firmadoPendiente !== null && !tieneFirmadoAprobado(doc)
  })

  // Documentos que ya fueron firmados y aprobados
  // IMPORTANTE: Solo mostrar si realmente existe un documento firmado APROBADO
  const documentosAprobados = documentos.filter(doc => {
    // Solo documentos del tipo PARA_FIRMAR
    if (!tiposParaFirmar.includes(doc.tipo || '')) {
      return false
    }
    
    // Verificar que realmente existe un documento firmado aprobado
    const tieneAprobado = tieneFirmadoAprobado(doc)
    
    console.log('✅ Verificando documento aprobado:', doc.nombre, 'tipo:', doc.tipo, 'estado:', doc.estado, 'tieneAprobado:', tieneAprobado)
    
    return tieneAprobado
  })
  
  console.log('📊 Resumen:', {
    pendientes: documentosPendientes.length,
    enValidacion: documentosEnValidacion.length,
    aprobados: documentosAprobados.length,
    total: documentos.length
  })

  return (
    <Card id="documentos-para-firmar" className="scroll-mt-4 border-2 border-purple-300 bg-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <FileText className="h-6 w-6" />
          ✍️ Documentos para Firmar
        </CardTitle>
        <CardDescription className="text-purple-700">
          {documentosPendientes.length > 0 
            ? 'Descarga estos documentos, fírmalos y súbelos firmados'
            : documentosEnValidacion.length > 0
            ? 'Documentos subidos esperando validación'
            : 'Documentos enviados para firmar y su estado'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Documentos Pendientes */}
        {documentosPendientes.length > 0 ? (
          <div className="space-y-4">
            {documentosPendientes.map((doc) => (
          <div
            key={doc.id}
            className="p-4 bg-white border-2 border-purple-200 rounded-lg"
          >
            <div className="flex items-start gap-3 mb-3">
              <FileText className="h-8 w-8 text-purple-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 mb-1">
                  {doc.nombre}
                </h4>
                <p className="text-xs text-gray-500">
                  Enviado el {new Date(doc.createdAt).toLocaleDateString('es-AR')}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {/* Paso 1: Descargar */}
              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    Descargar documento
                  </p>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium"
                  >
                    <Download className="h-4 w-4" />
                    Ver / Descargar
                  </a>
                </div>
              </div>

              {/* Paso 2: Firmar */}
              <div className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Instrucciones de firma:
                  </p>
                  <p className="text-sm text-purple-900 font-bold bg-white/50 p-2 rounded border border-purple-100 italic">
                    {doc.descripcion || 'Firmar en todas las páginas indicadas'}
                  </p>
                </div>
              </div>

              {/* Paso 3: Subir */}
              <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </span>
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium text-gray-900">
                    Subir documento firmado
                  </p>
                  <Input
                    key={`file-input-${doc.id}-${archivosSeleccionados[doc.id] ? 'filled' : 'empty'}`}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(doc.id, e.target.files?.[0] || null)}
                    disabled={subiendo[doc.id]}
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    Formatos aceptados: PDF, JPG o PNG (máx. 10MB)
                  </p>
                  {archivosSeleccionados[doc.id] && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {archivosSeleccionados[doc.id]?.name}
                    </p>
                  )}
                  <Button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleSubirFirmado(doc)
                    }}
                    disabled={subiendo[doc.id] || !archivosSeleccionados[doc.id]}
                    className="gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    size="sm"
                    type="button"
                  >
                    <Upload className="h-4 w-4" />
                    {subiendo[doc.id] ? 'Subiendo...' : 'Subir Firmado'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6 text-center">
            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700">
              No hay documentos pendientes para firmar
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {documentosAprobados.length > 0 
                ? 'Todos los documentos pendientes han sido procesados'
                : 'Aún no se han enviado documentos para firmar'
              }
            </p>
          </div>
        )}

        {/* Documentos En Validación (subidos pero esperando aprobación) */}
        {documentosEnValidacion.length > 0 && (
          <div className="space-y-4">
            <div className="border-t border-purple-200 pt-4">
              <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                Documentos en Validación
              </h3>
              {documentosEnValidacion.map((doc) => {
                const documentoFirmado = tieneFirmadoPendiente(doc)
                const estaRechazado = documentoFirmado?.estado === 'RECHAZADO'

                return (
                  <div
                    key={doc.id}
                    className={`p-4 border-2 rounded-lg ${
                      estaRechazado
                        ? 'bg-brand-50 border-brand-200'
                        : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Clock className={`h-6 w-6 flex-shrink-0 mt-0.5 ${
                        estaRechazado ? 'text-brand-600' : 'text-yellow-600'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-semibold ${
                            estaRechazado ? 'text-brand-900' : 'text-yellow-900'
                          }`}>
                            {doc.nombre}
                          </h4>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            estaRechazado
                              ? 'bg-brand-600 text-white'
                              : 'bg-yellow-600 text-white'
                          }`}>
                            {estaRechazado ? 'Rechazado' : 'Esperando Validación'}
                          </span>
                        </div>
                        {documentoFirmado && (
                          <>
                            <p className={`text-xs mb-1 ${
                              estaRechazado ? 'text-brand-700' : 'text-yellow-700'
                            }`}>
                              {estaRechazado ? (
                                <>⚠️ Documento rechazado. Por favor, revisa los comentarios y sube una nueva versión.</>
                              ) : (
                                <>⏳ Subido el {new Date(documentoFirmado.createdAt).toLocaleDateString('es-AR')}. Esperando validación por Quiero Mi SAS.</>
                              )}
                            </p>
                            {estaRechazado && documentoFirmado.observaciones && (
                              <div className="mt-2 p-2 bg-brand-100 border border-brand-300 rounded text-xs text-brand-900">
                                <strong>Comentarios:</strong> {documentoFirmado.observaciones}
                              </div>
                            )}
                            {estaRechazado && (
                              <div className="mt-3 space-y-2">
                                <Input
                                  key={`file-input-rechazado-${doc.id}-${archivosSeleccionados[doc.id] ? 'filled' : 'empty'}`}
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => handleFileChange(doc.id, e.target.files?.[0] || null)}
                                  disabled={subiendo[doc.id]}
                                  className="text-sm"
                                />
                                {archivosSeleccionados[doc.id] && (
                                  <p className="text-xs text-green-600 flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    {archivosSeleccionados[doc.id]?.name}
                                  </p>
                                )}
                                <Button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleSubirFirmado(doc)
                                  }}
                                  disabled={subiendo[doc.id] || !archivosSeleccionados[doc.id]}
                                  className="gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  size="sm"
                                  type="button"
                                >
                                  <Upload className="h-4 w-4" />
                                  {subiendo[doc.id] ? 'Subiendo...' : 'Subir Nueva Versión'}
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                        {doc.descripcion && (
                          <p className="text-sm text-gray-600 mt-2">
                            {doc.descripcion}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Documentos Aprobados */}
        {documentosAprobados.length > 0 && (
          <div className="space-y-4">
            <div className="border-t border-purple-200 pt-4">
              <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Documentos Aprobados
              </h3>
              {documentosAprobados.map((doc) => {
                // Buscar el documento firmado aprobado correspondiente
                const tiposFirmadosCorrespondientes = mapeoTipos[doc.tipo || ''] || []
                const documentoFirmado = documentos.find(docFirmado => {
                  // Excluir documentos PARA_FIRMAR (estos son los originales del admin)
                  if (tiposParaFirmar.includes(docFirmado.tipo || '')) {
                    return false
                  }
                  // Buscar documentos firmados aprobados
                  return tiposFirmadosCorrespondientes.includes(docFirmado.tipo || '') &&
                         docFirmado.estado === 'APROBADO'
                })

                return (
                  <div
                    key={doc.id}
                    className="p-4 bg-green-50 border-2 border-green-200 rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-green-900">
                            {doc.nombre}
                          </h4>
                          <span className="px-2 py-0.5 text-xs font-medium bg-green-600 text-white rounded-full">
                            Aprobado
                          </span>
                        </div>
                        {documentoFirmado && (
                          <p className="text-xs text-green-700 mb-1">
                            ✓ Firmado y aprobado el {new Date(documentoFirmado.fechaAprobacion || documentoFirmado.createdAt).toLocaleDateString('es-AR')}
                          </p>
                        )}
                        {doc.descripcion && (
                          <p className="text-sm text-gray-600 mt-2">
                            {doc.descripcion}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Mensaje importante solo si hay pendientes */}
        {documentosPendientes.length > 0 && (
          <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-900 mb-1">
                  ⚠️ Importante
                </p>
                <p className="text-sm text-orange-800">
                  Una vez que hayas firmado los documentos, sube cada uno con el botón "Subir Firmado". 
                  Nosotros los revisaremos y te confirmaremos si están correctos.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

