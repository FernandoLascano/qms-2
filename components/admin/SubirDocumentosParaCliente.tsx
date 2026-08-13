'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { FileText, Send, History, ExternalLink, CheckCircle, Clock } from 'lucide-react'

interface DocumentoEnviado {
  id: string
  nombre: string
  descripcion: string | null
  url: string
  estado: string
  fechaSubida: Date
}

interface SubirDocumentosParaClienteProps {
  tramiteId: string
  userId: string
  documentosEnviados?: DocumentoEnviado[]
  instruccionesFirma?: string | null
}

// Los 3 documentos habituales, con nombre y tipo predefinidos.
const SLOTS = [
  { key: 'estatuto', tipo: 'ESTATUTO_PARA_FIRMAR', label: 'Estatuto Social' },
  { key: 'acta', tipo: 'ACTA_PARA_FIRMAR', label: 'Acta Constitutiva' },
  { key: 'otro', tipo: 'DOCUMENTO_PARA_FIRMAR', label: 'Documento adicional (opcional)' }
] as const

const INSTRUCCIONES_DEFAULT =
  'Descargá cada documento, firmalo en todas las hojas (certificá la firma ante escribano, banco o autoridad si corresponde), escanealo en PDF y subí las versiones firmadas desde tu panel.'

export default function SubirDocumentosParaCliente({
  tramiteId,
  userId,
  documentosEnviados = [],
  instruccionesFirma
}: SubirDocumentosParaClienteProps) {
  const router = useRouter()
  const [subiendo, setSubiendo] = useState(false)
  const [archivos, setArchivos] = useState<Record<string, File | null>>({})
  const [instrucciones, setInstrucciones] = useState(instruccionesFirma || INSTRUCCIONES_DEFAULT)

  const setArchivo = (key: string, file: File | null) => {
    setArchivos(prev => ({ ...prev, [key]: file }))
  }

  const handleEnviar = async () => {
    const seleccionados = SLOTS.filter(s => archivos[s.key])
    if (seleccionados.length === 0) {
      toast.error('Elegí al menos un documento')
      return
    }

    setSubiendo(true)
    try {
      const formData = new FormData()
      formData.append('tramiteId', tramiteId)
      formData.append('userId', userId)
      formData.append('instrucciones', instrucciones)
      for (const slot of seleccionados) {
        formData.append('files', archivos[slot.key] as File)
        formData.append('tipos', slot.tipo)
        formData.append('nombres', slot.label)
      }

      const response = await fetch('/api/admin/documentos/subir-para-cliente', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        toast.success('Documentos enviados al cliente (un solo aviso)')
        setArchivos({})
        SLOTS.forEach(s => {
          const el = document.getElementById(`doc-${s.key}`) as HTMLInputElement
          if (el) el.value = ''
        })
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al enviar los documentos')
      }
    } catch {
      toast.error('Error al enviar los documentos')
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <FileText className="h-5 w-5" />
          Enviar Documentos para Firmar
        </CardTitle>
        <CardDescription>
          Subí los documentos que el cliente debe firmar. Se envían todos juntos con un único aviso.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {SLOTS.map(slot => (
            <div key={slot.key} className="rounded-lg bg-white border border-purple-100 p-3">
              <Label htmlFor={`doc-${slot.key}`} className="text-sm font-medium text-gray-900">
                {slot.label}
              </Label>
              <Input
                id={`doc-${slot.key}`}
                type="file"
                accept=".pdf,.doc,.docx"
                disabled={subiendo}
                onChange={(e) => setArchivo(slot.key, e.target.files?.[0] || null)}
                className="cursor-pointer mt-1"
              />
            </div>
          ))}
        </div>

        <div>
          <Label htmlFor="instruccionesFirma">Instrucciones de firma (las ve el cliente)</Label>
          <Textarea
            id="instruccionesFirma"
            value={instrucciones}
            onChange={(e) => setInstrucciones(e.target.value)}
            disabled={subiendo}
            rows={4}
          />
          <p className="text-xs text-gray-500 mt-1">
            El cliente también verá el instructivo de firma con imágenes en su panel.
          </p>
        </div>

        <Button
          onClick={handleEnviar}
          disabled={subiendo}
          className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
        >
          <Send className="h-4 w-4" />
          {subiendo ? 'Enviando...' : 'Enviar documentos al cliente'}
        </Button>

        {/* Historial de documentos enviados */}
        {documentosEnviados.length > 0 && (
          <div className="mt-6 pt-4 border-t border-purple-200">
            <div className="flex items-center gap-2 mb-3">
              <History className="h-4 w-4 text-purple-600" />
              <h4 className="text-sm font-medium text-purple-900">Documentos Enviados</h4>
            </div>
            <div className="space-y-2">
              {documentosEnviados.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-white border border-purple-100 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {doc.estado === 'APROBADO' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-orange-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.nombre}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(doc.fechaSubida).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      doc.estado === 'APROBADO'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {doc.estado === 'APROBADO' ? 'Firmado' : 'Pendiente'}
                    </span>
                    <a
                      href={`/api/documentos/${doc.id}/view`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
