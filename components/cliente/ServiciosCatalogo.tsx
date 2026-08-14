'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { MessageCircle, Check } from 'lucide-react'

const WHATSAPP = '5493512136212'

const SERVICIOS = [
  { nombre: 'Reformas de Estatuto', icono: '📝', desc: 'Modificá el objeto, la denominación u otras cláusulas del estatuto.' },
  { nombre: 'Confección de Actas', icono: '📄', desc: 'Actas de asamblea, de directorio y demás documentación societaria.' },
  { nombre: 'Designación o Renuncia de Autoridades', icono: '👤', desc: 'Cambios en administradores o representantes de la sociedad.' },
  { nombre: 'Aumentos de Capital', icono: '💹', desc: 'Formalizá el aumento del capital social de tu empresa.' },
  { nombre: 'Cambio de Sede Social', icono: '📍', desc: 'Actualizá el domicilio legal de la sociedad.' },
  { nombre: 'Asesoría Contable', icono: '📊', desc: 'Estados contables, impuestos y acompañamiento contable.' },
  { nombre: 'Domicilio Legal en Córdoba', icono: '🏢', desc: 'Usá una sede en Córdoba para tu sociedad (servicio anual de QMS).' },
  { nombre: 'Registro de Marca', icono: '®️', desc: 'Protegé el nombre y la identidad de tu empresa.' }
]

export default function ServiciosCatalogo() {
  const [enviando, setEnviando] = useState<string | null>(null)
  const [consultados, setConsultados] = useState<Record<string, boolean>>({})

  const consultar = async (servicio: string) => {
    setEnviando(servicio)
    try {
      const res = await fetch('/api/servicios/consultar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servicio })
      })
      if (res.ok) {
        toast.success('¡Listo! Un asesor de QMS se va a contactar con vos.')
        setConsultados((prev) => ({ ...prev, [servicio]: true }))
      } else {
        toast.error('No se pudo registrar la consulta. Probá de nuevo.')
      }
    } catch {
      toast.error('No se pudo registrar la consulta. Probá de nuevo.')
    } finally {
      setEnviando(null)
    }
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {SERVICIOS.map((s) => {
        const yaConsultado = consultados[s.nombre]
        return (
          <Card key={s.nombre} className="flex flex-col">
            <CardContent className="flex flex-col gap-3 p-card h-full">
              <div className="text-display">{s.icono}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-ink">{s.nombre}</h3>
                <p className="text-body-sm text-ink-2 mt-1">{s.desc}</p>
              </div>
              {yaConsultado ? (
                <div className="flex items-center gap-2 text-body-sm font-medium text-success">
                  <Check className="h-4 w-4" /> Consulta enviada
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => consultar(s.nombre)}
                    disabled={enviando === s.nombre}
                    className="w-full bg-primary hover:bg-primary-hover"
                  >
                    {enviando === s.nombre ? 'Enviando...' : 'Me interesa'}
                  </Button>
                  <a
                    href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hola! Quiero consultar por el servicio: ${s.nombre}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1 text-body-sm font-medium text-success hover:text-success"
                  >
                    <MessageCircle className="h-4 w-4" /> Consultar por WhatsApp
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
