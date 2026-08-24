'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileInput } from '@/components/ui/file-input'
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
}

// Los 3 documentos que se envían a firmar, con nombre, tipo e instrucciones predefinidas.
const SLOTS = [
  {
    key: 'actaEstatuto',
    tipo: 'ESTATUTO_PARA_FIRMAR',
    label: 'Acta Constitutiva y Estatuto',
    instruccion:
      'Este documento se firma DIGITALMENTE con Ciudadano Digital (CiDi). Seguí el paso a paso del instructivo que te dejamos en tu panel.'
  },
  {
    key: 'arca',
    tipo: 'DOCUMENTO_PARA_FIRMAR',
    label: 'Declaración Jurada ARCA',
    instruccion:
      'Debe firmarla la persona designada como Administrador Titular. Imprimí el documento, firmalo y escanealo correctamente (en PDF, no fotos).'
  },
  {
    key: 'pep',
    tipo: 'DOCUMENTO_PARA_FIRMAR',
    label: 'Declaraciones Juradas PEP',
    instruccion:
      'Imprimí las declaraciones. Cada persona designada como Administrador firma la que le corresponde. Completá SOLO los campos "Lugar y Fecha", "Firma" y "Aclaración". No completes ningún otro campo.'
  }
] as const

export default function SubirDocumentosParaCliente({
  tramiteId,
  userId,
  documentosEnviados = []
}: SubirDocumentosParaClienteProps) {
  const router = useRouter()
  const [subiendo, setSubiendo] = useState(false)
  const [archivos, setArchivos] = useState<Record<string, File | null>>({})
  const [instrucciones, setInstrucciones] = useState<Record<string, string>>(
    Object.fromEntries(SLOTS.map(s => [s.key, s.instruccion]))
  )

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
      for (const slot of seleccionados) {
        formData.append('files', archivos[slot.key] as File)
        formData.append('tipos', slot.tipo)
        formData.append('nombres', slot.label)
        formData.append('descripciones', instrucciones[slot.key] || slot.instruccion)
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
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
            <div key={slot.key} className="space-y-2 border-t border-line pt-4 first:border-0 first:pt-0">
              <Label htmlFor={`doc-${slot.key}`} className="text-body-sm font-semibold text-ink">
                {slot.label}
              </Label>
              <FileInput
                id={`doc-${slot.key}`}
                accept=".pdf,.doc,.docx"
                disabled={subiendo}
                compacto
                archivo={archivos[slot.key] ?? null}
                onArchivo={(f) => setArchivo(slot.key, f)}
              />
              <div>
                <Label htmlFor={`instr-${slot.key}`} className="text-label text-ink-2">Instrucciones para el cliente (editable)</Label>
                <Textarea
                  id={`instr-${slot.key}`}
                  value={instrucciones[slot.key]}
                  onChange={(e) => setInstrucciones(prev => ({ ...prev, [slot.key]: e.target.value }))}
                  disabled={subiendo}
                  rows={2}
                  className="mt-1 text-body-sm"
                />
              </div>
            </div>
          ))}
        </div>

        <p className="text-label text-ink-2">
          Cada documento se envía con sus instrucciones. El Acta y Estatuto además muestra el instructivo de firma digital (imágenes) en el panel del cliente.
        </p>

        <Button
          onClick={handleEnviar}
          disabled={subiendo}
          className="w-full"
        >
          <Send className="h-4 w-4" />
          {subiendo ? 'Enviando...' : 'Enviar documentos al cliente'}
        </Button>

        {/* Historial de documentos enviados */}
        {documentosEnviados.length > 0 && (
          <div className="mt-6 pt-4 border-t border-line">
            <div className="flex items-center gap-2 mb-3">
              <History className="h-4 w-4 text-ink-3" />
              <h4 className="text-body-sm font-semibold text-ink">Documentos enviados</h4>
            </div>
            <div className="space-y-2">
              {documentosEnviados.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-control border border-line bg-surface-2 p-3"
                >
                  <div className="flex items-center gap-3">
                    {doc.estado === 'APROBADO' ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : (
                      <Clock className="h-4 w-4 text-warning" />
                    )}
                    <div>
                      <p className="text-body-sm font-medium text-ink">{doc.nombre}</p>
                      <p className="text-label text-ink-2">
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
                    <span className={`text-label px-2 py-1 rounded-full ${
                      doc.estado === 'APROBADO'
                        ? 'bg-success-soft text-success'
                        : 'bg-warning-soft text-warning'
                    }`}>
                      {doc.estado === 'APROBADO' ? 'Firmado' : 'Pendiente'}
                    </span>
                    <a
                      href={`/api/documentos/${doc.id}/view`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-info hover:text-info"
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
