import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BarrasMensuales } from '@/components/ui/charts'
import { ErrorState } from '@/components/ui/states'
import { Badge } from '@/components/ui/badge'
import { consumoIA, ErrorConsumo, type ConsumoIA } from '@/lib/ai/consumo'

export const dynamic = 'force-dynamic'

const usd = (v: number) =>
  `US$ ${v.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: v < 1 ? 3 : 2 })}`
const miles = (v: number) => v.toLocaleString('es-AR')

// Lo que gasta la IA de la plataforma (y de cualquier otro proyecto en la misma
// cuenta de Anthropic). Sólo lee los reportes: no tiene acciones.
export default async function ConsumoIAPage() {
  let datos: ConsumoIA | null = null
  let error: string | null = null
  try {
    datos = await consumoIA()
  } catch (e) {
    if (!(e instanceof ErrorConsumo)) console.error('[consumo-ia]', e)
    error = e instanceof ErrorConsumo ? e.message : 'No se pudieron leer los reportes de Anthropic.'
  }

  const hoy = new Date()
  const diasTranscurridos = hoy.getUTCDate()
  const diasDelMes = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() + 1, 0)).getUTCDate()

  return (
    <div className="space-y-section">
      <PageHeader
        title="Consumo de IA"
        description="Lo que gasta la IA en la cuenta de Anthropic, en dólares. Se actualiza cada 5 minutos."
        breadcrumbs={[{ label: 'Hoy', href: '/dashboard/admin' }, { label: 'Consumo de IA' }]}
      />

      {error || !datos ? (
        <ErrorState title="No se pudo cargar el consumo" description={error ?? undefined} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Este mes" value={usd(datos.mes.total)} tamano="compacto" acento="a1" />
            <StatCard
              label="Proyección del mes"
              value={usd((datos.mes.total / diasTranscurridos) * diasDelMes)}
              hint="Al ritmo de lo que va del mes"
              tamano="compacto"
              acento="a2"
            />
            <StatCard label="Mes anterior" value={usd(datos.mesAnterior)} tamano="compacto" acento="neutro" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Por día</CardTitle>
              <CardDescription>Pasá el mouse por una barra para ver el importe.</CardDescription>
            </CardHeader>
            <CardBody>
              <BarrasMensuales
                datos={datos.mes.porDia.map((d) => ({ label: String(d.dia), valor: d.valor }))}
                formato={usd}
              />
            </CardBody>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Por modelo</CardTitle>
              </CardHeader>
              <CardBody>
                {datos.mes.porModelo.length === 0 ? (
                  <p className="text-body-sm text-ink-2">Todavía no hay consumo este mes.</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {datos.mes.porModelo.map((m) => (
                      <li key={m.modelo} className="flex justify-between py-2 text-body-sm">
                        <span className="text-ink">{m.modelo}</span>
                        <span className="font-semibold text-ink">{usd(m.valor)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Por clave</CardTitle>
                <CardDescription>Tokens del mes. Separa esta plataforma de otros proyectos de la cuenta.</CardDescription>
              </CardHeader>
              <CardBody>
                {datos.porClave.length === 0 ? (
                  <p className="text-body-sm text-ink-2">Todavía no hay consumo este mes.</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {datos.porClave.map((c) => (
                      <li key={c.nombre} className="flex items-center justify-between gap-3 py-2 text-body-sm">
                        <span className="flex items-center gap-2 text-ink">
                          {c.nombre}
                          {c.propia && <Badge tone="info">Esta plataforma</Badge>}
                        </span>
                        <span className="font-semibold text-ink">{miles(c.tokens)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          </div>

          <p className="text-label text-ink-3">
            Es el consumo de la API, que se paga aparte del plan Team de Claude. Los importes se cierran por día en
            horario UTC.
          </p>
        </>
      )}
    </div>
  )
}
