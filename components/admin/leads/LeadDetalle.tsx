'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  CalendarClock, Check, Circle, Copy, ExternalLink, Flame, Mail, MessageCircle,
  Pencil, Phone, PhoneCall, StickyNote, Trophy, X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { diaDe, diaParaGuardar, hoyClave, situacionDe } from '@/lib/leads/agenda'
import { Contactar } from './Contactar'
import { SelectorProximo } from './SelectorProximo'
import {
  ESTADOS, MOTIVOS_PERDIDA, canalTexto, copiar, estadoTexto, pedir, rutaLead, type LeadCRM,
} from './tipos'
import { PlanBadge } from '@/components/ui/plan-badge'

const ABIERTOS = ESTADOS.filter((e) => !['CONVERTIDO', 'DESCARTADO'].includes(e.valor))

export const fmtDia = (iso: string) =>
  new Date(`${diaDe(iso)}T12:00:00Z`).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })

const hace = (iso: string) => formatDistanceToNow(new Date(iso), { locale: es, addSuffix: true })

const ICONO_CANAL: Record<string, typeof Mail> = {
  WHATSAPP: MessageCircle,
  EMAIL: Mail,
  LLAMADA: PhoneCall,
  OTRO: StickyNote,
}

export function LeadDetalle({
  lead,
  firma,
  onCambio,
  onPerder,
  onEditar,
}: {
  lead: LeadCRM
  firma: string | null
  /** Después de registrar un contacto: la lista decide si pasa al siguiente. */
  onCambio: (tras: 'contacto' | 'otro') => void
  onPerder: () => void
  onEditar: () => void
}) {
  const [moviendo, setMoviendo] = useState(false)
  const [reagendando, setReagendando] = useState(false)
  const situacion = situacionDe(lead)
  const cerrado = lead.estado === 'CONVERTIDO' || lead.estado === 'DESCARTADO'

  async function patch(datos: Record<string, unknown>, ok: string) {
    setMoviendo(true)
    try {
      await pedir(rutaLead(lead), 'PATCH', datos)
      toast.success(ok)
      onCambio('otro')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo guardar')
    } finally {
      setMoviendo(false)
    }
  }

  const reagendar = (dia: string | null) => {
    setReagendando(false)
    patch({ leadProximoContacto: dia ? diaParaGuardar(dia) : null }, dia ? 'Seguimiento agendado' : 'Fecha quitada')
  }

  const franja = { ALTA: 'primary', MEDIA: 'warning', BAJA: 'neutral' } as const

  return (
    <div className="divide-y divide-line">
      {/* ── Encabezado ── */}
      <header className="space-y-3 p-card-sm sm:p-card">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-title text-ink">{lead.nombre}</h2>
            <p className="mt-0.5 text-body-sm text-ink-2">
              {lead.origenTexto} · entró {hace(lead.creado)}
            </p>
          </div>
          <Badge
            tone={franja[lead.franja]}
            size="sm"
            title={lead.senales.map((s) => `${s.puntos > 0 ? '+' : ''}${s.puntos} ${s.texto}`).join('\n') || 'Sin señales'}
          >
            {lead.franja === 'ALTA' && <Flame className="h-3 w-3" aria-hidden />}
            Prioridad {lead.franja.toLowerCase()}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <DatoContacto icono={Phone} valor={lead.telefono} vacio="Sin teléfono" etiqueta="Teléfono copiado"
            extra={lead.telefono ? (
              <a href={`https://wa.me/${lead.telefono.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                className="rounded-chip p-1 text-ink-3 hover:bg-surface-3 hover:text-success" title="Abrir chat de WhatsApp"
                aria-label="Abrir chat de WhatsApp">
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            ) : null} />
          <DatoContacto icono={Mail} valor={lead.email} vacio="Sin email" etiqueta="Email copiado" />
          {lead.tipo === 'CONSULTA' && (
            <Button variant="ghost" size="sm" onClick={onEditar}>
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              Editar
            </Button>
          )}
        </div>
      </header>

      {/* ── Etapa y próximo paso ── */}
      <div className="space-y-4 p-card-sm sm:p-card">
        {lead.estado === 'CONVERTIDO' ? (
          <p className="flex items-center gap-2 rounded-control border border-success-line bg-success-soft px-3 py-2.5 text-body-sm text-ink">
            <Trophy className="h-4 w-4 text-success" aria-hidden />
            Ganado{lead.tipo === 'BORRADOR' ? ': envió el formulario.' : '.'}
            <button className="ml-auto text-primary hover:underline" onClick={() => patch({ leadEstado: 'EN_CONVERSACION' }, 'Lead reabierto')}>
              Reabrir
            </button>
          </p>
        ) : lead.estado === 'DESCARTADO' ? (
          <div className="flex items-start gap-2 rounded-control border border-line bg-surface-2 px-3 py-2.5 text-body-sm text-ink">
            <X className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" aria-hidden />
            <div className="min-w-0 flex-1">
              <p>Perdido · {MOTIVOS_PERDIDA.find((m) => m.valor === lead.motivoPerdida)?.texto ?? 'sin motivo'}</p>
              {lead.motivoNota && <p className="mt-0.5 text-ink-2">«{lead.motivoNota}»</p>}
            </div>
            <button className="text-primary hover:underline" onClick={() => patch({ leadEstado: 'CONTACTADO' }, 'Lead reabierto')}>
              Reabrir
            </button>
          </div>
        ) : (
          <>
            <div>
              <p className="mb-1.5 text-label text-ink-2">Etapa</p>
              <div className="flex flex-wrap items-center gap-1.5">
                <ol className="flex flex-wrap gap-1">
                  {ABIERTOS.map((e, i) => {
                    const idx = ABIERTOS.findIndex((x) => x.valor === lead.estado)
                    return (
                      <li key={e.valor}>
                        <button
                          type="button"
                          disabled={moviendo}
                          onClick={() => e.valor !== lead.estado && patch({ leadEstado: e.valor }, `Pasó a «${e.texto}»`)}
                          aria-current={e.valor === lead.estado ? 'step' : undefined}
                          className={cn(
                            'flex h-8 items-center gap-1.5 rounded-control border px-2.5 text-body-sm transition-colors',
                            e.valor === lead.estado
                              ? 'border-primary bg-primary text-on-primary'
                              : i < idx
                                ? 'border-primary-line bg-primary-soft text-primary'
                                : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink',
                          )}
                        >
                          {i < idx && <Check className="h-3.5 w-3.5" aria-hidden />}
                          {e.texto}
                        </button>
                      </li>
                    )
                  })}
                </ol>
                <span className="mx-1 h-5 w-px bg-line" aria-hidden />
                <Button variant="ghost" size="sm" disabled={moviendo} onClick={() => patch({ leadEstado: 'CONVERTIDO', leadProximoContacto: null }, '¡Ganado!')}>
                  <Trophy className="h-3.5 w-3.5" aria-hidden />
                  Ganado
                </Button>
                <Button variant="ghost" size="sm" disabled={moviendo} onClick={onPerder}>
                  <X className="h-3.5 w-3.5" aria-hidden />
                  Perdido
                </Button>
              </div>
            </div>

            <div
              className={cn(
                'rounded-control border px-3 py-2.5',
                situacion === 'VENCIDO' ? 'border-danger-line bg-danger-soft'
                  : situacion === 'HOY' || situacion === 'SIN_PASO' || situacion === 'NUEVO' ? 'border-warning-line bg-warning-soft'
                    : 'border-line bg-surface-2',
              )}
            >
              <div className="flex flex-wrap items-center gap-2 text-body-sm">
                <CalendarClock className={cn('h-4 w-4', situacion === 'VENCIDO' ? 'text-danger' : 'text-ink-2')} aria-hidden />
                <span className="min-w-0 flex-1 text-ink">
                  {lead.proximoContacto ? (
                    <>
                      {situacion === 'VENCIDO' ? 'Seguimiento vencido: era el ' : 'Próximo contacto: '}
                      <strong className="font-semibold">{diaDe(lead.proximoContacto) === hoyClave() ? 'hoy' : fmtDia(lead.proximoContacto)}</strong>
                    </>
                  ) : situacion === 'NUEVO' ? (
                    'Nunca se lo contactó.'
                  ) : (
                    'Sin próximo paso: agendá cuándo volver a escribirle.'
                  )}
                </span>
                <button className="text-body-sm text-primary hover:underline" onClick={() => setReagendando((v) => !v)}>
                  {reagendando ? 'Cancelar' : lead.proximoContacto ? 'Cambiar' : 'Agendar'}
                </button>
              </div>
              {reagendando && (
                <div className="mt-3">
                  <SelectorProximo valor={lead.proximoContacto ? diaDe(lead.proximoContacto) : null} onChange={reagendar} etiqueta="Volver a contactar" />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Contactar ── */}
      {!cerrado && (
        <div className="p-card-sm sm:p-card">
          <h3 className="mb-3 text-heading text-ink">Contactar</h3>
          <Contactar lead={lead} firma={firma} onHecho={() => onCambio('contacto')} />
        </div>
      )}

      {/* ── Contexto ── */}
      <div className="space-y-4 p-card-sm sm:p-card">
        <h3 className="text-heading text-ink">{lead.tipo === 'BORRADOR' ? 'Su formulario' : 'Su consulta'}</h3>

        {lead.tipo === 'BORRADOR' ? (
          <>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-body-sm">
              <Dato label="Denominación" valor={lead.denominacion ?? 'Sin elegir'} />
              <Dato label="Jurisdicción" valor={lead.jurisdiccion ?? '—'} />
              <Dato label="Plan" valor={lead.plan ? <PlanBadge plan={lead.plan} /> : '—'} />
              <Dato label="Última actividad" valor={hace(lead.ultimaActividad)} />
            </dl>
            {lead.hitos && (
              <div>
                <div className="mb-2 flex items-baseline justify-between text-body-sm">
                  <span className="text-ink-2">{lead.segmentoTexto}</span>
                  <span className="font-semibold text-ink tnum">{lead.avance}%</span>
                </div>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
                  {lead.hitos.map((h) => (
                    <li key={h.texto} className={cn('flex items-center gap-1.5 text-body-sm', h.ok ? 'text-ink' : 'text-ink-3')}>
                      {h.ok ? <Check className="h-3.5 w-3.5 text-success" aria-hidden /> : <Circle className="h-3.5 w-3.5" aria-hidden />}
                      {h.texto}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {lead.toques && (
              <p className="text-body-sm text-ink-2">
                Emails automáticos: <span className="font-medium text-ink">{lead.toques.enviados} de {lead.toques.total}</span>
                {lead.toques.ultimo && ` · último ${hace(lead.toques.ultimo)}`}
                {lead.toques.enviados >= lead.toques.total && ' · la secuencia terminó, sigue a mano'}
              </p>
            )}
            <Button variant="secondary" size="sm" asChild>
              <Link href={`/dashboard/admin/tramites/${lead.id}`}>
                Ver su formulario
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </Button>
          </>
        ) : (
          <>
            {lead.mensaje ? (
              <blockquote className="whitespace-pre-wrap border-l-2 border-line-strong pl-3 text-body-sm text-ink">{lead.mensaje}</blockquote>
            ) : (
              <p className="text-body-sm text-ink-3">No dejó mensaje.</p>
            )}
            {lead.partner && <p className="text-body-sm text-ink-2">Viene por el partner <strong className="text-ink">{lead.partner}</strong>.</p>}
          </>
        )}
      </div>

      {/* ── Historial ── */}
      <div className="p-card-sm sm:p-card">
        <h3 className="mb-3 text-heading text-ink">
          Historial <span className="text-ink-2 tnum">({lead.actividad.length})</span>
        </h3>
        {lead.actividad.length === 0 ? (
          <p className="text-body-sm text-ink-3">Todavía no hay contactos registrados.</p>
        ) : (
          <ol className="relative space-y-4 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-px before:bg-line">
            {lead.actividad.map((a) => {
              const Icono = ICONO_CANAL[a.canal] ?? StickyNote
              return (
                <li key={a.id} className="relative flex gap-3">
                  <span className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink-2">
                    <Icono className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-label text-ink-2">
                      <span className="font-semibold text-ink">{canalTexto(a.canal)}</span> · {hace(a.fecha)} · {a.admin}
                    </p>
                    <p className="mt-0.5 line-clamp-6 whitespace-pre-wrap text-body-sm text-ink">{a.nota}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
        <p className="mt-4 text-label text-ink-3">Estado actual: {estadoTexto(lead.estado)}</p>
      </div>
    </div>
  )
}

function DatoContacto({
  icono: Icono, valor, vacio, etiqueta, extra,
}: {
  icono: typeof Mail
  valor: string | null
  vacio: string
  etiqueta: string
  extra?: ReactNode
}) {
  if (!valor) {
    return (
      <span className="inline-flex h-8 items-center gap-1.5 rounded-control border border-dashed border-line px-2.5 text-body-sm text-ink-3">
        <Icono className="h-3.5 w-3.5" aria-hidden />
        {vacio}
      </span>
    )
  }
  return (
    <span className="inline-flex h-8 max-w-full items-center gap-1 rounded-control border border-line bg-surface-2 pl-2.5 pr-1 text-body-sm text-ink">
      <Icono className="h-3.5 w-3.5 shrink-0 text-ink-3" aria-hidden />
      <span className="truncate">{valor}</span>
      <button onClick={() => copiar(valor, etiqueta)} className="rounded-chip p-1 text-ink-3 hover:bg-surface-3 hover:text-ink" title="Copiar" aria-label={`Copiar ${valor}`}>
        <Copy className="h-3.5 w-3.5" aria-hidden />
      </button>
      {extra}
    </span>
  )
}

function Dato({ label, valor }: { label: string; valor: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-label text-ink-2">{label}</dt>
      <dd className="truncate font-medium text-ink">{valor}</dd>
    </div>
  )
}
