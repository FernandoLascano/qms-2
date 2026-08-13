'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Send } from 'lucide-react'

export default function SolicitarCBUButton({ tramiteId }: { tramiteId: string }) {
  const [enviando, setEnviando] = useState(false)

  const solicitar = async () => {
    setEnviando(true)
    try {
      const res = await fetch(`/api/admin/tramites/${tramiteId}/observacion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensaje:
            'Para continuar con tu trámite necesitamos que nos informes los CBU donde se reintegrará el depósito en garantía del 25% del capital una vez inscripta la Sociedad. El CBU principal debe ser del Administrador Titular. Podés cargarlos desde tu panel.'
        })
      })
      if (res.ok) {
        toast.success('Le solicitamos los CBU al cliente')
      } else {
        toast.error('No se pudo enviar la solicitud')
      }
    } catch {
      toast.error('No se pudo enviar la solicitud')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Button variant="outline" onClick={solicitar} disabled={enviando} className="gap-2">
      <Send className="h-4 w-4" />
      {enviando ? 'Enviando...' : 'Solicitar CBUs al cliente'}
    </Button>
  )
}
