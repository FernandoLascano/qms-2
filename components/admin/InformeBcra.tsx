'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Building2, FileWarning, Landmark, RefreshCw, ShieldCheck, User } from 'lucide-react'
import { Badge, type Tone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { FilaBcra, Nivel, ResumenBcra } from '@/lib/bcra'

/**
 * Informe de la Central de Deudores del BCRA para un cliente con domicilio en
 * sede. El semáforo es el de la sociedad; los socios y administradores van
 * aparte y en tono informativo: su situación personal no es la de la
 * sociedad y no tiene que alarmar. Por persona: situación, deuda, cheques
 * rechazados y los últimos 24 meses en barras.
 */

const NIVEL: Record<Nivel, { tone: Tone; etiqueta: string }> = {
  OK: { tone: 'success', etiqueta: 'Sin problemas' },
  ATENCION: { tone: 'warning', etiqueta: 'Atención' },
  RIESGO: { tone: 'danger', etiqueta: 'Riesgo' },
  ERROR: { tone: 'neutral', etiqueta: 'No se pudo consultar' },
  SIN_CONSULTAR: { tone: 'neutral', etiqueta: 'Sin consultar' },
}

const SITUACION: Record<number, string> = {
  0: 'No figura',
  1: 'Normal',
  2: 'Riesgo bajo',
  3: 'Riesgo medio',
  4: 'Riesgo alto',
  5: 'Irrecuperable',
  6: 'Irrecuperable (disp. técnica)',
}

const ROL: Record<string, string> = {
  SOCIEDAD: 'Sociedad',
  SOCIO: 'Socio',
  ADMINISTRADOR: 'Administrador',
  SOCIO_ADMINISTRADOR: 'Socio y administrador',
}

/** Color de una situación: 1 verde, 2 ámbar, 3+ rojo, sin deuda gris. */
const colorSituacion = (s: number) => (s >= 3 ? 'bg-danger-solid' : s === 2 ? 'bg-warning-solid' : s === 1 ? 'bg-success-solid' : 'bg-n-300')
const textoSituacion = (s: number) => (s >= 3 ? 'text-danger' : s === 2 ? 'text-warning' : s === 1 ? 'text-success' : 'text-ink-2')

const fmtCuit = (c: string) => (c.length === 11 ? `${c.slice(0, 2)}-${c.slice(2, 10)}-${c.slice(10)}` : c)
const fmtPeriodo = (p: string | null) => (p && p.length === 6 ? `${p.slice(4)}/${p.slice(0, 4)}` : '—')
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const mesCorto = (p: string) => `${MESES[Number(p.slice(4)) - 1]} ${p.slice(2, 4)}`
const fechaCorta = (iso: string) => new Date(iso).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })

/** El BCRA informa en miles de pesos. */
function fmtPesos(miles: number) {
  const pesos = miles * 1000
  if (pesos >= 1_000_000) return `$ ${(pesos / 1_000_000).toLocaleString('es-AR', { maximumFractionDigits: 1 })} M`
  return `$ ${Math.round(pesos).toLocaleString('es-AR')}`
}

/** Píldora del semáforo de la sociedad. */
export function SemaforoBcra({ nivel, size = 'sm' }: { nivel: Nivel; size?: 'sm' | 'md' }) {
  return (
    <Badge tone={NIVEL[nivel].tone} dot size={size}>
      {NIVEL[nivel].etiqueta}
    </Badge>
  )
}

/** Situación personal de un socio o administrador: nunca en rojo. */
const NIVEL_PERSONA: Record<Nivel, { tone: Tone; etiqueta: string }> = {
  OK: { tone: 'success', etiqueta: 'Sin deudas' },
  ATENCION: { tone: 'neutral', etiqueta: 'Deuda con atraso leve' },
  RIESGO: { tone: 'warning', etiqueta: 'Deudas irregulares' },
  ERROR: { tone: 'neutral', etiqueta: 'No se pudo consultar' },
  SIN_CONSULTAR: { tone: 'neutral', etiqueta: 'Sin consultar' },
}

/** Semáforo de la sociedad, o «sin CUIT» si todavía no tiene: entonces sólo hay datos de los socios. */
export function EstadoSociedadBcra({ resumen }: { resumen: ResumenBcra }) {
  if (!resumen.sociedad && resumen.socios.total > 0) return <Badge tone="neutral" size="sm">Sociedad sin CUIT</Badge>
  return <SemaforoBcra nivel={resumen.nivel} />
}

/** Línea chica con la situación de los socios: dato informativo. */
export function NotaSociosBcra({ resumen, className }: { resumen: ResumenBcra; className?: string }) {
  const { total, conDeudas } = resumen.socios
  if (total === 0) return null
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-label text-ink-2', className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', conDeudas ? 'bg-warning-solid' : 'bg-success-solid')} />
      {conDeudas ? `Socios: ${conDeudas} de ${total} con deudas` : `Socios: sin deudas`}
    </span>
  )
}

type Informe = { denominacion: string; aConsultar: number; personas: FilaBcra[] }

export function InformeBcraDialog({
  tramiteId,
  open,
  onOpenChange,
  onActualizado,
}: {
  tramiteId: string
  open: boolean
  onOpenChange: (o: boolean) => void
  onActualizado?: () => void
}) {
  const [informe, setInforme] = useState<Informe | null>(null)
  const [consultando, setConsultando] = useState(false)

  const cargar = useCallback(async () => {
    const res = await fetch(`/api/admin/bcra/${tramiteId}`)
    if (res.ok) setInforme(await res.json())
    else toast.error('No se pudo cargar el informe')
  }, [tramiteId])

  useEffect(() => {
    if (open) cargar()
  }, [open, cargar])

  async function consultar() {
    setConsultando(true)
    try {
      const res = await fetch(`/api/admin/bcra/${tramiteId}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setInforme(data)
      toast.success('Consulta al BCRA actualizada')
      onActualizado?.()
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : 'No se pudo consultar el BCRA')
    } finally {
      setConsultando(false)
    }
  }

  const personas = informe?.personas ?? []
  const sociedad = personas.find((p) => p.rol === 'SOCIEDAD')
  const socios = personas.filter((p) => p.rol !== 'SOCIEDAD')
  const ultima = personas.map((p) => p.consultadoEl).sort().at(-1)
  const periodo = personas.map((p) => p.periodo).filter(Boolean).sort().at(-1) ?? null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* minmax(0,1fr): sin esto la tabla ancha estiraba la grilla y en el celular se cortaba todo a la derecha. */}
      <DialogContent className="max-w-3xl max-h-[88vh] grid-cols-[minmax(0,1fr)] overflow-y-auto px-4 sm:px-6">
        <DialogHeader className="pr-8 text-left">
          <DialogTitle className="flex flex-wrap items-center gap-3">
            <span>Situación en el BCRA</span>
            {informe && personas.length > 0 && (sociedad ? <SemaforoBcra nivel={sociedad.nivel} size="md" /> : <Badge tone="neutral">Sociedad sin CUIT</Badge>)}
          </DialogTitle>
          <DialogDescription>
            {informe?.denominacion ?? 'Cargando…'}
            {ultima && <> · Consultado el {fechaCorta(ultima)} · Datos de {fmtPeriodo(periodo)}</>}
          </DialogDescription>
        </DialogHeader>

        {!informe ? (
          <div className="space-y-3">
            {[0, 1].map((k) => <div key={k} className="h-40 animate-pulse rounded-card bg-surface-2" />)}
          </div>
        ) : personas.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-line bg-surface-2 px-6 py-10 text-center">
            <Landmark className="h-9 w-9 text-primary" />
            <div>
              <p className="text-heading text-ink">Todavía no se consultó</p>
              <p className="mt-1 max-w-md text-body-sm text-ink-2">
                {informe.aConsultar > 0
                  ? `Se consulta la Central de Deudores de ${informe.aConsultar === 1 ? 'la única persona' : `las ${informe.aConsultar} personas`} con CUIT cargado: la sociedad, sus socios y administradores.`
                  : 'El trámite no tiene ningún CUIT válido cargado para consultar.'}
              </p>
            </div>
            {informe.aConsultar > 0 && (
              <Button onClick={consultar} disabled={consultando} className="gap-2">
                <RefreshCw className={cn('h-4 w-4', consultando && 'animate-spin')} /> {consultando ? 'Consultando…' : 'Consultar ahora'}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {sociedad ? (
              <TarjetaPersona p={sociedad} />
            ) : (
              <p className="rounded-card border border-dashed border-line bg-surface-2 p-card text-body-sm text-ink-2">
                La sociedad todavía no tiene CUIT, así que no se puede consultar. Mientras tanto, lo que hay para evaluar es la situación de los socios.
              </p>
            )}

            {socios.length > 0 && (
              <div className="space-y-3 pt-2">
                <div>
                  <h3 className="text-heading text-ink">Socios y administradores</h3>
                  <p className="text-body-sm text-ink-2">
                    {sociedad ? 'Su situación personal, como dato informativo: no cambia el semáforo de la sociedad.' : 'Su situación personal en la Central de Deudores.'}
                  </p>
                </div>
                {socios.map((p) => <TarjetaPersona key={p.cuit} p={p} persona />)}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <p className="text-label text-ink-3">
                Fuente: Central de Deudores del BCRA (pública). Se actualiza una vez por mes; el seguimiento es automático.
              </p>
              <Button size="sm" variant="outline" onClick={consultar} disabled={consultando} className="gap-1.5">
                <RefreshCw className={cn('h-4 w-4', consultando && 'animate-spin')} /> {consultando ? 'Consultando…' : 'Consultar de nuevo'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/** `persona`: socio o administrador; tarjeta más sobria, sin bordes ni etiquetas de alarma. */
function TarjetaPersona({ p, persona = false }: { p: FilaBcra; persona?: boolean }) {
  const Icono = p.rol === 'SOCIEDAD' ? Building2 : User
  const borde = persona ? 'border-line' : p.nivel === 'RIESGO' ? 'border-danger-line' : p.nivel === 'ATENCION' ? 'border-warning-line' : 'border-line'
  const etiqueta = persona ? NIVEL_PERSONA[p.nivel] : NIVEL[p.nivel]
  return (
    <section className={cn('rounded-card border bg-surface p-card', persona ? '' : 'shadow-raise', borde)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Icono className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{p.nombre || 'Sin nombre'}</p>
            <p className="text-label text-ink-2">{ROL[p.rol] ?? p.rol} · <span className="tnum">{fmtCuit(p.cuit)}</span></p>
          </div>
        </div>
        <Badge tone={etiqueta.tone} dot size="sm">{etiqueta.etiqueta}</Badge>
      </div>

      {p.error ? (
        <p className="mt-4 rounded-control bg-surface-2 p-3 text-body-sm text-ink-2">No se pudo consultar: {p.error}. Probá de nuevo en un rato.</p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
            <Dato titulo="Situación" valor={p.peorSituacion ? String(p.peorSituacion) : '—'} nota={SITUACION[p.peorSituacion]} clase={persona ? undefined : textoSituacion(p.peorSituacion)} />
            <Dato titulo="Deuda" valor={p.deudaTotal ? fmtPesos(p.deudaTotal) : '$ 0'} nota={p.entidades.length ? `${p.entidades.length} entidad${p.entidades.length === 1 ? '' : 'es'}` : 'sin deudas'} />
            <Dato
              titulo="Cheques"
              valor={String(p.chequesRechazados)}
              nota={p.chequesRechazados ? (p.chequesSinPagar ? `rechazados, ${p.chequesSinPagar} sin pagar` : 'rechazados, pagados') : 'sin rechazos'}
              clase={persona ? undefined : p.chequesSinPagar ? 'text-danger' : p.chequesRechazados ? 'text-warning' : undefined}
            />
          </div>

          <Historial meses={p.historial} />

          {p.entidades.length > 0 && (
            <div className="-mx-1 mt-4 overflow-x-auto px-1">
              <table className="w-full min-w-[30rem] text-body-sm">
                <thead>
                  <tr className="border-b border-line text-left text-label text-ink-2">
                    <th className="py-1.5 pr-3 font-medium">Entidad</th>
                    <th className="pr-3 font-medium">Situación</th>
                    <th className="pr-3 text-right font-medium">Monto</th>
                    <th className="text-right font-medium">Atraso</th>
                  </tr>
                </thead>
                <tbody>
                  {p.entidades.map((e, i) => (
                    <tr key={i} className="border-b border-line last:border-0">
                      <td className="py-1.5 pr-3 text-ink">{e.entidad}{e.procesoJudicial && <span className="ml-1.5 text-label font-semibold text-danger">· proceso judicial</span>}</td>
                      <td className="pr-3">
                        <span className="inline-flex items-center gap-1.5 text-ink">
                          <span className={cn('h-2 w-2 rounded-full', colorSituacion(e.situacion))} />
                          {e.situacion} · {SITUACION[e.situacion]}
                        </span>
                      </td>
                      <td className="pr-3 text-right tnum text-ink">{fmtPesos(e.monto)}</td>
                      <td className={cn('text-right tnum', e.diasAtraso > 0 ? 'text-warning' : 'text-ink-2')}>{e.diasAtraso ? `${e.diasAtraso} d` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {p.cheques.length > 0 && (
            <div className="mt-4 rounded-control border border-warning-line bg-warning-soft p-3">
              <p className="mb-2 flex items-center gap-1.5 text-body-sm font-semibold text-warning"><FileWarning className="h-4 w-4" /> Cheques rechazados</p>
              <ul className="space-y-1 text-body-sm text-ink">
                {p.cheques.slice(0, 8).map((c, i) => (
                  <li key={i} className="flex flex-wrap justify-between gap-x-3 gap-y-0.5">
                    <span>{c.fecha ? fechaCorta(c.fecha) : '—'} · {c.causal}</span>
                    <span className="tnum">$ {Math.round(c.monto).toLocaleString('es-AR')} · {c.pagado ? 'pagado' : <b className="text-danger">sin pagar</b>}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {p.peorSituacion === 0 && p.chequesRechazados === 0 && (
            <p className="mt-4 flex items-center gap-2 text-body-sm text-success"><ShieldCheck className="h-4 w-4" /> No tiene deudas informadas ni cheques rechazados.</p>
          )}
        </>
      )}
    </section>
  )
}

function Dato({ titulo, valor, nota, clase }: { titulo: string; valor: string; nota?: string; clase?: string }) {
  return (
    <div className="min-w-0 rounded-control bg-surface-2 p-2.5 sm:p-3">
      <p className="text-label text-ink-2">{titulo}</p>
      <p className={cn('mt-0.5 text-heading tnum text-ink', clase)}>{valor}</p>
      {nota && <p className="text-label leading-snug text-ink-3">{nota}</p>}
    </div>
  )
}

/** Últimos 24 meses: el alto es el monto, el color la peor situación del mes. */
function Historial({ meses }: { meses: FilaBcra['historial'] }) {
  if (meses.length === 0) return null
  const max = Math.max(...meses.map((m) => m.monto), 1)
  return (
    <div className="mt-4">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-label font-medium text-ink-2">Últimos {meses.length} meses</p>
        <div className="flex items-center gap-3 text-label text-ink-3">
          {[1, 2, 3].map((s) => (
            <span key={s} className="inline-flex items-center gap-1"><span className={cn('h-2 w-2 rounded-full', colorSituacion(s))} />{s === 3 ? '3 o más' : s}</span>
          ))}
        </div>
      </div>
      <div className="flex h-20 items-end gap-[3px] rounded-control bg-surface-2 px-2 pt-2">
        {meses.map((m) => (
          <div
            key={m.periodo}
            title={`${mesCorto(m.periodo)} · situación ${m.situacion || '—'} · ${fmtPesos(m.monto)}`}
            className={cn('flex-1 rounded-t-[3px] transition-opacity hover:opacity-80', colorSituacion(m.situacion))}
            style={{ height: `${Math.max(6, (m.monto / max) * 100)}%` }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-label text-ink-3 tnum">
        <span>{mesCorto(meses[0].periodo)}</span>
        <span>{mesCorto(meses[meses.length - 1].periodo)}</span>
      </div>
    </div>
  )
}
