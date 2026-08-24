'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  BadgeCheck,
  BookOpen,
  Building2,
  Calculator,
  Check,
  FileCheck,
  Landmark,
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

/**
 * Los servicios llegan desde la base (tabla ServicioCatalogo) y no de un
 * arreglo en el código: así los precios se editan desde el panel sin tocar
 * este archivo. El icono viaja como nombre y se resuelve acá.
 */
export interface ServicioCard {
  id: string
  slug: string
  nombre: string
  descripcion: string
  icono: string
  modalidad: 'UNICO' | 'MENSUAL' | 'ANUAL' | 'SIN_COSTO' | 'A_CONSULTAR'
  precioDesde: number | null
  precioTexto: string | null
}

const ICONOS: Record<string, LucideIcon> = {
  BadgeCheck, Building2, Calculator, FileSignature, FileText, FileCheck,
  Landmark, LineChart, MapPin, TrendingUp, UserCog, BookOpen,
}

/** Lo que se le muestra al cliente. Sin precio cargado: "Consultar". */
function precioVisible(s: ServicioCard) {
  if (s.modalidad === 'SIN_COSTO') return 'Sin cargo'
  if (s.precioDesde == null) return 'Consultar'
  const monto = `$${s.precioDesde.toLocaleString('es-AR')}`
  const periodo = s.modalidad === 'MENSUAL' ? ' por mes' : s.modalidad === 'ANUAL' ? ' por año' : ''
  return `Desde ${monto}${periodo}${s.precioTexto ? ` ${s.precioTexto}` : ''}`
}

export default function ServiciosCatalogo({ servicios }: { servicios: ServicioCard[] }) {
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
      {servicios.map((s) => {
        const yaConsultado = consultados[s.nombre]
        const Icono = ICONOS[s.icono] ?? FileText

        return (
          <Card key={s.id} className="flex flex-col">
            <CardBody className="flex h-full flex-col gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-control bg-surface-3 text-ink-2"
                aria-hidden
              >
                <Icono className="h-4.5 w-4.5" />
              </span>

              <div className="flex-1">
                <h3 className="text-heading text-ink text-balance">{s.nombre}</h3>
                <p className="mt-1 text-body-sm text-ink-2 text-pretty">{s.descripcion}</p>
                <p className="mt-2 text-body-sm font-semibold text-ink">{precioVisible(s)}</p>
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
