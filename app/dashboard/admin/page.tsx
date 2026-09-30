import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ArrowRight,
  CheckCircle,
  ClipboardCheck,
  Clock,
  FileText,
  TrendingDown,
  TrendingUp,
  UserSearch,
  Users,
  CalendarClock,
  Mail,
  Lightbulb,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { WHERE_DOCUMENTOS_POR_APROBAR } from '@/lib/documentos'
import { PageHeader, SectionHeader } from '@/components/ui/page-header'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/states'
import { Sparkline, BarraDistribucion, Embudo } from '@/components/ui/charts'
import { NumeroAnimado } from '@/components/ui/motion'
import { ServiceStatus } from '@/components/dashboard/service-status'
import { RespaldoStatus } from '@/components/dashboard/respaldo-status'
import { getEstadoRespaldo } from '@/lib/respaldo'
import { getEstado } from '@/lib/tramites/estado'
import { porSemana, variacion } from '@/lib/dashboard/series'
import { cn } from '@/lib/utils'
import { contarAgendaLeads } from '@/lib/leads/agenda-servidor'
import { DIAS_AVISO, diasHasta, hoyArgentina } from '@/lib/cartera'

interface Tarea {
  icono: LucideIcon
  cantidad: number
  titulo: string
  href: string
  urgente?: boolean
}

async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.rol !== 'ADMIN') redirect('/dashboard')

  const desde12Semanas = new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000)

  // Si falla, la tarjeta muestra el error sin tirar abajo el panel entero.
  const respaldoP = getEstadoRespaldo().catch((error) => {
    console.error('Error al leer el estado del respaldo:', error)
    return null
  })

  /*
   * La agenda del día junta lo que antes había que ir a buscar a cada
   * sección: leads (con el mismo criterio que «Para hoy» del CRM), mails sin
   * leer, vencimientos de clientes y oportunidades de venta.
   *
   * Los servicios contratados son una tabla nueva: si todavía no se corrió su
   * migración, esos contadores dan cero en vez de tirar abajo el panel.
   */
  const hoyAR = hoyArgentina()
  const limiteAviso = new Date(hoyAR.getTime() + DIAS_AVISO * 86_400_000)
  const agendaP = Promise.all([
    contarAgendaLeads(hoyAR.toISOString().slice(0, 10)),
    prisma.email.count({ where: { direction: 'INBOUND', status: 'UNREAD' } }),
    prisma.servicioContratado
      .findMany({ where: { estado: 'ACTIVO', proximoVencimiento: { lte: limiteAviso } }, select: { proximoVencimiento: true } })
      .catch(() => [] as { proximoVencimiento: Date | null }[]),
    prisma.domicilioSede.findMany({
      where: { estado: 'ACTIVO', fechaVencimiento: { lte: limiteAviso } },
      select: { fechaVencimiento: true },
    }),
    prisma.servicioContratado.count({ where: { estado: 'INTERESADO' } }).catch(() => 0),
  ])

  // Las tres tandas (contadores, estado del respaldo y agenda) salen juntas:
  // antes iban una detrás de otra, y cada tanda es un viaje a la base.
  const [
    [
      totalTramites,
      completados,
      enProceso,
      esperandoCliente,
      totalUsuarios,
      documentosPendientes,
      pendientesValidacion,
      tramitesRecientes,
      totalBorradores,
      conDenominacion,
      fechasTramites,
      fechasUsuarios,
      fechasInscripciones,
    ],
    estadoRespaldo,
    [agendaLeads, emailsSinLeer, serviciosPorVencer, domiciliosPorVencer, oportunidades],
  ] = await Promise.all([
    Promise.all([
      // Los borradores sin enviar no son trámites: se cuentan aparte, como leads.
      prisma.tramite.count({ where: { formularioCompleto: true } }),
      prisma.tramite.count({ where: { sociedadInscripta: true } }),
      prisma.tramite.count({ where: { formularioCompleto: true, sociedadInscripta: false } }),
      prisma.tramite.count({ where: { estadoGeneral: 'ESPERANDO_CLIENTE' } }),
      prisma.user.count(),
      prisma.documento.count({ where: WHERE_DOCUMENTOS_POR_APROBAR }),
      prisma.tramite.count({
        where: { formularioCompleto: true, estadoValidacion: 'PENDIENTE_VALIDACION' },
      }),
      prisma.tramite.findMany({
        take: 7,
        where: { formularioCompleto: true },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          denominacionSocial1: true,
          denominacionAprobada: true,
          estadoGeneral: true,
          estadoValidacion: true,
          formularioCompleto: true,
          sociedadInscripta: true,
          denominacionReservada: true,
          capitalDepositado: true,
          tasaPagada: true,
          documentosFirmados: true,
          tramiteIngresado: true,
          updatedAt: true,
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.tramite.count({ where: { formularioCompleto: false } }),
      // Etapa intermedia del embudo. Incluye las inscriptas a propósito: sin eso
      // el paso daría menos que el siguiente y el embudo se leería al revés.
      // (`honorariosPagados` no sirve para esto: los trámites viejos nunca lo
      // tuvieron seteado y mostraba 2 sobre 10 inscriptas.)
      prisma.tramite.count({
        where: {
          formularioCompleto: true,
          OR: [{ denominacionReservada: true }, { sociedadInscripta: true }],
        },
      }),
      // Series de tendencia: sólo las fechas, que son pocas filas.
      prisma.tramite.findMany({
        where: { formularioCompleto: true, createdAt: { gte: desde12Semanas } },
        select: { createdAt: true },
      }),
      prisma.user.findMany({
        where: { createdAt: { gte: desde12Semanas } },
        select: { createdAt: true },
      }),
      prisma.tramite.findMany({
        where: { sociedadInscripta: true, fechaInscripcion: { gte: desde12Semanas } },
        select: { fechaInscripcion: true },
      }),
    ]),
    respaldoP,
    agendaP,
  ])

  const fechasPorVencer = [
    ...serviciosPorVencer.map((s) => s.proximoVencimiento),
    ...domiciliosPorVencer.map((d) => d.fechaVencimiento),
  ].filter((f): f is Date => !!f)
  const vencidos = fechasPorVencer.filter((f) => diasHasta(f, hoyAR) < 0).length
  const leadsContactar = agendaLeads.NUEVO + agendaLeads.HOY + agendaLeads.SIN_PASO

  const serieTramites = porSemana(fechasTramites.map((t) => t.createdAt))
  const serieUsuarios = porSemana(fechasUsuarios.map((u) => u.createdAt))
  const serieInscriptas = porSemana(fechasInscripciones.map((t) => t.fechaInscripcion))

  /**
   * Bandeja de trabajo: reemplaza los dos banners condicionales y las ocho
   * tarjetas de acción rápida de ocho colores. Si el contador es cero, la
   * fila no aparece.
   */
  const bandeja: Tarea[] = [
    {
      icono: ClipboardCheck,
      cantidad: pendientesValidacion,
      titulo: 'Validar formularios nuevos',
      href: '/dashboard/admin/tramites?filter=pendientes-validacion',
      urgente: true,
    },
    {
      icono: FileText,
      cantidad: documentosPendientes,
      titulo: 'Aprobar documentos',
      href: '/dashboard/admin/tramites?filter=documentos-pendientes',
      urgente: true,
    },
    {
      icono: CalendarClock,
      cantidad: vencidos,
      titulo: vencidos === 1 ? 'Servicio o domicilio vencido' : 'Servicios o domicilios vencidos',
      href: '/dashboard/admin/sociedades?filtro=vencen',
      urgente: true,
    },
    {
      icono: Clock,
      cantidad: agendaLeads.VENCIDO,
      titulo: 'Seguimientos de leads vencidos',
      href: '/dashboard/admin/leads',
      urgente: true,
    },
    {
      icono: Mail,
      cantidad: emailsSinLeer,
      titulo: emailsSinLeer === 1 ? 'Mail sin leer' : 'Mails sin leer',
      href: '/dashboard/admin/emails',
    },
    {
      icono: UserSearch,
      cantidad: leadsContactar,
      titulo: 'Leads para contactar hoy',
      href: '/dashboard/admin/leads',
    },
    {
      icono: CalendarClock,
      cantidad: fechasPorVencer.length - vencidos,
      titulo: `Renovaciones en los próximos ${DIAS_AVISO} días`,
      href: '/dashboard/admin/sociedades?filtro=vencen',
    },
    {
      icono: Lightbulb,
      cantidad: oportunidades,
      titulo: oportunidades === 1 ? 'Cliente pidió info de un servicio' : 'Clientes pidieron info de servicios',
      href: '/dashboard/admin/sociedades?filtro=oportunidades',
    },
    {
      icono: Users,
      cantidad: esperandoCliente,
      titulo: 'Esperando al cliente',
      href: '/dashboard/admin/tramites?filter=esperando-cliente',
    },
  ].filter((t) => t.cantidad > 0)

  const totalPendiente = bandeja.reduce((acc, t) => acc + t.cantidad, 0)

  const iniciados = enProceso - esperandoCliente - pendientesValidacion

  return (
    <div className="stagger space-y-section">
      <PageHeader
        title="Lo de"
        destacado="hoy"
        description={
          totalPendiente > 0
            ? `Tenés ${totalPendiente} ${totalPendiente === 1 ? 'asunto' : 'asuntos'} para resolver.`
            : 'No hay nada pendiente de tu lado.'
        }
        actions={
          <Button asChild variant="secondary">
            <Link href="/dashboard/admin/tramites">
              Ver todos los trámites
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        }
      />

      {/* ─── Composición principal: el trabajo manda, las métricas acompañan ─ */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]">
        {/* Columna principal */}
        <section className="space-y-4">
          <SectionHeader title="Para resolver" as="h2" />

          {bandeja.length === 0 ? (
            <Card>
              <EmptyState
                icon={CheckCircle}
                title="Bandeja vacía"
                description="No hay formularios por validar, documentos por aprobar, mails sin leer, leads para hoy ni vencimientos."
              />
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <ul className="divide-y divide-line">
                {bandeja.map((tarea) => (
                  <li key={tarea.titulo}>
                    <Link
                      href={tarea.href}
                      className="group flex items-center gap-3 px-card-sm py-3.5 transition-colors hover:bg-surface-2"
                    >
                      <span
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 transition-transform duration-200 group-hover:scale-110',
                          tarea.urgente
                            ? 'bg-warning-soft text-warning ring-warning-line'
                            : 'bg-a3-soft text-a3 ring-a3-line',
                        )}
                        aria-hidden
                      >
                        <tarea.icono className="h-4.5 w-4.5" />
                      </span>

                      <span className="min-w-0 flex-1 text-body font-medium text-ink">
                        {tarea.titulo}
                      </span>

                      <span
                        className={cn(
                          'text-title tnum',
                          tarea.urgente ? 'text-warning' : 'text-ink',
                        )}
                      >
                        {tarea.cantidad}
                      </span>
                      <ArrowRight
                        className="h-4 w-4 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Movimiento reciente, denso */}
          <SectionHeader
            title="Movimiento reciente"
            as="h2"
            className="pt-2"
            actions={
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/admin/tramites">
                  Ver todos
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            }
          />

          {tramitesRecientes.length === 0 ? (
            <Card>
              <EmptyState
                icon={FileText}
                title="Todavía no hay trámites"
                description="Van a aparecer acá en cuanto los clientes envíen el formulario."
              />
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <ul className="divide-y divide-line">
                {tramitesRecientes.map((tramite) => {
                  const estado = getEstado(tramite, 'admin')
                  return (
                    <li key={tramite.id}>
                      <Link
                        href={`/dashboard/admin/tramites/${tramite.id}`}
                        className="group flex items-center gap-3 px-card-sm py-2.5 transition-colors hover:bg-surface-2"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-body font-medium text-ink">
                            {tramite.denominacionAprobada || tramite.denominacionSocial1}
                          </span>
                          <span className="block truncate text-body-sm text-ink-2">
                            {tramite.user.name}
                          </span>
                        </span>

                        <time
                          dateTime={new Date(tramite.updatedAt).toISOString()}
                          className="hidden shrink-0 text-body-sm text-ink-3 tnum sm:block"
                        >
                          {format(new Date(tramite.updatedAt), 'd MMM', { locale: es })}
                        </time>

                        <Badge tone={estado.tone} dot size="sm">
                          {estado.label}
                        </Badge>

                        <ArrowRight
                          className="h-4 w-4 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5"
                          aria-hidden
                        />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </Card>
          )}
        </section>

        {/* Columna lateral: métricas con tendencia */}
        <aside className="space-y-4">
          <SectionHeader title="Cómo viene" as="h2" />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <MetricaTendencia
              label="Trámites nuevos"
              valor={totalTramites}
              serie={serieTramites}
              tono="primary"
              href="/dashboard/admin/tramites"
              nota="últimas 12 semanas"
            />
            <MetricaTendencia
              label="Sociedades inscriptas"
              valor={completados}
              serie={serieInscriptas}
              tono="success"
              href="/dashboard/admin/sociedades"
              nota="últimas 12 semanas"
            />
            <MetricaTendencia
              label="Usuarios registrados"
              valor={totalUsuarios}
              serie={serieUsuarios}
              tono="info"
              href="/dashboard/admin/usuarios"
              nota="últimas 12 semanas"
            />
          </div>

          {/* Distribución del pipeline */}
          <Card>
            <CardBody className="space-y-4">
              <div>
                <h3 className="text-heading text-ink">Trámites por estado</h3>
                <p className="mt-0.5 text-body-sm text-ink-2">
                  {totalTramites} en total
                </p>
              </div>
              <BarraDistribucion
                tramos={[
                  {
                    label: 'Por validar',
                    valor: pendientesValidacion,
                    color: 'bg-warning-solid',
                  },
                  {
                    label: 'En proceso',
                    valor: Math.max(iniciados, 0),
                    color: 'bg-primary',
                  },
                  {
                    label: 'Esperando cliente',
                    valor: esperandoCliente,
                    color: 'bg-a5-solid',
                  },
                  { label: 'Inscriptas', valor: completados, color: 'bg-success-solid' },
                ]}
              />
            </CardBody>
          </Card>

          {/* Embudo de conversión */}
          <Card>
            <CardBody className="space-y-4">
              <div>
                <h3 className="text-heading text-ink">Del lead a la inscripción</h3>
                <p className="mt-0.5 text-body-sm text-ink-2">Conversión acumulada</p>
              </div>
              <Embudo
                pasos={[
                  { label: 'Empezaron el formulario', valor: totalBorradores + totalTramites },
                  { label: 'Lo enviaron', valor: totalTramites },
                  { label: 'Denominación reservada', valor: conDenominacion },
                  { label: 'Sociedad inscripta', valor: completados },
                ]}
              />
            </CardBody>
          </Card>
        </aside>
      </div>

      {/* ─── Servicios ────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader
          title="Servicios"
          description="Estado en vivo de las integraciones"
          as="h2"
        />
        <ServiceStatus />
        <RespaldoStatus estado={estadoRespaldo} />
      </section>
    </div>
  )
}

/* ─────────────────────────── Subcomponentes ─────────────────────────── */

/**
 * Métrica con su recorrido. Un número solo es un dato; con la tendencia al
 * lado dice si el negocio sube o baja, que es lo que uno viene a mirar.
 */
function MetricaTendencia({
  label,
  valor,
  serie,
  tono,
  href,
  nota,
}: {
  label: string
  valor: number
  serie: number[]
  tono: 'primary' | 'success' | 'info'
  href: string
  nota: string
}) {
  const cambio = variacion(serie)
  const subio = cambio !== null && cambio > 0
  const bajo = cambio !== null && cambio < 0

  return (
    <Link
      href={href}
      className={cn(
        'group block overflow-hidden rounded-card border border-line-card bg-surface shadow-card',
        'transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
        'hover:-translate-y-1 hover:border-primary-line hover:shadow-lift',
      )}
    >
      <div className="p-card pb-3">
        <p className="text-body-sm font-medium text-ink-2">{label}</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <span className="text-hero tnum leading-none text-ink">
            <NumeroAnimado valor={valor} />
          </span>
          {cambio !== null && cambio !== 0 && (
            <span
              className={cn(
                'flex items-center gap-1 text-body-sm font-semibold tnum',
                subio ? 'text-success' : 'text-ink-2',
              )}
            >
              {subio ? (
                <TrendingUp className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" aria-hidden />
              )}
              {subio ? '+' : ''}
              {cambio}%
            </span>
          )}
        </div>
        <p className="mt-1 text-label text-ink-3">{nota}</p>
      </div>
      <Sparkline datos={serie} tono={tono} alto={44} />
    </Link>
  )
}

export default AdminDashboardPage
