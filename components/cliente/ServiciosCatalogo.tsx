'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  BadgeCheck,
  Building2,
  Check,
  FileSignature,
  FileText,
  LineChart,
  MapPin,
  MessageCircle,
  TrendingUp,
  UserCog,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const WHATSAPP = '5493512136212'

const SERVICIOS: { nombre: string; icono: LucideIcon; desc: string }[] = [
  {
    nombre: 'Reformas de estatuto',
    icono: FileSignature,
    desc: 'Modificá el objeto, la denominación u otras cláusulas del estatuto.',
  },
  {
    nombre: 'Confección de actas',
    icono: FileText,
    desc: 'Actas de asamblea, de directorio y demás documentación societaria.',
  },
  {
    nombre: 'Designación o renuncia de autoridades',
    icono: UserCog,
    desc: 'Cambios en administradores o representantes de la sociedad.',
  },
  {
    nombre: 'Aumentos de capital',
    icono: TrendingUp,
    desc: 'Formalizá el aumento del capital social de tu empresa.',
  },
  {
    nombre: 'Cambio de sede social',
    icono: MapPin,
    desc: 'Actualizá el domicilio legal de la sociedad.',
  },
  {
    nombre: 'Asesoría contable',
    icono: LineChart,
    desc: 'Estados contables, impuestos y acompañamiento contable.',
  },
  {
    nombre: 'Domicilio legal en Córdoba',
    icono: Building2,
    desc: 'Usá una sede en Córdoba para tu sociedad (servicio anual de QMS).',
  },
  {
    nombre: 'Registro de marca',
    icono: BadgeCheck,
    desc: 'Protegé el nombre y la identidad de tu empresa.',
  },
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
        body: JSON.stringify({ servicio }),
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
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {SERVICIOS.map((s) => {
        const yaConsultado = consultados[s.nombre]
        const Icono = s.icono

        return (
          <Card key={s.nombre} className="flex flex-col">
            <CardBody className="flex h-full flex-col gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-control bg-surface-3 text-ink-2"
                aria-hidden
              >
                <Icono className="h-4.5 w-4.5" />
              </span>

              <div className="flex-1">
                <h3 className="text-heading text-ink text-balance">{s.nombre}</h3>
                <p className="mt-1 text-body-sm text-ink-2 text-pretty">{s.desc}</p>
              </div>

              {yaConsultado ? (
                <p className="flex items-center gap-2 text-body-sm font-medium text-success">
                  <Check className="h-4 w-4" aria-hidden />
                  Consulta enviada
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => consultar(s.nombre)}
                    loading={enviando === s.nombre}
                    className="w-full"
                  >
                    Me interesa
                  </Button>
                  <a
                    href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
                      `Hola! Quiero consultar por el servicio: ${s.nombre}`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-chip text-body-sm font-medium text-ink-2 hover:text-ink"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden />
                    Consultar por WhatsApp
                  </a>
                </div>
              )}
            </CardBody>
          </Card>
        )
      })}
    </div>
  )
}
