'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ArrowRight,
  Building2,
  CheckCircle,
  Clock,
  CreditCard,
  FileSignature,
  FileText,
  IdCard,
  Landmark,
  Search,
  User,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SectionHeader } from '@/components/ui/page-header'
import { cn } from '@/lib/utils'
import {
  calcularAcciones,
  type Accion,
  type ConfirmarAccion,
  type IconoAccion,
  type Responsable,
} from '@/lib/tramites/acciones'

const ICONOS: Record<IconoAccion, LucideIcon> = {
  pago: CreditCard,
  documento: FileText,
  firma: FileSignature,
  identidad: IdCard,
  espera: Clock,
  organismo: Landmark,
  revision: Search,
  completado: CheckCircle,
}

/** El acento sólo se enciende cuando la pelota está del lado del cliente. */
const ESTILO: Record<Responsable, { card: string; icono: string }> = {
  cliente: { card: 'border-warning-line bg-warning-soft', icono: 'bg-warning-solid/12 text-warning' },
  qms: { card: 'border-line bg-surface', icono: 'bg-surface-3 text-ink-2' },
  ninguno: { card: 'border-success-line bg-success-soft', icono: 'bg-success-solid/12 text-success' },
}

interface ProximosPasosProps {
  tramite: any
  pagos: any[]
  enlacesPago: any[]
  documentos?: any[]
  notificaciones?: any[]
}

export default function ProximosPasos({
  tramite,
  pagos,
  enlacesPago,
  documentos = [],
  notificaciones = [],
}: ProximosPasosProps) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState<ConfirmarAccion | null>(null)

  const acciones = calcularAcciones({ tramite, pagos, enlacesPago, documentos, notificaciones })
  const pendientesCliente = acciones.filter((a) => a.responsable === 'cliente')
  const completado = acciones.every((a) => a.responsable === 'ninguno')

  const confirmarPaso = async (accion: ConfirmarAccion) => {
    setConfirmando(accion)
    try {
      const res = await fetch(`/api/tramites/${tramite.id}/confirmar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion }),
      })
      if (res.ok) {
        toast.success('¡Listo! Registramos tu confirmación.')
        router.refresh()
      } else {
        toast.error('No se pudo registrar. Probá de nuevo.')
      }
    } catch {
      toast.error('No se pudo registrar. Probá de nuevo.')
    } finally {
      setConfirmando(null)
    }
  }

  const irAlAncla = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="space-y-4">
      <SectionHeader
        title={completado ? 'Trámite completado' : pendientesCliente.length > 0 ? 'Lo que necesitamos de vos' : 'Estamos trabajando'}
        description={
          completado
            ? 'Ya no tenés nada pendiente.'
            : pendientesCliente.length > 0
              ? `${pendientesCliente.length} ${pendientesCliente.length === 1 ? 'paso depende' : 'pasos dependen'} de vos para poder avanzar.`
              : 'Por ahora no tenés nada pendiente. Te avisamos apenas necesitemos algo de tu parte.'
        }
      />

      <div className="space-y-3">
        {acciones.map((accion, i) => (
          <TarjetaAccion
            key={`${accion.tipo}-${i}`}
            accion={accion}
            confirmando={confirmando === accion.confirmar}
            onConfirmar={confirmarPaso}
            onAncla={irAlAncla}
          />
        ))}
      </div>
    </section>
  )
}

function TarjetaAccion({
  accion,
  confirmando,
  onConfirmar,
  onAncla,
}: {
  accion: Accion
  confirmando: boolean
  onConfirmar: (a: ConfirmarAccion) => void
  onAncla: (href: string) => void
}) {
  const Icono = ICONOS[accion.icono]
  const estilo = ESTILO[accion.responsable]
  const esAncla = accion.link?.startsWith('#')

  return (
    <article className={cn('rounded-card border p-card-sm sm:p-card', estilo.card)}>
      <div className="flex gap-3">
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-control',
            estilo.icono,
          )}
          aria-hidden
        >
          <Icono className="h-4.5 w-4.5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-heading text-ink">{accion.titulo}</h3>
            {accion.responsable === 'cliente' ? (
              <Badge tone="warning" dot>
                <User className="h-3 w-3" aria-hidden />
                Te toca a vos
              </Badge>
            ) : accion.responsable === 'qms' ? (
              <Badge tone="neutral" dot>
                <Building2 className="h-3 w-3" aria-hidden />
                Lo hacemos nosotros
              </Badge>
            ) : null}
          </div>

          <p className="mt-1 text-body text-ink-2 text-pretty">{accion.descripcion}</p>

          {(accion.accion || accion.confirmar || accion.ayuda) && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {accion.confirmar && (
                <Button loading={confirmando} onClick={() => onConfirmar(accion.confirmar!)}>
                  <CheckCircle className="h-4 w-4" aria-hidden />
                  {accion.confirmar === 'ciudadano_digital'
                    ? 'Ya tengo Ciudadano Digital Nivel 2'
                    : 'Aprobar el borrador'}
                </Button>
              )}

              {accion.accion && accion.link && (
                esAncla ? (
                  <Button onClick={() => onAncla(accion.link!)}>
                    {accion.accion}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Button>
                ) : (
                  <Button asChild>
                    <Link href={accion.link}>
                      {accion.accion}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                )
              )}

              {accion.ayuda?.map((a) => (
                <a
                  key={a.href}
                  href={a.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-chip text-body-sm font-medium text-primary underline underline-offset-4 hover:text-primary-hover"
                >
                  {a.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
