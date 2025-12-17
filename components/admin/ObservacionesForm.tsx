'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { MessageSquare, Send } from 'lucide-react'

interface ObservacionesFormProps {
  tramiteId: string
  userId: string
}

export default function ObservacionesForm({ tramiteId, userId }: ObservacionesFormProps) {
  const router = useRouter()
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)

  const handleEnviar = async () => {
    if (!mensaje.trim()) {
      toast.error('Escribe un mensaje')
      return
    }

    setEnviando(true)

    try {
      const response = await fetch(`/api/admin/tramites/${tramiteId}/observacion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje })
      })

      if (response.ok) {
        toast.success('Observación enviada al cliente')
        setMensaje('')
        router.refresh()
      } else {
        toast.error('Error al enviar observación')
      }
    } catch (error) {
      toast.error('Error al enviar observación')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <MessageSquare className="h-5 w-5" />
          Enviar Observación al Cliente
        </CardTitle>
        <CardDescription>
          El cliente recibirá una notificación con tu mensaje
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            rows={4}
            placeholder="Ej: Hola, necesitamos que subas el comprobante de domicilio actualizado..."
            disabled={enviando}
          />
        </div>
        <Button
          onClick={handleEnviar}
          disabled={enviando || !mensaje.trim()}
          className="gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Send className="h-4 w-4" />
          {enviando ? 'Enviando...' : 'Enviar Observación'}
        </Button>
      </CardContent>
    </Card>
  )
}

