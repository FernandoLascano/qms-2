'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Building2, CalendarClock, Lightbulb, Search, Wallet } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/states'
import { cn } from '@/lib/utils'
import { DIAS_AVISO } from '@/lib/cartera'

export interface SociedadCartera {
  id: string
  denominacion: string
  cliente: string
  partner: string | null
  cuit: string | null
  plan: string
  jurisdiccion: string
  inscripta: string
  domicilio: { estado: string; vence: string | null } | null
  servicios: { id: string; nombre: string }[]
  oportunidades: { id: string; nombre: string }[]
  ingresoMensual: number
  proximoVencimiento: { que: string; fecha: string; dias: number } | null
}

type Filtro = 'TODAS' | 'VENCEN' | 'OPORTUNIDADES' | 'SIN_SERVICIOS'

const pesos = (n: number) => '$' + Math.round(n).toLocaleString('es-AR')
const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

export default function CarteraLista({ sociedades }: { sociedades: SociedadCartera[] }) {
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('TODAS')

  const vence = (s: SociedadCartera) => !!s.proximoVencimiento && s.proximoVencimiento.dias <= DIAS_AVISO
  const sinServicios = (s: SociedadCartera) => s.servicios.length === 0 && s.domicilio?.estado !== 'ACTIVO'

  const kpi = useMemo(() => ({
    ingreso: sociedades.reduce((a, s) => a + s.ingresoMensual, 0),
    vencen: sociedades.filter(vence).length,
    vencidos: sociedades.filter((s) => s.proximoVencimiento && s.proximoVencimiento.dias < 0).length,
    oportunidades: sociedades.reduce((a, s) => a + s.oportunidades.length, 0),
    sinServicios: sociedades.filter(sinServicios).length,
  }), [sociedades])

  const q = busqueda.trim().toLowerCase()
  const visibles = sociedades
    .filter((s) =>
      filtro === 'VENCEN' ? vence(s)
        : filtro === 'OPORTUNIDADES' ? s.oportunidades.length > 0
          : filtro === 'SIN_SERVICIOS' ? sinServicios(s)
            : true,
    )
    .filter((s) => !q || [s.denominacion, s.cliente, s.cuit].some((v) => v?.toLowerCase().includes(q)))
    .sort((a, b) =>
      filtro === 'VENCEN' ? a.proximoVencimiento!.dias - b.proximoVencimiento!.dias : 0,
    )

  const filtros: { id: Filtro; texto: string; n: number }[] = [
    { id: 'TODAS', texto: 'Todas', n: sociedades.length },
    { id: 'VENCEN', texto: 'Vencen pronto', n: kpi.vencen },
    { id: 'OPORTUNIDADES', texto: 'Con oportunidades', n: sociedades.filter((s) => s.oportunidades.length > 0).length },
    { id: 'SIN_SERVICIOS', texto: 'Sin servicios', n: kpi.sinServicios },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sociedades" value={sociedades.length} icon={Building2} acento="a3" hint="Inscriptas" />
        <StatCard
          label="Ingreso recurrente"
          value={pesos(kpi.ingreso)}
          tamano="compacto"
          icon={Wallet}
          acento="a2"
          hint="Por mes, servicios activos y domicilios"
        />
        <StatCard
          label="Vencen en 30 días"
          value={kpi.vencen}
          icon={CalendarClock}
          acento="a5"
          alert={kpi.vencidos > 0}
          hint={kpi.vencidos > 0 ? `${kpi.vencidos} ya vencido${kpi.vencidos === 1 ? '' : 's'}` : 'Renovaciones y cobros'}
        />
        <StatCard
          label="Oportunidades"
          value={kpi.oportunidades}
          icon={Lightbulb}
          acento="a4"
          hint={`${kpi.sinServicios} sin ningún servicio`}
        />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {filtros.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltro(f.id)}
              aria-pressed={filtro === f.id}
              className={cn(
                'rounded-full border px-3 py-1 text-body-sm transition-colors',
                filtro === f.id
                  ? 'border-primary-line bg-primary-soft font-medium text-primary'
                  : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink',
              )}
            >
              {f.texto} <span className="tnum text-ink-3">{f.n}</span>
            </button>
          ))}
        </div>
        <div className="relative lg:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" aria-hidden />
          <Input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar sociedad, cliente o CUIT"
            aria-label="Buscar sociedades"
            className="pl-9"
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        {visibles.length === 0 ? (
          <EmptyState icon={Building2} title="No hay sociedades con este filtro" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-left text-label text-ink-2">
                  <th className="px-card-sm py-2.5 font-semibold">Sociedad</th>
                  <th className="py-2.5 pr-4 font-semibold">Domicilio</th>
                  <th className="py-2.5 pr-4 font-semibold">Servicios</th>
                  <th className="py-2.5 pr-4 font-semibold">Próximo vencimiento</th>
                  <th className="px-card-sm py-2.5 text-right font-semibold">Por mes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visibles.map((s) => (
                  <tr key={s.id} className="relative align-top transition-colors hover:bg-surface-2">
                    <td className="min-w-56 px-card-sm py-3">
                      <Link href={`/dashboard/admin/sociedades/${s.id}`} className="font-medium text-ink after:absolute after:inset-0 hover:text-primary">
                        {s.denominacion}
                      </Link>
                      <p className="text-label text-ink-2">
                        {s.cliente} · inscripta {fecha(s.inscripta)}
                      </p>
                      <p className="text-label text-ink-3">
                        {s.plan.charAt(0) + s.plan.slice(1).toLowerCase()}
                        {s.partner && ` · por ${s.partner}`}
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      {!s.domicilio ? (
                        <span className="text-ink-3">—</span>
                      ) : s.domicilio.estado === 'ACTIVO' ? (
                        <Badge size="sm" tone="success">En sede</Badge>
                      ) : s.domicilio.estado === 'PENDIENTE_CONTACTO' ? (
                        <Badge size="sm" tone="warning">Pendiente</Badge>
                      ) : (
                        <Badge size="sm">Cancelado</Badge>
                      )}
                    </td>
                    <td className="min-w-48 py-3 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {s.servicios.map((x) => <Badge key={x.id} size="sm" tone="info">{x.nombre}</Badge>)}
                        {s.oportunidades.map((x) => (
                          <Badge key={x.id} size="sm" tone="warning" dot title="Pidió información: oportunidad">
                            {x.nombre}
                          </Badge>
                        ))}
                        {s.servicios.length === 0 && s.oportunidades.length === 0 && <span className="text-ink-3">Ninguno</span>}
                      </div>
                    </td>
                    <td className="whitespace-nowrap py-3 pr-4">
                      {s.proximoVencimiento ? (
                        <>
                          <p
                            className={cn(
                              'font-medium tnum',
                              s.proximoVencimiento.dias < 0 ? 'text-danger' : s.proximoVencimiento.dias <= DIAS_AVISO ? 'text-warning' : 'text-ink',
                            )}
                          >
                            {s.proximoVencimiento.dias < 0
                              ? `Venció hace ${-s.proximoVencimiento.dias} d`
                              : s.proximoVencimiento.dias === 0
                                ? 'Vence hoy'
                                : `${fecha(s.proximoVencimiento.fecha)}`}
                          </p>
                          <p className="text-label text-ink-3">{s.proximoVencimiento.que}</p>
                        </>
                      ) : (
                        <span className="text-ink-3">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-card-sm py-3 text-right tnum">
                      {s.ingresoMensual > 0 ? <span className="font-semibold text-ink">{pesos(s.ingresoMensual)}</span> : <span className="text-ink-3">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
