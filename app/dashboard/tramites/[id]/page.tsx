import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Building2, Calendar, CheckCircle, Download, FileText, User, Users } from 'lucide-react'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getObjetoSocialTexto } from '@/lib/constants'
import { getEstado } from '@/lib/tramites/estado'

import { PageHeader, SectionHeader } from '@/components/ui/page-header'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataList, DataItem } from '@/components/ui/data-list'
import { CollapsibleSection } from '@/components/ui/collapsible-section'

import EnlacesPagoCliente from '@/components/cliente/EnlacesPagoCliente'
import HonorariosPagoCliente from '@/components/cliente/HonorariosPagoCliente'
import ProximosPasos from '@/components/cliente/ProximosPasos'
import TimelineProgreso from '@/components/cliente/TimelineProgreso'
import MensajesDelEquipo from '@/components/cliente/MensajesDelEquipo'
import DocumentosParaFirmar from '@/components/cliente/DocumentosParaFirmar'
import DepositoCapitalCliente from '@/components/cliente/DepositoCapitalCliente'
import ChatBox from '@/components/chat/ChatBox'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ payment?: string }>
}

/** Aviso al volver de Mercado Pago. */
const AVISOS_PAGO = {
  failure: {
    tone: 'danger' as const,
    titulo: 'Tu pago no se completó',
    texto:
      'El pago con Mercado Pago no pudo procesarse. Podés intentar de nuevo con la misma tarjeta, con otra o con otro medio de pago, desde el bloque de pago más abajo.',
  },
  pending: {
    tone: 'warning' as const,
    titulo: 'Tu pago está en proceso',
    texto:
      'Mercado Pago lo está procesando. Te avisamos apenas se confirme; no hace falta que lo hagas de nuevo.',
  },
  success: {
    tone: 'success' as const,
    titulo: '¡Pago recibido!',
    texto:
      'Estamos confirmando el pago con Mercado Pago. En cuanto se acredite vas a ver la etapa completada.',
  },
}

async function TramiteDetallePage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const { id } = await params
  const paymentStatus = (await searchParams)?.payment

  const tramite = await prisma.tramite.findFirst({
    where: { id, userId: session.user.id },
    include: {
      enlacesPago: { orderBy: { createdAt: 'desc' } },
      pagos: { orderBy: { createdAt: 'desc' } },
      documentos: { orderBy: { createdAt: 'desc' } },
      notificaciones: { orderBy: { createdAt: 'desc' }, take: 10 },
      mensajes: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!tramite) notFound()

  const socios = (tramite.socios as any[]) || []
  const administradores = (tramite.administradores as any[]) || []
  const datosUsuario = (tramite.datosUsuario as any) || {}
  const estado = getEstado(tramite, 'cliente')
  const nombre = tramite.denominacionAprobada || tramite.denominacionSocial1

  const aviso = paymentStatus ? AVISOS_PAGO[paymentStatus as keyof typeof AVISOS_PAGO] : undefined

  const resolucion = tramite.documentos.find(
    (d: any) => d.tipo === 'RESOLUCION_FINAL' && d.estado === 'APROBADO',
  )

  return (
    <div className="stagger space-y-section">
      <PageHeader
        title={nombre}
        breadcrumbs={[
          { label: 'Mis trámites', href: '/dashboard/tramites' },
          { label: nombre },
        ]}
        badge={<Badge tone={estado.tone} dot>{estado.label}</Badge>}
        description={`${tramite.jurisdiccion === 'CORDOBA' ? 'Córdoba (IPJ)' : 'CABA (IGJ)'} · Plan ${tramite.plan}`}
      />

      {aviso && (
        <Card tone={aviso.tone}>
          <CardBody padding="compact">
            <p className="text-body font-medium text-ink">{aviso.titulo}</p>
            <p className="mt-0.5 text-body-sm text-ink-2 text-pretty">{aviso.texto}</p>
          </CardBody>
        </Card>
      )}

      {/* Sociedad inscripta: los datos oficiales van primero */}
      {(tramite.cuit || tramite.matricula || tramite.numeroResolucion) && (
        <Card tone="success">
          <CardBody className="space-y-4">
            <div className="flex items-start gap-3">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-success-solid/12 text-success"
                aria-hidden
              >
                <CheckCircle className="h-4.5 w-4.5" />
              </span>
              <div>
                <h2 className="text-title text-ink">Tu sociedad está inscripta</h2>
                <p className="mt-0.5 text-body text-ink-2">
                  Estos son los datos oficiales. Ya podés empezar a operar.
                </p>
              </div>
            </div>

            <DataList columns={3}>
              {tramite.cuit && <DataItem label="CUIT" value={tramite.cuit} mono />}
              {tramite.matricula && (
                <DataItem label="Matrícula" value={tramite.matricula} mono />
              )}
              {tramite.fechaInscripcion && (
                <DataItem
                  label="Fecha de inscripción"
                  value={format(new Date(tramite.fechaInscripcion), 'dd/MM/yyyy')}
                  icon={Calendar}
                />
              )}
              {tramite.numeroResolucion && (
                <DataItem label="Resolución" value={tramite.numeroResolucion} mono />
              )}
            </DataList>

            {resolucion && (
              <Button asChild variant="secondary">
                <a
                  href={`/api/documentos/${resolucion.id}/view?download=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="h-4 w-4" aria-hidden />
                  Descargar la resolución de inscripción
                </a>
              </Button>
            )}
          </CardBody>
        </Card>
      )}

      {/* Columna principal + resumen lateral */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-section">
          <ProximosPasos
            tramite={tramite}
            pagos={tramite.pagos || []}
            enlacesPago={tramite.enlacesPago || []}
            documentos={tramite.documentos || []}
            notificaciones={tramite.notificaciones || []}
          />

          {/* Bloques de acción: cada uno se oculta solo si no aplica */}
          <div className="space-y-4">
            <HonorariosPagoCliente pagos={tramite.pagos || []} />
            <EnlacesPagoCliente enlaces={tramite.enlacesPago || []} />
            <DepositoCapitalCliente
              tramiteId={tramite.id}
              capitalSocial={tramite.capitalSocial}
              documentos={tramite.documentos || []}
              notificaciones={tramite.notificaciones || []}
            />
            {tramite.documentos?.some((d: any) =>
              ['ESTATUTO_PARA_FIRMAR', 'ACTA_PARA_FIRMAR', 'DOCUMENTO_PARA_FIRMAR'].includes(
                d.tipo ?? '',
              ),
            ) && (
              <DocumentosParaFirmar
                tramiteId={tramite.id}
                documentos={tramite.documentos || []}
              />
            )}
            {tramite.notificaciones?.length > 0 && (
              <MensajesDelEquipo notificaciones={tramite.notificaciones} />
            )}
          </div>

          <section className="space-y-4">
            <SectionHeader
              title="Hablá con el equipo"
              description="Cualquier duda sobre el trámite, escribinos por acá."
            />
            <ChatBox tramiteId={tramite.id} mensajesIniciales={tramite.mensajes} />
          </section>
        </div>

        {/* Lateral: dónde está el trámite */}
        <aside className="min-w-0 space-y-4 xl:sticky xl:top-24 xl:self-start">
          <SectionHeader title="Progreso" as="h2" />
          <TimelineProgreso tramite={tramite} />
        </aside>
      </div>

      {/* Datos del trámite: consulta, no acción → al final y plegado */}
      <section className="space-y-4">
        <SectionHeader
          title="Datos del trámite"
          description="Todo lo que cargaste en el formulario."
        />

        <div className="space-y-3">
          <CollapsibleSection
            title="Información general"
            icon={<FileText className="h-4 w-4" />}
            defaultOpen
            padding="default"
          >
            <DataList columns={4}>
              <DataItem
                label="Fecha de inicio"
                value={format(new Date(tramite.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
              />
              <DataItem
                label="Jurisdicción"
                value={tramite.jurisdiccion === 'CORDOBA' ? 'Córdoba (IPJ)' : 'CABA (IGJ)'}
                icon={Building2}
              />
              <DataItem label="Plan contratado" value={tramite.plan} />
              <DataItem
                label="Capital social"
                value={`$${tramite.capitalSocial.toLocaleString('es-AR')}`}
              />
              {datosUsuario.fechaCierre && (
                <DataItem
                  label="Cierre de ejercicio"
                  value={datosUsuario.fechaCierre}
                  icon={Calendar}
                />
              )}
            </DataList>
          </CollapsibleSection>

          <CollapsibleSection
            title="Denominación"
            summary={tramite.denominacionAprobada ? 'Aprobada' : '3 opciones'}
            padding="default"
          >
            <div className="space-y-2">
              {tramite.denominacionAprobada && (
                <div className="rounded-control border border-success-line bg-success-soft p-3">
                  <p className="text-label text-success">Denominación aprobada</p>
                  <p className="mt-0.5 text-body font-medium text-ink">
                    {tramite.denominacionAprobada}
                  </p>
                </div>
              )}
              {[tramite.denominacionSocial1, tramite.denominacionSocial2, tramite.denominacionSocial3]
                .filter(Boolean)
                .map((den, i) => (
                  <div key={den} className="rounded-control border border-line bg-surface-2 p-3">
                    <p className="text-label text-ink-2">
                      Opción {i + 1}
                      {i === 0 && ' (preferida)'}
                    </p>
                    <p className="mt-0.5 text-body text-ink">{den}</p>
                  </div>
                ))}
            </div>
          </CollapsibleSection>

          <div className="grid gap-3 md:grid-cols-2">
            <CollapsibleSection title="Objeto social" padding="default">
              <p className="whitespace-pre-line text-body-sm text-ink-2">
                {getObjetoSocialTexto(tramite.objetoSocial)}
              </p>
            </CollapsibleSection>

            <CollapsibleSection title="Domicilio legal" padding="default">
              <p className="text-body-sm text-ink-2">{tramite.domicilioLegal}</p>
            </CollapsibleSection>
          </div>

          <CollapsibleSection
            title="Socios y accionistas"
            icon={<Users className="h-4 w-4" />}
            summary={`${socios.length} ${socios.length === 1 ? 'socio' : 'socios'}`}
            padding="default"
          >
            <div className="space-y-3">
              {socios.map((socio: any, i: number) => (
                <PersonaCard
                  key={i}
                  persona={socio}
                  capitalSocial={tramite.capitalSocial}
                  mostrarAporte
                />
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Órgano de administración"
            icon={<User className="h-4 w-4" />}
            summary={`${administradores.length} ${administradores.length === 1 ? 'persona' : 'personas'}`}
            padding="default"
          >
            <div className="space-y-3">
              {administradores.map((admin: any, i: number) => (
                <PersonaCard key={i} persona={admin} />
              ))}
            </div>
          </CollapsibleSection>
        </div>
      </section>
    </div>
  )
}

/* ── Ficha de socio / administrador ──────────────────────────────────── */

function PersonaCard({
  persona,
  capitalSocial,
  mostrarAporte = false,
}: {
  persona: any
  capitalSocial?: number
  mostrarAporte?: boolean
}) {
  const domicilio =
    [persona.domicilio, persona.ciudad, persona.departamento, persona.provincia]
      .filter(Boolean)
      .join(' · ') || 'No especificado'

  const { aporte, porcentaje } = mostrarAporte
    ? normalizarAporte(persona, capitalSocial ?? 0)
    : { aporte: 0, porcentaje: 0 }

  return (
    <div className="rounded-control border border-line bg-surface-2 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-body font-medium text-ink">
            {persona.nombre} {persona.apellido}
          </p>
          <p className="text-body-sm text-ink-2 tnum">
            DNI {persona.dni}
            {persona.cuit && (
              <>
                <span className="mx-1.5 text-ink-3" aria-hidden>·</span>
                CUIT {persona.cuit}
              </>
            )}
          </p>
        </div>

        {mostrarAporte ? (
          <div className="text-right">
            <p className="text-body font-medium text-ink tnum">
              ${Math.round(aporte).toLocaleString('es-AR')}
            </p>
            <p className="text-label text-ink-2 tnum">{porcentaje.toFixed(2)}%</p>
          </div>
        ) : persona.cargo ? (
          <Badge tone="info">{persona.cargo}</Badge>
        ) : null}
      </div>

      <DataList columns={3} className="mt-3">
        <DataItem label="Domicilio" value={domicilio} />
        <DataItem label="Estado civil" value={persona.estadoCivil} />
        <DataItem label="Profesión" value={persona.profesion} />
      </DataList>
    </div>
  )
}

/**
 * Los aportes vienen del formulario en formatos mezclados (número, string con
 * puntos o comas, porcentaje guardado ×100). Esto los normaliza.
 */
function normalizarAporte(socio: any, capitalSocial: number) {
  let aporte =
    typeof socio.aporteCapital === 'number'
      ? socio.aporteCapital
      : parseFloat(String(socio.aporteCapital ?? '').replace(/\./g, '').replace(',', '.')) || 0

  let porcentaje = capitalSocial > 0 ? (aporte / capitalSocial) * 100 : 0

  if (porcentaje > 100 || aporte > capitalSocial * 1.1) {
    let guardado =
      parseFloat(
        String(socio.aportePorcentaje ?? socio.porcentaje ?? '')
          .replace('%', '')
          .replace(',', '.'),
      ) || 0

    if (guardado > 100 && guardado <= 10_000) guardado /= 100

    if (guardado > 0 && guardado <= 100) {
      aporte = (capitalSocial * guardado) / 100
      porcentaje = guardado
    } else if (aporte > capitalSocial && aporte / 100 <= capitalSocial) {
      aporte /= 100
      porcentaje = capitalSocial > 0 ? (aporte / capitalSocial) * 100 : 0
    }
  }

  return { aporte, porcentaje }
}

export default TramiteDetallePage
