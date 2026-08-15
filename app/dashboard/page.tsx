import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import {
  ArrowRight,
  Bell,
  BookOpen,
  Building2,
  Check,
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
import { calcularProgreso, detalleEtapas, etapaActual, getEstado } from '@/lib/tramites/estado'
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
    <div className="stagger space-y-section">
      <PageHeader
        title="Hola,"
        destacado={primerNombre}
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
          etapas={detalleEtapas(foco)}
          progreso={calcularProgreso(foco)}
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
            acento="a2"
            icon={Building2}
            titulo="Mi sociedad"
            detalle="Datos y documentos"
          />
          <Acceso
            href="/dashboard/libros-digitales"
            acento="a3"
            icon={BookOpen}
            titulo="Libros digitales"
            detalle="Cómo llevarlos"
          />
          <Acceso
            href="/dashboard/documentos"
            acento="a4"
            icon={Upload}
            titulo="Documentos"
            detalle="Subir y consultar"
          />
          <Acceso
            href="/dashboard/notificaciones"
            acento="a5"
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
            acento="a6"
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
  etapas,
  progreso,
  otrosPendientes,
}: {
  accion: ReturnType<typeof accionPrincipal> & object
  tramiteId: string
  formularioCompleto: boolean
  etapas: ReturnType<typeof detalleEtapas>
  progreso: number
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
      className={cn('brand-glow', !esCliente && !esCompletado && 'bg-surface')}
    >
      <CardBody className="flex flex-col gap-6 p-card sm:p-8 lg:flex-row lg:items-start">
        {/* Círculo de color con anillo, como los nodos del "Cómo funciona" */}
        <div className="flex flex-1 flex-col gap-5 sm:flex-row sm:items-start">
        <span
          className={cn(
            'flex h-16 w-16 shrink-0 items-center justify-center rounded-full ring-8',
            esCliente
              ? 'bg-warning-solid text-on-primary ring-warning-soft'
              : esCompletado
                ? 'bg-success-solid text-on-primary ring-success-soft'
                : 'bg-primary text-on-primary ring-primary-soft',
          )}
          aria-hidden
        >
          <Icono className="h-7 w-7" />
        </span>

        <div className="min-w-0 flex-1">
          <span
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-label font-semibold',
              esCliente
                ? 'border-warning-line bg-warning-soft text-warning'
                : esCompletado
                  ? 'border-success-line bg-success-soft text-success'
                  : 'border-primary-line bg-primary-soft text-primary',
            )}
          >
            <span className="relative flex h-2 w-2" aria-hidden>
              {esCliente && (
                <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-warning-solid opacity-75" />
              )}
              <span
                className={cn(
                  'relative inline-flex h-2 w-2 rounded-full',
                  esCliente
                    ? 'bg-warning-solid'
                    : esCompletado
                      ? 'bg-success-solid'
                      : 'bg-primary',
                )}
              />
            </span>
            {esCliente ? 'Te toca a vos' : esCompletado ? 'Listo' : 'En curso'}
          </span>

          <h2 className="mt-3 text-hero text-ink text-balance">{accion.titulo}</h2>
          <p className="mt-2 max-w-prose text-body text-ink-2 text-pretty">
            {accion.descripcion}
          </p>

          {otrosPendientes > 0 && (
            <p className="mt-2 text-body-sm text-ink-2">
              Además tenés {otrosPendientes}{' '}
              {otrosPendientes === 1 ? 'paso pendiente' : 'pasos pendientes'} en el trámite.
            </p>
          )}

          <div className="mt-5">
            <Button asChild size="lg">
              <Link href={destino}>
                {!formularioCompleto
                  ? 'Continuar el formulario'
                  : (accion.accion ?? 'Ver el trámite')}
                <ArrowRight className="h-4.5 w-4.5" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
        </div>

        {/* Las 7 etapas, para que el bloque diga además dónde estás parado.
            Ocupaba un vacío grande a la derecha. */}
        <div className="shrink-0 lg:w-56">
          <div className="rounded-card border border-line bg-surface/70 p-4 backdrop-blur-sm">
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-label font-semibold text-ink-2">Tu trámite</span>
              <span className="text-body font-bold text-primary tnum">{progreso}%</span>
            </div>
            <ol className="space-y-2">
              {etapas.map((etapa) => (
                <li key={etapa.key} className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                      etapa.completada
                        ? 'bg-success-solid text-on-primary'
                        : etapa.actual
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-3',
                    )}
                    aria-hidden
                  >
                    {etapa.completada && <Check className="h-2.5 w-2.5" strokeWidth={3.5} />}
                    {etapa.actual && !etapa.completada && (
                      <span className="h-1.5 w-1.5 rounded-full bg-on-primary" />
                    )}
                  </span>
                  <span
                    className={cn(
                      'truncate text-body-sm',
                      etapa.completada
                        ? 'text-ink-2'
                        : etapa.actual
                          ? 'font-semibold text-ink'
                          : 'text-ink-3',
                    )}
                  >
                    {etapa.label}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

/**
 * Cada destino tiene su acento fijo (a1…a6). Es la vuelta del color que el
 * panel había perdido, pero asignado, no al azar: los seis tonos salen de la
 * misma escalera de luminosidad que la marca.
 */
const ACENTOS = {
  a1: 'bg-a1-soft text-a1',
  a2: 'bg-a2-soft text-a2',
  a3: 'bg-a3-soft text-a3',
  a4: 'bg-a4-soft text-a4',
  a5: 'bg-a5-soft text-a5',
  a6: 'bg-a6-soft text-a6',
} as const

function Acceso({
  href,
  icon: Icon,
  titulo,
  detalle,
  acento,
  destacado = false,
}: {
  href: string
  icon: LucideIcon
  titulo: string
  detalle: string
  acento: keyof typeof ACENTOS
  destacado?: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-3.5 rounded-card border border-line bg-surface p-card-sm shadow-card',
        'transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
        'hover:-translate-y-1 hover:border-primary-line hover:shadow-lift',
      )}
    >
      <span
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110',
          ACENTOS[acento],
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body font-semibold text-ink">{titulo}</span>
        <span
          className={cn(
            'block truncate text-body-sm',
            destacado ? 'font-semibold text-warning' : 'text-ink-2',
          )}
        >
          {detalle}
        </span>
      </span>
      <ArrowRight
        className="h-4 w-4 shrink-0 text-ink-3 transition-all duration-200 group-hover:translate-x-1 group-hover:text-primary"
        aria-hidden
      />
    </Link>
  )
}

export default DashboardPage
