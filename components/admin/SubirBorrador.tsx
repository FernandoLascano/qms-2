'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { FileText, CheckCircle } from 'lucide-react'

interface SubirBorradorProps {
  tramiteId: string
  borradorEnviado: boolean
  borradorAprobadoCliente: boolean
}

export default function SubirBorrador({ tramiteId, borradorEnviado, borradorAprobadoCliente }: SubirBorradorProps) {
  const router = useRouter()
  const [archivo, setArchivo] = useState<File | null>(null)
  const [subiendo, setSubiendo] = useState(false)

  const handleSubir = async () => {
    if (!archivo) {
      toast.error('Elegí un archivo primero')
      return
    }
    setSubiendo(true)
    try {
      const formData = new FormData()
      formData.append('file', archivo)
      const res = await fetch(`/api/admin/tramites/${tramiteId}/borrador`, {
        method: 'POST',
        body: formData
      })
      if (res.ok) {
        toast.success('Borrador enviado al cliente')
        setArchivo(null)
        router.refresh()
      } else {
        toast.error('No se pudo enviar el borrador')
      }
    } catch {
      toast.error('No se pudo enviar el borrador')
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
            <FileText className="h-4 w-4 text-purple-700" />
          </span>
          <span>Borrador para el Cliente</span>
        </CardTitle>
        <CardDescription>
          Subí el borrador de los documentos para que el cliente lo controle antes de la firma. Marca la etapa &quot;Borrador Enviado&quot; y le avisa al cliente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {borradorAprobadoCliente ? (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-900">
            <CheckCircle className="h-4 w-4 text-green-600" />
            El cliente ya aprobó el borrador.
          </div>
        ) : borradorEnviado ? (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-900">
            Borrador enviado. Esperando que el cliente lo apruebe. Podés subir uno nuevo si necesitás corregirlo.
          </div>
        ) : null}

        <Input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => setArchivo(e.target.files?.[0] || null)}
        />
        <Button onClick={handleSubir} disabled={subiendo || !archivo} className="gap-2">
          {subiendo ? 'Enviando...' : borradorEnviado ? 'Reenviar borrador' : 'Enviar borrador al cliente'}
        </Button>
      </CardContent>
    </Card>
  )
}
