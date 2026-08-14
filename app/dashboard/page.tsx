import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import {
  ArrowRight,
  Bell,
  BookOpen,
  Building2,
  CheckCircle,
  Clock,
  CreditCard,
  FileSignature,
  FileText,
  Handshake,
  IdCard,
  Landmark,
  Plus,
  Search,
  Upload,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader, SectionHeader } from '@/components/ui/page-header'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LabeledProgress } from '@/components/ui/progress'
import { EmptyState } from '@/components/ui/states'
import { calcularProgreso, etapaActual, getEstado } from '@/lib/tramites/estado'
import { calcularAcciones, accionPrincipal, type IconoAccion } from '@/lib/tramites/acciones'
import { cn } from '@/lib/utils'

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

async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  // Los admin no inician trámites: van directo a su panel.
  if (session.user.rol === 'ADMIN') redirect('/dashboard/admin')

  const todosTramites = await prisma.tramite.findMany({
    where: { userId: session.user.id },
    include: {
      pagos: { where: { estado: 'PENDIENTE' }, select: { id: true, monto: true, concepto: true, estado: true, mercadoPagoLink: true } },
      enlacesPago: { where: { estado: 'PENDIENTE' }, select: { id: true, monto: true, concepto: true, estado: true, reportadoVencido: true } },
      documentos: { select: { id: true, nombre: true, tipo: true, estado: true, descripcion: true } },
      notificaciones: {
        where: { leida: false },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, titulo: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  // Deduplicar borrador + trámite enviado con la misma denominación.
  const porDenominacion = new Map<string, (typeof todosTramites)[number]>()
  for (const tramite of todosTramites) {
    const clave = tramite.denominacionSocial1
    const existente = porDenominacion.get(clave)
    if (!existente) {
      porDenominacion.set(clave, tramite)
    } else if (tramite.formularioCompleto && !existente.formularioCompleto) {
      porDenominacion.set(clave, tramite)
    } else if (tramite.createdAt > existente.createdAt) {
      porDenominacion.set(clave, tramite)
    }
  }

  const tramites = Array.from(porDenominacion.values()).slice(0, 10)
  const activos = tramites.filter((t) => !t.sociedadInscripta)
  const sociedades = tramites.filter((t) => t.sociedadInscripta)

  const notificacionesNoLeidas = await prisma.notificacion.count({
    where: { userId: session.user.id, leida: false },
  })

  const primerNombre = session.user.name?.split(' ')[0] || 'Hola'

  // El trámite en curso más reciente define el bloque protagonista.
  const foco = activos[0] ?? tramites[0]
  const acciones = foco
    ? calcularAcciones({
        tramite: foco,
        pagos: foco.pagos,
        enlacesPago: foco.enlacesPago,
        documentos: foco.documentos,
        notificaciones: foco.notificaciones,
      })
    : []
  const proxima = accionPrincipal(acciones)

  return (
    <div className="space-y-section">
      <PageHeader
        title={`Hola, ${primerNombre}`}
        description={
          tramites.length === 0
            ? 'Constituí tu S.A.S. 100% online. Te guiamos paso a paso.'
            : 'Esto es lo que está pasando con tus trámites.'
        }
        actions={
          tramites.length > 0 ? (
            <Button asChild variant="secondary">
              <Link href="/tramite/nuevo">
                <Plus className="h-4 w-4" aria-hidden />
                Nuevo trámite
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* ─── Sin trámites ─────────────────────────────────────────────── */}
      {tramites.length === 0 && (
        <Card>
          <EmptyState
            icon={FileText}
            title="Todavía no empezaste ningún trámite"
            description="Constituí tu Sociedad por Acciones Simplificada en pocos pasos. Podés guardar y seguir después."
            action={
              <Button asChild size="lg">
                <Link href="/tramite/nuevo">
                  <Plus className="h-5 w-5" aria-hidden />
                  Empezar mi trámite
                </Link>
              </Button>
            }
          />
        </Card>
      )}

      {/* ─── Tu próximo paso: lo primero que ve el cliente ────────────── */}
      {foco && proxima && (
        <ProximoPaso
          accion={proxima}
          tramiteId={foco.id}
          formularioCompleto={foco.formularioCompleto}
          otrosPendientes={acciones.filter(
            (a) => a.responsable === 'cliente' && a.tipo !== proxima.tipo,
          ).length}
        />
      )}

      {/* ─── Trámites en curso ────────────────────────────────────────── */}
      {activos.length > 0 && (
        <section className="space-y-4">
          <SectionHeader
            title={activos.length === 1 ? 'Tu trámite' : 'Tus trámites en curso'}
            description={
              tramites.length > activos.length
                ? `${activos.length} en curso · ${sociedades.length} ${sociedades.length === 1 ? 'inscripta' : 'inscriptas'}`
                : undefined
            }
            actions={
              tramites.length > 1 ? (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard/tramites">
                    Ver todos
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              ) : undefined
            }
          />

          <div className="space-y-3">
            {activos.slice(0, 3).map((tramite) => {
              const estado = getEstado(tramite, 'cliente')
              const progreso = calcularProgreso(tramite)
              const href = tramite.formularioCompleto
                ? `/dashboard/tramites/${tramite.id}`
                : `/tramite/nuevo?tramiteId=${tramite.id}`

              return (
                <Link key={tramite.id} href={href} className="block rounded-card">
                  <Card interactive>
                    <CardBody className="space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-heading text-ink">
                            {tramite.denominacionAprobada || tramite.denominacionSocial1}
                          </h3>
                          <p className="mt-0.5 text-body-sm text-ink-2">
                            {tramite.jurisdiccion === 'CORDOBA' ? 'Córdoba (IPJ)' : 'CABA (IGJ)'}
                            <span className="mx-1.5 text-ink-3" aria-hidden>·</span>
                            Plan {tramite.plan}
                          </p>
                        </div>
                        <Badge tone={estado.tone} dot>
                          {estado.label}
                        </Badge>
                      </div>

                      <LabeledProgress
                        value={progreso}
                        caption={etapaActual(tramite, 'cliente')}
                      />
                    </CardBody>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* ─── Sociedades inscriptas ────────────────────────────────────── */}
      {sociedades.length > 0 && (
        <section className="space-y-4">
          <SectionHeader
            title={sociedades.length === 1 ? 'Tu sociedad' : 'Tus sociedades'}
            description="Ya inscriptas y operativas."
          />
          <div className="space-y-3">
            {sociedades.slice(0, 3).map((soc) => (
              <Card key={soc.id} tone="success">
                <CardBody className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-success-solid/12 text-success">
                      <Building2 className="h-4.5 w-4.5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-heading text-ink">
                        {soc.denominacionAprobada || soc.denominacionSocial1}
                      </h3>
                      <p className="text-body-sm text-ink-2 tnum">
                        {soc.cuit ? `CUIT ${soc.cuit}` : 'CUIT pendiente'}
                        {soc.matricula && (
                          <>
                            <span className="mx-1.5 text-ink-3" aria-hidden>·</span>
                            Matrícula {soc.matricula}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button asChild variant="secondary" size="sm">
                    <Link href="/dashboard/mi-sociedad">
                      Ver legajo
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ─── Accesos: fila compacta, no seis tarjetas de colores ──────── */}
      <section className="space-y-4">
        <SectionHeader title="Accesos" as="h2" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Acceso
            href="/dashboard/mi-sociedad"
            icon={Building2}
            titulo="Mi sociedad"
            detalle="Datos y documentos"
          />
          <Acceso
            href="/dashboard/libros-digitales"
            icon={BookOpen}
            titulo="Libros digitales"
            detalle="Cómo llevarlos"
          />
          <Acceso
            href="/dashboard/documentos"
            icon={Upload}
            titulo="Documentos"
            detalle="Subir y consultar"
          />
          <Acceso
            href="/dashboard/notificaciones"
            icon={Bell}
            titulo="Notificaciones"
            detalle={
              notificacionesNoLeidas > 0
                ? `${notificacionesNoLeidas} sin leer`
                : 'Al día'
            }
            destacado={notificacionesNoLeidas > 0}
          />
          <Acceso
            href="/dashboard/servicios"
            icon={Handshake}
            titulo="Servicios"
            detalle="Para tu empresa"
          />
        </div>
      </section>
    </div>
  )
}

/* ─────────────────────────── Subcomponentes ─────────────────────────── */

function ProximoPaso({
  accion,
  tramiteId,
  formularioCompleto,
  otrosPendientes,
}: {
  accion: ReturnType<typeof accionPrincipal> & object
  tramiteId: string
  formularioCompleto: boolean
  otrosPendientes: number
}) {
  const Icono = ICONOS[accion.icono]
  const esCliente = accion.responsable === 'cliente'
  const esCompletado = accion.responsable === 'ninguno'

  const destino = !formularioCompleto
    ? `/tramite/nuevo?tramiteId=${tramiteId}`
    : accion.link && !accion.link.startsWith('#')
      ? accion.link
      : `/dashboard/tramites/${tramiteId}${accion.link ?? ''}`

  return (
    <Card
      tone={esCliente ? 'warning' : esCompletado ? 'success' : 'default'}
      className={cn(!esCliente && !esCompletado && 'bg-surface')}
    >
      <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <span
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-card',
            esCliente
              ? 'bg-warning-solid/12 text-warning'
              : esCompletado
                ? 'bg-success-solid/12 text-success'
                : 'bg-surface-3 text-ink-2',
          )}
          aria-hidden
        >
          <Icono className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-label uppercase tracking-wide text-ink-2">
            {esCliente ? 'Te toca a vos' : esCompletado ? 'Listo' : 'En curso'}
          </p>
          <h2 className="mt-0.5 text-title text-ink text-balance">{accion.titulo}</h2>
          <p className="mt-1 text-body text-ink-2 text-pretty">{accion.descripcion}</p>

          {otrosPendientes > 0 && (
            <p className="mt-2 text-body-sm text-ink-2">
              Además tenés {otrosPendientes}{' '}
              {otrosPendientes === 1 ? 'paso pendiente' : 'pasos pendientes'} en el trámite.
            </p>
          )}

          <div className="mt-4">
            <Button asChild>
              <Link href={destino}>
                {!formularioCompleto
                  ? 'Continuar el formulario'
                  : (accion.accion ?? 'Ver el trámite')}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

function Acceso({
  href,
  icon: Icon,
  titulo,
  detalle,
  destacado = false,
}: {
  href: string
  icon: LucideIcon
  titulo: string
  detalle: string
  destacado?: boolean
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-card border border-line bg-surface p-card-sm transition-[border-color,box-shadow] duration-150 hover:border-line-strong hover:shadow-raise"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-surface-3 text-ink-2 transition-colors group-hover:bg-primary-soft group-hover:text-primary">
        <Icon className="h-4.5 w-4.5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body font-medium text-ink">{titulo}</span>
        <span
          className={cn(
            'block truncate text-body-sm',
            destacado ? 'text-warning font-medium' : 'text-ink-2',
          )}
        >
          {detalle}
        </span>
      </span>
      <ArrowRight
        className="h-4 w-4 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  )
}

export default DashboardPage
