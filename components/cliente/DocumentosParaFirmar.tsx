'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, Upload, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { FileInput } from '@/components/ui/file-input'

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
  const [subiendoTodos, setSubiendoTodos] = useState(false)

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

  // Sube todos los firmados seleccionados de una sola vez (un solo refresco al final).
  const handleSubirTodos = async () => {
    const conArchivo = documentosPendientes.filter(doc => archivosSeleccionados[doc.id])
    if (conArchivo.length === 0) {
      toast.error('Elegí al menos un archivo firmado')
      return
    }
    setSubiendoTodos(true)
    let ok = 0
    for (const doc of conArchivo) {
      const archivo = archivosSeleccionados[doc.id]
      if (!archivo || archivo.size === 0) continue
      try {
        const formData = new FormData()
        formData.append('file', archivo)
        formData.append('tramiteId', tramiteId)
        formData.append('tipo', getTipoDocumentoFirmado(doc.tipo))
        formData.append('nombre', `${doc.nombre} - Firmado`)
        formData.append('descripcion', `Documento firmado correspondiente a: ${doc.nombre}`)
        formData.append('documentoOriginalId', doc.id)
        const response = await fetch('/api/documentos/upload', { method: 'POST', body: formData })
        const result = await response.json()
        if (response.ok && result.success) ok++
      } catch {
        // Seguimos con el resto
      }
    }
    setSubiendoTodos(false)
    if (ok > 0) {
      toast.success(`${ok} documento(s) firmado(s) subido(s)`)
      setArchivosSeleccionados({})
      setTimeout(() => router.refresh(), 500)
    } else {
      toast.error('No se pudo subir ningún documento')
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
    <Card id="documentos-para-firmar" className="scroll-mt-4 border-2 border-info-line bg-info-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-info">
          <FileText className="h-6 w-6" />
          Documentos para Firmar
        </CardTitle>
        <CardDescription className="text-info">
          {documentosPendientes.length > 0 
            ? 'Descarga estos documentos, fírmalos y súbelos firmados'
            : documentosEnValidacion.length > 0
            ? 'Documentos subidos esperando validación'
            : 'Documentos enviados para firmar y su estado'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Nota general + subida en lote. Las instrucciones específicas van en cada documento. */}
        {documentosPendientes.length > 0 && (
          <div className="rounded-control bg-surface border border-info-line p-4 space-y-2">
            <p className="text-body-sm text-ink-2">
              Cada documento tiene sus <strong>instrucciones de firma específicas</strong> (mirá el paso 2 de cada uno). Firmá cada uno como se indica y subí las versiones firmadas.
            </p>
            {documentosPendientes.length > 1 && (
              <div className="pt-2">
                <Button
                  onClick={handleSubirTodos}
                  disabled={subiendoTodos}
                  className="gap-2 bg-info-solid hover:bg-info-solid"
                >
                  <Upload className="h-4 w-4" />
                  {subiendoTodos ? 'Subiendo...' : 'Subir todos los firmados de una vez'}
                </Button>
                <p className="text-label text-ink-2 mt-1">
                  Elegí el archivo firmado en cada documento de abajo y subilos todos juntos.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Documentos Pendientes */}
        {documentosPendientes.length > 0 ? (
          <div className="space-y-4">
            {documentosPendientes.map((doc) => (
          <div
            key={doc.id}
            className="p-4 bg-surface border-2 border-info-line rounded-control"
          >
            <div className="flex items-start gap-3 mb-3">
              <FileText className="h-8 w-8 text-info flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-ink mb-1">
                  {doc.nombre}
                </h4>
                <p className="text-label text-ink-2">
                  Enviado el {new Date(doc.createdAt).toLocaleDateString('es-AR')}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {/* Paso 1: Descargar */}
              <div className="flex items-start gap-3 p-3 bg-info-soft border border-info-line rounded-control">
                <span className="flex-shrink-0 w-6 h-6 bg-info-solid text-on-primary rounded-full flex items-center justify-center text-body-sm font-semibold">
                  1
                </span>
                <div className="flex-1">
                  <p className="text-body-sm font-medium text-ink mb-2">
                    Descargar documento
                  </p>
                  <a
                    href={`/api/documentos/${doc.id}/view?download=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-info-solid hover:bg-info-solid text-on-primary px-3 py-1 rounded-chip text-body-sm font-medium"
                  >
                    <Download className="h-4 w-4" />
                    Ver / Descargar
                  </a>
                </div>
              </div>

              {/* Paso 2: Firmar */}
              <div className="flex items-start gap-3 p-3 bg-info-soft border border-info-line rounded-control">
                <span className="flex-shrink-0 w-6 h-6 bg-info-solid text-on-primary rounded-full flex items-center justify-center text-body-sm font-semibold">
                  2
                </span>
                <div className="flex-1">
                  <p className="text-body-sm font-medium text-ink mb-1">
                    Instrucciones de firma:
                  </p>
                  <p className="text-body-sm text-info font-semibold bg-surface/50 p-2 rounded border border-info-line italic">
                    {doc.descripcion || 'Firmar en todas las páginas indicadas'}
                  </p>
                  {doc.tipo === 'ESTATUTO_PARA_FIRMAR' && (
                    <a
                      href="/assets/img/InstructivoFirma.jpeg"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-2 text-body-sm font-medium text-primary underline hover:text-primary"
                    >
                      Ver instructivo de firma digital (Ciudadano Digital)
                    </a>
                  )}
                </div>
              </div>

              {/* Paso 3: Subir */}
              <div className="flex items-start gap-3 p-3 bg-success-soft border border-success-line rounded-control">
                <span className="flex-shrink-0 w-6 h-6 bg-success-solid text-on-primary rounded-full flex items-center justify-center text-body-sm font-semibold">
                  3
                </span>
                <div className="flex-1 space-y-2">
                  <p className="text-body-sm font-medium text-ink">
                    Subir documento firmado
                  </p>
                  {/* El control muestra el nombre y el peso del archivo elegido,
                      así que ya no hace falta la línea de confirmación aparte. */}
                  <FileInput
                    accept=".pdf,.jpg,.jpeg,.png"
                    archivo={archivosSeleccionados[doc.id] ?? null}
                    onArchivo={(f) => handleFileChange(doc.id, f)}
                    disabled={subiendo[doc.id]}
                    compacto
                    label="Elegí el documento firmado o arrastralo acá"
                    ayuda="PDF, JPG o PNG · hasta 10 MB"
                  />
                  <Button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleSubirFirmado(doc)
                    }}
                    disabled={subiendo[doc.id] || !archivosSeleccionados[doc.id]}
                    className="gap-2 bg-success-solid hover:bg-success-solid disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="bg-surface-2 border-2 border-line rounded-control p-6 text-center">
            <CheckCircle className="h-12 w-12 text-ink-3 mx-auto mb-3" />
            <p className="text-body-sm font-medium text-ink-2">
              No hay documentos pendientes para firmar
            </p>
            <p className="text-label text-ink-2 mt-1">
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
            <div className="border-t border-info-line pt-4">
              <h3 className="text-body-sm font-semibold text-info mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning" />
                Documentos en Validación
              </h3>
              {documentosEnValidacion.map((doc) => {
                const documentoFirmado = tieneFirmadoPendiente(doc)
                const estaRechazado = documentoFirmado?.estado === 'RECHAZADO'

                return (
                  <div
                    key={doc.id}
                    className={`p-4 border-2 rounded-control ${
                      estaRechazado
                        ? 'bg-primary-soft border-primary-line'
                        : 'bg-warning-soft border-warning-line'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Clock className={`h-6 w-6 flex-shrink-0 mt-0.5 ${
                        estaRechazado ? 'text-primary' : 'text-warning'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-semibold ${
                            estaRechazado ? 'text-primary' : 'text-warning'
                          }`}>
                            {doc.nombre}
                          </h4>
                          <span className={`px-2 py-0.5 text-label font-medium rounded-full ${
                            estaRechazado
                              ? 'bg-primary text-on-primary'
                              : 'bg-warning-solid text-on-primary'
                          }`}>
                            {estaRechazado ? 'Rechazado' : 'Esperando Validación'}
                          </span>
                        </div>
                        {documentoFirmado && (
                          <>
                            <p className={`text-label mb-1 ${
                              estaRechazado ? 'text-primary' : 'text-warning'
                            }`}>
                              {estaRechazado ? (
                                <>Documento rechazado. Por favor, revisa los comentarios y sube una nueva versión.</>
                              ) : (
                                <>Subido el {new Date(documentoFirmado.createdAt).toLocaleDateString('es-AR')}. Esperando validación por Quiero Mi SAS.</>
                              )}
                            </p>
                            {estaRechazado && documentoFirmado.observaciones && (
                              <div className="mt-2 p-2 bg-primary-soft border border-primary-line rounded text-label text-primary">
                                <strong>Comentarios:</strong> {documentoFirmado.observaciones}
                              </div>
                            )}
                            {estaRechazado && (
                              <div className="mt-3 space-y-2">
                                <FileInput
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  archivo={archivosSeleccionados[doc.id] ?? null}
                                  onArchivo={(f) => handleFileChange(doc.id, f)}
                                  disabled={subiendo[doc.id]}
                                  compacto
                                  label="Subir la versión corregida"
                                  ayuda="PDF, JPG o PNG · hasta 10 MB"
                                />
                                <Button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleSubirFirmado(doc)
                                  }}
                                  disabled={subiendo[doc.id] || !archivosSeleccionados[doc.id]}
                                  className="gap-2 bg-primary hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
                          <p className="text-body-sm text-ink-2 mt-2">
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
            <div className="border-t border-info-line pt-4">
              <h3 className="text-body-sm font-semibold text-info mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
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
                    className="p-4 bg-success-soft border-2 border-success-line rounded-control"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-success flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-success">
                            {doc.nombre}
                          </h4>
                          <span className="px-2 py-0.5 text-label font-medium bg-success-solid text-on-primary rounded-full">
                            Aprobado
                          </span>
                        </div>
                        {documentoFirmado && (
                          <p className="text-label text-success mb-1">
                            Firmado y aprobado el {new Date(documentoFirmado.fechaAprobacion || documentoFirmado.createdAt).toLocaleDateString('es-AR')}
                          </p>
                        )}
                        {doc.descripcion && (
                          <p className="text-body-sm text-ink-2 mt-2">
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
          <div className="bg-warning-soft border-2 border-warning-line rounded-control p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-body-sm font-medium text-warning mb-1">
                  Importante
                </p>
                <p className="text-body-sm text-warning">
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

