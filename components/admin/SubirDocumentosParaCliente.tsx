'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Upload, FileText, Send } from 'lucide-react'

interface SubirDocumentosParaClienteProps {
  tramiteId: string
  userId: string
}

export default function SubirDocumentosParaCliente({ tramiteId, userId }: SubirDocumentosParaClienteProps) {
  const router = useRouter()
  const [subiendo, setSubiendo] = useState(false)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [nombreDocumento, setNombreDocumento] = useState('')
  const [descripcion, setDescripcion] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setArchivo(file)
      
      // Sugerir nombre basado en el archivo
      if (!nombreDocumento) {
        const nombreSugerido = file.name.replace(/\.[^/.]+$/, '')
        setNombreDocumento(nombreSugerido)
      }
    }
  }

  const handleSubir = async () => {
    if (!archivo) {
      toast.error('Selecciona un archivo')
      return
    }

    if (!nombreDocumento.trim()) {
      toast.error('Ingresa un nombre para el documento')
      return
    }

    setSubiendo(true)

    try {
      const formData = new FormData()
      formData.append('file', archivo)
      formData.append('tramiteId', tramiteId)
      formData.append('userId', userId)
      formData.append('nombre', nombreDocumento)
      formData.append('descripcion', descripcion)
      formData.append('tipo', 'DOCUMENTO_PARA_FIRMAR') // Tipo especial para documentos que el cliente debe firmar

      const response = await fetch('/api/admin/documentos/subir-para-cliente', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        toast.success('Documento enviado al cliente')
        setArchivo(null)
        setNombreDocumento('')
        setDescripcion('')
        // Reset file input
        const fileInput = document.getElementById('documentoParaFirmar') as HTMLInputElement
        if (fileInput) fileInput.value = ''
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al subir documento')
      }
    } catch (error) {
      toast.error('Error al subir documento')
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
          Sube documentos que el cliente debe firmar y devolver
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="documentoParaFirmar">Seleccionar Archivo *</Label>
          <Input
            id="documentoParaFirmar"
            type="file"
            onChange={handleFileChange}
            disabled={subiendo}
            accept=".pdf,.doc,.docx"
            className="cursor-pointer"
          />
          <p className="text-xs text-gray-500 mt-1">
            Formatos aceptados: PDF, DOC, DOCX
          </p>
        </div>

        {archivo && (
          <>
            <div>
              <Label htmlFor="nombreDoc">Nombre del Documento *</Label>
              <Input
                id="nombreDoc"
                value={nombreDocumento}
                onChange={(e) => setNombreDocumento(e.target.value)}
                placeholder="Ej: Estatuto Social para Firma"
                disabled={subiendo}
              />
            </div>

            <div>
              <Label htmlFor="descripcionDoc">Descripción / Instrucciones</Label>
              <textarea
                id="descripcionDoc"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej: Por favor firma en todas las páginas marcadas con una X y devuelve escaneado"
                disabled={subiendo}
                className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[80px]"
              />
            </div>

            <Button
              onClick={handleSubir}
              disabled={subiendo || !nombreDocumento.trim()}
              className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
            >
              <Send className="h-4 w-4" />
              {subiendo ? 'Enviando...' : 'Enviar al Cliente'}
            </Button>
          </>
        )}

        {!archivo && (
          <div className="bg-white border border-purple-200 rounded-lg p-6 text-center">
            <Upload className="h-12 w-12 text-purple-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600">
              Selecciona un archivo para empezar
            </p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-900">
            💡 <strong>Tip:</strong> El cliente recibirá una notificación y verá este documento 
            en su panel. Podrá descargarlo, firmarlo y subirlo de vuelta.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

