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
  UserSearch,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader, SectionHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/ui/stat-card'
import { EmptyState } from '@/components/ui/states'
import { ServiceStatus } from '@/components/dashboard/service-status'
import { getEstado } from '@/lib/tramites/estado'
import { cn } from '@/lib/utils'

interface Tarea {
  icono: LucideIcon
  cantidad: number
  titulo: string
  detalle: string
  href: string
  urgente?: boolean
}

async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.rol !== 'ADMIN') redirect('/dashboard')

  const [
    totalTramites,
    completados,
    enProceso,
    esperandoCliente,
    totalUsuarios,
    documentosPendientes,
    pendientesValidacion,
    tramitesRecientes,
    leadsSinContactar,
    leadsASeguir,
  ] = await Promise.all([
    // Los borradores sin enviar no son trámites: se cuentan aparte, como leads.
    prisma.tramite.count({ where: { formularioCompleto: true } }),
    prisma.tramite.count({ where: { sociedadInscripta: true } }),
    prisma.tramite.count({ where: { formularioCompleto: true, sociedadInscripta: false } }),
    prisma.tramite.count({ where: { estadoGeneral: 'ESPERANDO_CLIENTE' } }),
    prisma.user.count(),
    prisma.documento.count({ where: { estado: 'PENDIENTE' } }),
    prisma.tramite.count({
      where: { formularioCompleto: true, estadoValidacion: 'PENDIENTE_VALIDACION' },
    }),
    prisma.tramite.findMany({
      take: 6,
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
    prisma.tramite.count({
      where: {
        formularioCompleto: false,
        leadEstado: 'NUEVO',
        user: { tramites: { none: { formularioCompleto: true } } },
      },
    }),
    prisma.tramite.count({
      where: {
        formularioCompleto: false,
        leadEstado: { notIn: ['CONVERTIDO', 'DESCARTADO'] },
        leadProximoContacto: { lte: new Date() },
        user: { tramites: { none: { formularioCompleto: true } } },
      },
    }),
  ])

  /**
   * Bandeja de trabajo: reemplaza los dos banners condicionales y las ocho
   * tarjetas de acción rápida de ocho colores. Cada fila es una tarea real con
   * su enlace al filtro exacto; si el contador es cero, la fila no aparece.
   */
  const bandeja: Tarea[] = [
    {
      icono: ClipboardCheck,
      cantidad: pendientesValidacion,
      titulo: 'Validar formularios nuevos',
      detalle: 'Trámites enviados que esperan tu revisión inicial',
      href: '/dashboard/admin/tramites?filter=pendientes-validacion',
      urgente: true,
    },
    {
      icono: FileText,
      cantidad: documentosPendientes,
      titulo: 'Aprobar documentos',
      detalle: 'Documentos y comprobantes subidos por clientes',
      href: '/dashboard/admin/tramites?filter=documentos-pendientes',
      urgente: true,
    },
    {
      icono: UserSearch,
      cantidad: leadsSinContactar,
      titulo: 'Contactar leads nuevos',
      detalle: 'Empezaron el formulario y no lo terminaron',
      href: '/dashboard/admin/leads',
    },
    {
      icono: Clock,
      cantidad: leadsASeguir,
      titulo: 'Seguimientos vencidos',
      detalle: 'Leads con la fecha de próximo contacto ya pasada',
      href: '/dashboard/admin/leads',
    },
    {
      icono: Users,
      cantidad: esperandoCliente,
      titulo: 'Esperando al cliente',
      detalle: 'Trámites frenados por una acción del cliente',
      href: '/dashboard/admin/tramites?filter=esperando-cliente',
    },
  ].filter((t) => t.cantidad > 0)

  const totalPendiente = bandeja.reduce((acc, t) => acc + t.cantidad, 0)

  return (
    <div className="space-y-section">
      <PageHeader
        title="Hoy"
        description={
          totalPendiente > 0
            ? `Tenés ${totalPendiente} ${totalPendiente === 1 ? 'asunto' : 'asuntos'} para resolver.`
            : 'No hay nada pendiente de tu lado. Buen momento para revisar métricas.'
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

      {/* ─── Bandeja de trabajo ───────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader title="Para resolver" as="h2" />
        {bandeja.length === 0 ? (
          <Card>
            <EmptyState
              icon={CheckCircle}
              title="Bandeja vacía"
              description="No hay formularios por validar, documentos por aprobar ni leads sin contactar."
            />
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y divide-line">
              {bandeja.map((tarea) => (
                <li key={tarea.titulo}>
                  <Link
                    href={tarea.href}
                    className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2"
                  >
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-control',
                        tarea.urgente
                          ? 'bg-warning-solid/12 text-warning'
                          : 'bg-surface-3 text-ink-2',
                      )}
                      aria-hidden
                    >
                      <tarea.icono className="h-4.5 w-4.5" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-body font-medium text-ink">{tarea.titulo}</span>
                      <span className="block truncate text-body-sm text-ink-2">
                        {tarea.detalle}
                      </span>
                    </span>

                    <Badge tone={tarea.urgente ? 'warning' : 'neutral'}>
                      <span className="tnum">{tarea.cantidad}</span>
                    </Badge>
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
      </section>

      {/* ─── Métricas ─────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader title="Estado general" as="h2" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Trámites activos"
            value={enProceso}
            hint="Sin inscribir"
            icon={Clock}
            href="/dashboard/admin/tramites"
          />
          <StatCard
            label="Sociedades inscriptas"
            value={completados}
            hint="Finalizadas"
            icon={CheckCircle}
            href="/dashboard/admin/sociedades"
          />
          <StatCard
            label="Trámites totales"
            value={totalTramites}
            hint="Formulario enviado"
            icon={FileText}
          />
          <StatCard
            label="Usuarios registrados"
            value={totalUsuarios}
            hint="Cuentas"
            icon={Users}
            href="/dashboard/admin/usuarios"
          />
        </div>
      </section>

      {/* ─── Movimiento reciente ──────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader
          title="Movimiento reciente"
          description="Últimos trámites con actividad"
          as="h2"
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
                      className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-body font-medium text-ink">
                          {tramite.denominacionAprobada || tramite.denominacionSocial1}
                        </span>
                        <span className="block truncate text-body-sm text-ink-2">
                          {tramite.user.name}
                          <span className="mx-1.5 text-ink-3" aria-hidden>·</span>
                          {tramite.user.email}
                        </span>
                      </span>

                      <time
                        dateTime={new Date(tramite.updatedAt).toISOString()}
                        className="hidden shrink-0 text-body-sm text-ink-3 tnum sm:block"
                      >
                        {format(new Date(tramite.updatedAt), 'd MMM', { locale: es })}
                      </time>

                      <Badge tone={estado.tone} dot>
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

      {/* ─── Servicios ────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader
          title="Servicios"
          description="Estado en vivo de las integraciones"
          as="h2"
        />
        <ServiceStatus />
      </section>
    </div>
  )
}

export default AdminDashboardPage
