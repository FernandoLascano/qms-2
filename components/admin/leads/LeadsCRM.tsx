'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Flame, Mail, Phone, Plus, Search, Users } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/states'
import { CountBadge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  SITUACIONES_HOY,
  SITUACION_TEXTO,
  diaDe,
  hoyClave,
  situacionDe,
  type Situacion,
} from '@/lib/leads/agenda'
import { LeadDetalle } from './LeadDetalle'
import { EditarContactoDialog, NuevoLeadDialog, PerdidoDialog } from './Dialogos'
import { ESTADOS, MOTIVOS_PERDIDA, type LeadCRM } from './tipos'

/*
 * Leads como un CRM: una agenda que dice a quién escribirle hoy, un embudo
 * por etapas y, al lado, la ficha del lead con lo necesario para contactarlo
 * sin salir de la pantalla.
 */

type Vista = 'HOY' | 'ABIERTOS' | 'GANADOS' | 'PERDIDOS'
const ETAPAS_ABIERTAS = ESTADOS.filter((e) => !['CONVERTIDO', 'DESCARTADO'].includes(e.valor))

const DIA_MS = 86_400_000
const diasEntre = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / DIA_MS)

export default function LeadsCRM({ leads }: { leads: LeadCRM[] }) {
  const router = useRouter()
  const hoy = hoyClave()
  const [vista, setVista] = useState<Vista>('HOY')
  const [etapa, setEtapa] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [seleccionId, setSeleccionId] = useState<string | null>(null)
  const [nuevo, setNuevo] = useState(false)
  const [perdiendo, setPerdiendo] = useState<LeadCRM | null>(null)
  const [editando, setEditando] = useState<LeadCRM | null>(null)
  const [pantallaAncha, setPantallaAncha] = useState(true)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const al = () => setPantallaAncha(mq.matches)
    al()
    mq.addEventListener('change', al)
    // El lead abierto vive en la URL: se puede compartir y sobrevive a un F5.
    const id = new URLSearchParams(window.location.search).get('lead')
    if (id) setSeleccionId(id)
    return () => mq.removeEventListener('change', al)
  }, [])

  function seleccionar(id: string | null) {
    setSeleccionId(id)
    const url = new URL(window.location.href)
    if (id) url.searchParams.set('lead', id)
    else url.searchParams.delete('lead')
    window.history.replaceState(null, '', url)
  }

  const conSituacion = useMemo(
    () => leads.map((l) => ({ lead: l, situacion: situacionDe(l, hoy) })),
    [leads, hoy],
  )

  const cuenta = useMemo(() => {
    const c = { HOY: 0, ABIERTOS: 0, GANADOS: 0, PERDIDOS: 0, VENCIDO: 0, porEtapa: {} as Record<string, number> }
    for (const { lead, situacion } of conSituacion) {
      if (SITUACIONES_HOY.includes(situacion)) c.HOY++
      if (situacion === 'VENCIDO') c.VENCIDO++
      if (situacion === 'GANADO') c.GANADOS++
      else if (situacion === 'PERDIDO') c.PERDIDOS++
      else {
        c.ABIERTOS++
        c.porEtapa[lead.estado] = (c.porEtapa[lead.estado] ?? 0) + 1
      }
    }
    return c
  }, [conSituacion])

  const q = busqueda.trim().toLowerCase()

  // Lista visible, ya agrupada. Con búsqueda se mira todo, sin importar la vista.
  const grupos = useMemo(() => {
    const porPuntaje = (a: { lead: LeadCRM }, b: { lead: LeadCRM }) => b.lead.puntaje - a.lead.puntaje

    if (q) {
      const r = conSituacion.filter(({ lead }) =>
        [lead.nombre, lead.email, lead.telefono, lead.denominacion].some((v) => v?.toLowerCase().includes(q)),
      )
      return [{ titulo: `Resultados en todos los leads`, items: r.sort(porPuntaje) }]
    }

    if (vista === 'HOY') {
      return SITUACIONES_HOY.map((s) => ({
        titulo: SITUACION_TEXTO[s],
        situacion: s,
        items: conSituacion
          .filter((x) => x.situacion === s)
          .sort((a, b) =>
            // Los vencidos, del más atrasado al menos; el resto, por prioridad.
            s === 'VENCIDO' ? diaDe(a.lead.proximoContacto!).localeCompare(diaDe(b.lead.proximoContacto!)) : porPuntaje(a, b),
          ),
      })).filter((g) => g.items.length > 0)
    }

    if (vista === 'ABIERTOS') {
      const abiertos = conSituacion.filter(
        (x) => x.situacion !== 'GANADO' && x.situacion !== 'PERDIDO' && (!etapa || x.lead.estado === etapa),
      )
      return [{ titulo: etapa ? ESTADOS.find((e) => e.valor === etapa)!.texto : 'Todos los abiertos', items: abiertos.sort(porPuntaje) }]
    }

    const cerrado = vista === 'GANADOS' ? 'GANADO' : 'PERDIDO'
    return [{
      titulo: vista === 'GANADOS' ? 'Ganados' : 'Perdidos',
      items: conSituacion
        .filter((x) => x.situacion === cerrado)
        .sort((a, b) => b.lead.ultimaActividad.localeCompare(a.lead.ultimaActividad)),
    }]
  }, [conSituacion, vista, etapa, q])

  const ordenVisible = grupos.flatMap((g) => g.items.map((x) => x.lead.id))
  const seleccionado = leads.find((l) => l.id === seleccionId) ?? null

  // En pantalla ancha siempre hay un lead abierto: el primero de la lista.
  useEffect(() => {
    if (pantallaAncha && !seleccionado && ordenVisible[0]) seleccionar(ordenVisible[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pantallaAncha, seleccionado, ordenVisible[0]])

  function trasCambio(tipo: 'contacto' | 'otro') {
    // Registrar un contacto desde la agenda saca al lead de «para hoy»: se
    // pasa solo al siguiente, como quien va tachando una lista.
    if (tipo === 'contacto' && vista === 'HOY' && !q && seleccionId) {
      const i = ordenVisible.indexOf(seleccionId)
      const siguiente = ordenVisible[i + 1] ?? ordenVisible[i - 1] ?? null
      if (siguiente) seleccionar(siguiente)
    }
    router.refresh()
  }

  const vistas: { id: Vista; texto: string; n: number }[] = [
    { id: 'HOY', texto: 'Para hoy', n: cuenta.HOY },
    { id: 'ABIERTOS', texto: 'Abiertos', n: cuenta.ABIERTOS },
    { id: 'GANADOS', texto: 'Ganados', n: cuenta.GANADOS },
    { id: 'PERDIDOS', texto: 'Perdidos', n: cuenta.PERDIDOS },
  ]

  const detalle = seleccionado && (
    <LeadDetalle
      key={seleccionado.id}
      lead={seleccionado}
      onCambio={trasCambio}
      onPerder={() => setPerdiendo(seleccionado)}
      onEditar={() => setEditando(seleccionado)}
    />
  )

  return (
    <div className="space-y-section">
      <PageHeader
        title="Leads"
        description="A quién escribirle hoy, qué decirle y cuándo volver a contactarlo."
        breadcrumbs={[{ label: 'Hoy', href: '/dashboard/admin' }, { label: 'Leads' }]}
        actions={
          <Button onClick={() => setNuevo(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Nuevo lead
          </Button>
        }
      />

      {/* Embudo: cuántos hay en cada etapa. Cada tramo filtra la lista. */}
      <Card className="overflow-hidden">
        <ol className="grid grid-cols-2 divide-line sm:grid-cols-3 lg:grid-cols-6 lg:divide-x">
          {[...ETAPAS_ABIERTAS, { valor: 'CONVERTIDO', texto: 'Ganados' }, { valor: 'DESCARTADO', texto: 'Perdidos' }].map((e) => {
            const n =
              e.valor === 'CONVERTIDO' ? cuenta.GANADOS : e.valor === 'DESCARTADO' ? cuenta.PERDIDOS : cuenta.porEtapa[e.valor] ?? 0
            const activo =
              (vista === 'ABIERTOS' && etapa === e.valor) ||
              (vista === 'GANADOS' && e.valor === 'CONVERTIDO') ||
              (vista === 'PERDIDOS' && e.valor === 'DESCARTADO')
            return (
              <li key={e.valor}>
                <button
                  type="button"
                  onClick={() => {
                    setBusqueda('')
                    if (e.valor === 'CONVERTIDO') { setVista('GANADOS'); setEtapa(null) }
                    else if (e.valor === 'DESCARTADO') { setVista('PERDIDOS'); setEtapa(null) }
                    else { setVista('ABIERTOS'); setEtapa(activo ? null : e.valor) }
                  }}
                  aria-pressed={activo}
                  className={cn(
                    'relative w-full px-card-sm py-3 text-left transition-colors hover:bg-surface-2',
                    activo && 'bg-primary-soft hover:bg-primary-soft',
                  )}
                >
                  <span className={cn('block text-title tnum', n === 0 ? 'text-ink-3' : e.valor === 'CONVERTIDO' ? 'text-success' : 'text-ink')}>
                    {n}
                  </span>
                  <span className={cn('block text-body-sm', activo ? 'font-medium text-primary' : 'text-ink-2')}>{e.texto}</span>
                  {activo && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" aria-hidden />}
                </button>
              </li>
            )
          })}
        </ol>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
        {/* ── Lista ── */}
        <div className="space-y-3">
          <nav aria-label="Vistas" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
            <ul className="flex min-w-max items-center gap-1 border-b border-line">
              {vistas.map((v) => (
                <li key={v.id}>
                  <button
                    type="button"
                    onClick={() => { setVista(v.id); setEtapa(null); setBusqueda('') }}
                    aria-current={vista === v.id && !q ? 'page' : undefined}
                    className={cn(
                      'relative flex h-11 items-center gap-2 rounded-t-control px-3 text-body-sm transition-colors',
                      vista === v.id && !q ? 'font-medium text-primary' : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
                    )}
                  >
                    {v.texto}
                    {v.id === 'HOY' ? (
                      <CountBadge count={v.n} tone={cuenta.VENCIDO > 0 ? 'danger' : 'primary'} />
                    ) : (
                      <span className="text-ink-3 tnum">{v.n}</span>
                    )}
                    {vista === v.id && !q && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" aria-hidden />}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" aria-hidden />
            <Input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, email, teléfono o sociedad"
              aria-label="Buscar leads"
              className="pl-9"
            />
          </div>

          {ordenVisible.length === 0 ? (
            <Card>
              {vista === 'HOY' && !q ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="Estás al día"
                  description="No hay seguimientos para hoy ni leads nuevos sin contactar."
                />
              ) : (
                <EmptyState icon={Users} title={q ? 'Sin resultados' : 'No hay leads acá'} description={q ? `Nada coincide con «${busqueda}».` : undefined} />
              )}
            </Card>
          ) : (
            <Card className="overflow-hidden">
              {grupos.map((g) => (
                <section key={g.titulo}>
                  {(grupos.length > 1 || vista === 'HOY') && (
                    <h3 className="flex items-center justify-between border-b border-line bg-surface-2 px-card-sm py-2 text-label font-semibold text-ink-2">
                      {g.titulo}
                      <span className="tnum">{g.items.length}</span>
                    </h3>
                  )}
                  <ul className="divide-y divide-line border-b border-line last:border-b-0">
                    {g.items.map(({ lead, situacion }) => (
                      <li key={lead.id}>
                        <FilaLead
                          lead={lead}
                          situacion={situacion}
                          hoy={hoy}
                          activa={lead.id === seleccionId}
                          onClick={() => seleccionar(lead.id)}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </Card>
          )}
        </div>

        {/* ── Ficha ── */}
        {pantallaAncha ? (
          <Card className="lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto">
            {detalle ?? <EmptyState icon={Users} title="Elegí un lead" description="Su ficha aparece acá." />}
          </Card>
        ) : (
          seleccionado && (
            <div className="fixed inset-0 z-40 overflow-y-auto bg-canvas pb-[env(safe-area-inset-bottom)]">
              <div className="sticky top-0 z-10 border-b border-line bg-surface px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
                <Button variant="ghost" size="sm" onClick={() => seleccionar(null)}>
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                  Volver a la lista
                </Button>
              </div>
              <div className="bg-surface">{detalle}</div>
            </div>
          )
        )}
      </div>

      <NuevoLeadDialog open={nuevo} onOpenChange={setNuevo} onCreado={(id) => { seleccionar(id); router.refresh() }} />
      <PerdidoDialog lead={perdiendo} onOpenChange={(o) => !o && setPerdiendo(null)} onHecho={() => trasCambio('otro')} />
      <EditarContactoDialog lead={editando} onOpenChange={(o) => !o && setEditando(null)} onHecho={() => trasCambio('otro')} />
    </div>
  )
}

/* ───────────────────────────── Fila de la lista ───────────────────────────── */

function FilaLead({
  lead, situacion, hoy, activa, onClick,
}: {
  lead: LeadCRM
  situacion: Situacion
  hoy: string
  activa: boolean
  onClick: () => void
}) {
  const proximo = (() => {
    switch (situacion) {
      case 'VENCIDO': {
        const d = diasEntre(diaDe(lead.proximoContacto!), hoy)
        return { texto: `Vencido hace ${d} ${d === 1 ? 'día' : 'días'}`, clase: 'text-danger font-medium' }
      }
      case 'HOY': return { texto: 'Toca hoy', clase: 'text-warning font-medium' }
      case 'NUEVO': return { texto: 'Nunca contactado', clase: 'text-info font-medium' }
      case 'SIN_PASO': return { texto: 'Sin próximo paso', clase: 'text-warning' }
      case 'AGENDADO': {
        const d = diasEntre(hoy, diaDe(lead.proximoContacto!))
        return { texto: d === 1 ? 'Mañana' : `En ${d} días`, clase: 'text-ink-3' }
      }
      case 'GANADO': return { texto: 'Ganado', clase: 'text-success font-medium' }
      case 'PERDIDO':
        return { texto: MOTIVOS_PERDIDA.find((m) => m.valor === lead.motivoPerdida)?.texto ?? 'Perdido', clase: 'text-ink-3' }
    }
  })()

  const contexto =
    lead.tipo === 'BORRADOR'
      ? [lead.denominacion, `Formulario ${lead.avance}%`, lead.segmentoTexto].filter(Boolean).join(' · ')
      : lead.origenTexto

  const iniciales = lead.nombre.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={activa ? 'true' : undefined}
      className={cn(
        'flex w-full items-start gap-3 px-card-sm py-3 text-left transition-colors',
        activa ? 'bg-primary-soft shadow-[inset_3px_0_0_var(--color-primary)]' : 'hover:bg-surface-2',
      )}
    >
      <span
        className={cn(
          'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-label font-semibold ring-1',
          lead.franja === 'ALTA' ? 'bg-a1-soft text-a1 ring-a1-line' : 'bg-surface-3 text-ink-2 ring-line',
        )}
        aria-hidden
      >
        {iniciales || '?'}
        {lead.franja === 'ALTA' && (
          <Flame className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-surface text-primary" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-body font-medium text-ink">{lead.nombre}</span>
          <span className={cn('shrink-0 text-label', proximo.clase)}>{proximo.texto}</span>
        </span>
        <span className="block truncate text-body-sm text-ink-2">{contexto}</span>
        <span className="mt-1 flex items-center gap-2 text-label text-ink-3">
          <span>{ESTADOS.find((e) => e.valor === lead.estado)?.texto}</span>
          <span aria-hidden>·</span>
          <Phone className={cn('h-3 w-3', lead.telefono ? 'text-ink-2' : 'opacity-40')} aria-label={lead.telefono ? 'Tiene teléfono' : 'Sin teléfono'} />
          <Mail className={cn('h-3 w-3', lead.email ? 'text-ink-2' : 'opacity-40')} aria-label={lead.email ? 'Tiene email' : 'Sin email'} />
          {lead.actividad.length > 0 && <span className="tnum">· {lead.actividad.length} contacto{lead.actividad.length === 1 ? '' : 's'}</span>}
        </span>
      </span>
    </button>
  )
}
