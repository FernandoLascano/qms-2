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
    <Card className="border-info-line bg-info-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-info">
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
            className="flex w-full rounded-control border border-line-strong bg-surface px-3 py-2 text-body-sm text-ink focus:outline-none focus:ring-2 focus:ring-info-solid"
            rows={4}
            placeholder="Ej: Hola, necesitamos que subas el comprobante de domicilio actualizado..."
            disabled={enviando}
          />
        </div>
        <Button
          onClick={handleEnviar}
          disabled={enviando || !mensaje.trim()}
          className="gap-2 bg-info-solid hover:bg-info-solid"
        >
          <Send className="h-4 w-4" />
          {enviando ? 'Enviando...' : 'Enviar Observación'}
        </Button>
      </CardContent>
    </Card>
  )
}

