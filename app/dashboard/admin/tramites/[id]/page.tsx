import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  FileText,
  Mail,
  MapPin,
  Phone,
  Tag,
  User,
  Users,
} from 'lucide-react'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getObjetoSocialTexto } from '@/lib/constants'
import { calcularProgreso, etapaActual, getEstado } from '@/lib/tramites/estado'

import { Card, CardBody } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { DataList, DataItem } from '@/components/ui/data-list'
import { SectionHeader } from '@/components/ui/page-header'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { TabNav, type Tab } from '@/components/ui/tab-nav'

import EditarCBU from '@/components/admin/EditarCBU'
import SolicitarCBUButton from '@/components/admin/SolicitarCBUButton'
import EstadoManager from '@/components/admin/EstadoManager'
import DatosFinalesForm from '@/components/admin/DatosFinalesForm'
import DocumentosReview from '@/components/admin/DocumentosReview'
import ObservacionesForm from '@/components/admin/ObservacionesForm'
import EtapasManager from '@/components/admin/EtapasManager'
import EmailsTramite from '@/components/admin/EmailsTramite'
import DenominacionSelector from '@/components/admin/DenominacionSelector'
import PagosControl from '@/components/admin/PagosControl'
import EnlacesPagoExterno from '@/components/admin/EnlacesPagoExterno'
import HonorariosMercadoPago from '@/components/admin/HonorariosMercadoPago'
import SubirDocumentosParaCliente from '@/components/admin/SubirDocumentosParaCliente'
import SubirBorrador from '@/components/admin/SubirBorrador'
import ChatBox from '@/components/chat/ChatBox'
import ComprobantesReview from '@/components/admin/ComprobantesReview'
import CuentaCapital from '@/components/admin/CuentaCapital'
import ValidacionTramite from '@/components/admin/ValidacionTramite'
import ReportingPagos from '@/components/admin/ReportingPagos'
import EliminarTramite from '@/components/admin/EliminarTramite'
import {
  EditDenominaciones,
  EditObjetoSocial,
  EditDomicilio,
  EditInfoGeneral,
  EditSocios,
  EditAdministradores,
} from '@/components/admin/EditableSections'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ tab?: string }>
}

const TABS = ['gestion', 'pagos', 'documentos', 'comunicacion', 'datos', 'cierre'] as const
type TabId = (typeof TABS)[number]

async function AdminTramiteDetallePage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.rol !== 'ADMIN') redirect('/dashboard')

  const { id } = await params
  const tabParam = (await searchParams)?.tab
  const tab: TabId = TABS.includes(tabParam as TabId) ? (tabParam as TabId) : 'gestion'

  const tramite = await prisma.tramite.findUnique({
    where: { id },
    include: {
      user: true,
      documentos: {
        include: { user: { select: { id: true, rol: true } } },
        orderBy: { createdAt: 'desc' },
      },
      pagos: { orderBy: { createdAt: 'desc' } },
      notificaciones: { orderBy: { createdAt: 'desc' }, take: 5 },
      enlacesPago: { orderBy: { createdAt: 'desc' } },
      mensajes: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'asc' },
      },
      emails: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!tramite) notFound()

  const socios = (tramite.socios as any[]) || []
  const administradores = (tramite.administradores as any[]) || []
  const datosUsuario = (tramite.datosUsuario as any) || {}

  // El teléfono es obligatorio en el formulario y se guarda en datosUsuario,
  // pero es opcional en el registro, así que user.phone puede estar vacío.
  const telefono = tramite.user.phone || datosUsuario.telefono || ''

  const nombre = tramite.denominacionAprobada || tramite.denominacionSocial1
  const estado = getEstado(tramite, 'admin')
  const progreso = calcularProgreso(tramite)
  const basePath = `/dashboard/admin/tramites/${tramite.id}`

  const docsPendientes = tramite.documentos.filter((d) => d.estado === 'PENDIENTE').length
  const pagosPendientes = tramite.pagos.filter((p) => p.estado === 'PENDIENTE').length
  const mensajesSinLeer = tramite.mensajes.filter(
    (m: any) => !m.leido && m.user?.email === tramite.user.email,
  ).length

  const editProps = {
    tramiteId: tramite.id,
    tramite: {
      denominacionSocial1: tramite.denominacionSocial1,
      denominacionSocial2: tramite.denominacionSocial2,
      denominacionSocial3: tramite.denominacionSocial3,
      objetoSocial: tramite.objetoSocial,
      domicilioLegal: tramite.domicilioLegal,
      capitalSocial: tramite.capitalSocial,
      socios,
      administradores,
      datosUsuario,
    },
  }

  const tabs: Tab[] = [
    { id: 'gestion', label: 'Gestión' },
    { id: 'pagos', label: 'Pagos', badge: pagosPendientes },
    { id: 'documentos', label: 'Documentos', badge: docsPendientes },
    { id: 'comunicacion', label: 'Comunicación', badge: mensajesSinLeer },
    { id: 'datos', label: 'Datos' },
    { id: 'cierre', label: 'Cierre' },
  ]

  const comprobantes = tramite.documentos.filter(
    (doc) =>
      doc.tipo === 'COMPROBANTE_DEPOSITO' ||
      doc.nombre.toLowerCase().includes('comprobante') ||
      doc.descripcion?.toLowerCase().includes('comprobante'),
  )

  const paraFirmar = tramite.documentos
    .filter((doc) =>
      ['DOCUMENTO_PARA_FIRMAR', 'ESTATUTO_PARA_FIRMAR', 'ACTA_PARA_FIRMAR'].includes(
        doc.tipo ?? '',
      ),
    )
    .map((doc) => ({
      id: doc.id,
      nombre: doc.nombre,
      descripcion: doc.descripcion,
      url: doc.url,
      estado: doc.estado,
      fechaSubida: doc.fechaSubida,
    }))

  return (
    <div className="space-y-6">
      {/* ─── Cabecera fija: quién, en qué estado y cuánto lleva ───────── */}
      <div className="-mx-4 -mt-6 border-b border-line bg-surface px-4 pb-0 pt-4 md:-mx-6 md:-mt-8 md:px-6 md:pt-6">
        <Link
          href="/dashboard/admin/tramites"
          className="inline-flex items-center gap-1.5 rounded-chip text-body-sm text-ink-2 hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Trámites
        </Link>

        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-display text-ink">{nombre}</h1>
              <Badge tone={estado.tone} dot>
                {estado.label}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-ink-2">
              <span className="inline-flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-ink-3" aria-hidden />
                {tramite.user.name}
              </span>
              <a
                href={`mailto:${tramite.user.email}`}
                className="inline-flex items-center gap-2 rounded-chip hover:text-ink"
              >
                <Mail className="h-3.5 w-3.5 text-ink-3" aria-hidden />
                {tramite.user.email}
              </a>
              {telefono && (
                <a
                  href={`tel:${telefono}`}
                  className="inline-flex items-center gap-2 rounded-chip hover:text-ink"
                >
                  <Phone className="h-3.5 w-3.5 text-ink-3" aria-hidden />
                  {telefono}
                </a>
              )}
              <span className="inline-flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-ink-3" aria-hidden />
                {tramite.jurisdiccion === 'CORDOBA' ? 'Córdoba (IPJ)' : 'CABA (IGJ)'}
              </span>
              <span>Plan {tramite.plan}</span>
            </div>
          </div>

          <div className="w-full shrink-0 lg:w-64">
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="truncate text-body-sm text-ink-2">
                {etapaActual(tramite, 'admin')}
              </span>
              <span className="text-body-sm font-medium text-ink tnum">{progreso}%</span>
            </div>
            <Progress
              value={progreso}
              tone={progreso === 100 ? 'success' : 'primary'}
              label={`Progreso de ${nombre}`}
            />
          </div>
        </div>

        <TabNav tabs={tabs} activo={tab} basePath={basePath} className="mt-4" />
      </div>

      {/* ─── Contenido de la pestaña ──────────────────────────────────── */}

      {tab === 'gestion' && (
        <div className="space-y-6">
          <ValidacionTramite
            tramiteId={tramite.id}
            estadoValidacion={tramite.estadoValidacion}
            observacionesValidacion={tramite.observacionesValidacion}
          />

          <EstadoManager
            tramiteId={tramite.id}
            estadoActual={tramite.estadoGeneral}
            etapas={{
              formularioCompleto: tramite.formularioCompleto,
              denominacionReservada: tramite.denominacionReservada,
              capitalDepositado: tramite.capitalDepositado,
              tasaPagada: tramite.tasaPagada,
              documentosRevisados: tramite.documentosRevisados,
              documentosFirmados: tramite.documentosFirmados,
              tramiteIngresado: tramite.tramiteIngresado,
              sociedadInscripta: tramite.sociedadInscripta,
            }}
          />

          <DenominacionSelector
            tramiteId={tramite.id}
            denominacion1={tramite.denominacionSocial1}
            denominacion2={tramite.denominacionSocial2}
            denominacion3={tramite.denominacionSocial3}
            denominacionAprobada={tramite.denominacionAprobada}
          />

          <EtapasManager
            tramiteId={tramite.id}
            etapas={{
              formularioCompleto: tramite.formularioCompleto,
              honorariosPagados: tramite.honorariosPagados,
              homonimiaAnalizada: tramite.homonimiaAnalizada,
              ciudadanoDigitalOk: tramite.ciudadanoDigitalOk,
              denominacionReservada: tramite.denominacionReservada,
              cuentaBancariaAbierta: tramite.cuentaBancariaAbierta,
              capitalDepositado: tramite.capitalDepositado,
              tasaPagada: tramite.tasaPagada,
              borradorEnviado: tramite.borradorEnviado,
              borradorAprobadoCliente: tramite.borradorAprobadoCliente,
              documentosRevisados: tramite.documentosRevisados,
              documentosFirmados: tramite.documentosFirmados,
              tramiteIngresado: tramite.tramiteIngresado,
              sociedadInscripta: tramite.sociedadInscripta,
              tramiteObservado: tramite.tramiteObservado,
            }}
            instruccionesFirma={tramite.instruccionesFirma}
            observacionesOrganismo={tramite.observacionesOrganismo}
          />
        </div>
      )}

      {tab === 'pagos' && (
        <div className="space-y-6">
          <PagosControl tramiteId={tramite.id} userId={tramite.userId} pagos={tramite.pagos} />

          {tramite.pagos.length > 0 && <ReportingPagos pagos={tramite.pagos} />}

          <div className="grid gap-6 xl:grid-cols-2">
            <HonorariosMercadoPago
              tramiteId={tramite.id}
              pagos={tramite.pagos}
              plan={tramite.plan}
            />
            <EnlacesPagoExterno tramiteId={tramite.id} enlaces={tramite.enlacesPago} />
          </div>

          <CuentaCapital
            tramiteId={tramite.id}
            capitalSocial={tramite.capitalSocial}
            cuentaInicial={null}
          />

          <div className="space-y-3">
            <EditarCBU
              tramiteId={tramite.id}
              cbuPrincipal={datosUsuario.cbuPrincipal}
              cbuSecundario={datosUsuario.cbuSecundario}
            />
            {!datosUsuario.cbuPrincipal && (
              <div className="flex flex-wrap items-center gap-3 rounded-card border border-warning-line bg-warning-soft p-4">
                <p className="flex-1 text-body-sm text-ink-2">
                  El cliente todavía no informó los CBU.
                </p>
                <SolicitarCBUButton tramiteId={tramite.id} />
              </div>
            )}
          </div>

          <ComprobantesReview
            tramiteId={tramite.id}
            comprobantes={comprobantes}
            enlacesPago={tramite.enlacesPago}
          />
        </div>
      )}

      {tab === 'documentos' && (
        <div className="space-y-6">
          <SubirBorrador
            tramiteId={tramite.id}
            borradorEnviado={tramite.borradorEnviado}
            borradorAprobadoCliente={tramite.borradorAprobadoCliente}
          />

          <SubirDocumentosParaCliente
            tramiteId={tramite.id}
            userId={tramite.userId}
            documentosEnviados={paraFirmar}
          />

          <DocumentosReview tramiteId={tramite.id} documentos={tramite.documentos} />
        </div>
      )}

      {tab === 'comunicacion' && (
        <div className="space-y-6">
          <section className="space-y-4">
            <SectionHeader
              title="Chat con el cliente"
              description="Lo ve dentro de su trámite, en tiempo real."
            />
            <ChatBox tramiteId={tramite.id} mensajesIniciales={tramite.mensajes} />
          </section>

          <ObservacionesForm tramiteId={tramite.id} userId={tramite.userId} />

          <EmailsTramite emails={tramite.emails} />
        </div>
      )}

      {tab === 'datos' && (
        <div className="space-y-3">
          <CollapsibleSection
            title="Información general"
            icon={<FileText className="h-4 w-4" />}
            action={<EditInfoGeneral {...editProps} />}
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

            {datosUsuario.asesoramientoContable && (
              <div className="mt-4 rounded-control border border-success-line bg-success-soft p-3">
                <p className="text-body-sm font-medium text-ink">
                  Interesado en asesoramiento contable
                </p>
                <p className="mt-0.5 text-body-sm text-ink-2">
                  El cliente pidió información sobre servicios contables — oportunidad de postventa.
                </p>
              </div>
            )}
          </CollapsibleSection>

          <CollapsibleSection
            title="Denominaciones propuestas"
            icon={<Tag className="h-4 w-4" />}
            action={<EditDenominaciones {...editProps} />}
            summary={tramite.denominacionAprobada ? 'Aprobada' : 'Sin aprobar'}
            padding="default"
          >
            <div className="space-y-2">
              {datosUsuario.marcaRegistrada && (
                <div className="rounded-control border border-info-line bg-info-soft p-3">
                  <p className="text-body-sm font-medium text-ink">Marca registrada</p>
                  <p className="mt-0.5 text-body-sm text-ink-2">
                    El cliente indicó que la denominación es una marca registrada de su propiedad.
                  </p>
                </div>
              )}
              {tramite.denominacionAprobada && (
                <div className="rounded-control border border-success-line bg-success-soft p-3">
                  <p className="text-label text-success">Denominación aprobada</p>
                  <p className="mt-0.5 text-body font-medium text-ink">
                    {tramite.denominacionAprobada}
                  </p>
                </div>
              )}
              {[
                tramite.denominacionSocial1,
                tramite.denominacionSocial2,
                tramite.denominacionSocial3,
              ]
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

          <div className="grid gap-3 lg:grid-cols-2">
            <CollapsibleSection
              title="Objeto social"
              icon={<Briefcase className="h-4 w-4" />}
              action={<EditObjetoSocial {...editProps} />}
              padding="default"
            >
              <ObjetoSocial objetoSocial={tramite.objetoSocial} />
            </CollapsibleSection>

            <CollapsibleSection
              title="Domicilio legal"
              icon={<MapPin className="h-4 w-4" />}
              action={<EditDomicilio {...editProps} />}
              padding="default"
            >
              <DomicilioLegal domicilio={tramite.domicilioLegal} />
            </CollapsibleSection>
          </div>

          <CollapsibleSection
            title="Socios y accionistas"
            icon={<Users className="h-4 w-4" />}
            action={<EditSocios {...editProps} />}
            summary={`${socios.length} ${socios.length === 1 ? 'socio' : 'socios'}`}
            padding="default"
          >
            <div className="space-y-3">
              {socios.map((socio, i) => (
                <FichaPersona
                  key={i}
                  persona={socio}
                  subtitulo={`Socio ${i + 1}`}
                  capitalSocial={tramite.capitalSocial}
                />
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Órgano de administración"
            icon={<User className="h-4 w-4" />}
            action={<EditAdministradores {...editProps} />}
            summary={`${administradores.length} ${administradores.length === 1 ? 'persona' : 'personas'}`}
            padding="default"
          >
            <div className="space-y-3">
              {administradores.map((admin, i) => (
                <FichaPersona key={i} persona={admin} subtitulo={admin.cargo} />
              ))}
            </div>
          </CollapsibleSection>
        </div>
      )}

      {tab === 'cierre' && (
        <div className="space-y-6">
          <DatosFinalesForm
            tramiteId={tramite.id}
            cuitActual={tramite.cuit}
            matriculaActual={tramite.matricula}
            numeroResolucionActual={tramite.numeroResolucion}
            fechaInscripcionActual={
              tramite.fechaSociedadInscripta
                ? new Date(tramite.fechaSociedadInscripta).toISOString().split('T')[0]
                : tramite.fechaInscripcion
                  ? new Date(tramite.fechaInscripcion).toISOString().split('T')[0]
                  : null
            }
          />

          <EliminarTramite tramiteId={tramite.id} denominacion={nombre} />
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────── Subcomponentes ─────────────────────────── */

function ObjetoSocial({ objetoSocial }: { objetoSocial: string | null }) {
  const texto = objetoSocial || ''
  const preAprobado =
    texto === 'PREAPROBADO' ||
    texto.includes('La sociedad tiene por objeto realizar por cuenta propia y/o de terceros') ||
    texto.includes('1. Construcción de todo tipo de obras')

  return (
    <div className="space-y-2">
      <Badge tone={preAprobado ? 'success' : 'info'}>
        {preAprobado ? 'Pre-aprobado' : 'Personalizado'}
      </Badge>
      <p className="whitespace-pre-line text-body-sm text-ink-2">
        {preAprobado
          ? 'El cliente eligió el objeto social estándar pre-aprobado.'
          : getObjetoSocialTexto(objetoSocial)}
      </p>
    </div>
  )
}

function DomicilioLegal({ domicilio }: { domicilio: string | null }) {
  const sinDomicilio =
    !domicilio || domicilio.trim() === '' || domicilio.trim().toLowerCase() === 'a informar'

  if (sinDomicilio) {
    return (
      <div className="rounded-control border border-warning-line bg-warning-soft p-3">
        <p className="text-body-sm text-ink-2">
          El cliente <span className="font-medium text-ink">no dispone de domicilio propio</span> y
          solicitó el servicio de domicilio en Córdoba de QMS (costo anual a informar).
        </p>
      </div>
    )
  }

  return <p className="text-body-sm text-ink-2">{domicilio}</p>
}

function FichaPersona({
  persona,
  subtitulo,
  capitalSocial,
}: {
  persona: any
  subtitulo?: string
  capitalSocial?: number
}) {
  const domicilio =
    [persona.domicilio, persona.ciudad, persona.departamento, persona.provincia]
      .filter(Boolean)
      .join(' · ') ||
    persona.domicilio ||
    'No especificado'

  const conAporte = typeof capitalSocial === 'number'
  const { aporte, porcentaje } = conAporte
    ? normalizarAporte(persona, capitalSocial)
    : { aporte: 0, porcentaje: 0 }

  return (
    <Card className="bg-surface-2">
      <CardBody padding="compact">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-3">
          <div className="min-w-0">
            <p className="text-heading text-ink">
              {persona.nombre} {persona.apellido}
            </p>
            {subtitulo && <p className="text-body-sm text-ink-2">{subtitulo}</p>}
          </div>
          {conAporte && (
            <div className="text-right">
              <p className="text-label text-ink-2">Participación</p>
              <p className="text-body font-medium text-ink tnum">{porcentaje.toFixed(2)}%</p>
              <p className="text-body-sm text-ink-2 tnum">
                ${Math.round(aporte).toLocaleString('es-AR')}
              </p>
            </div>
          )}
        </div>

        <DataList columns={3} className="mt-3">
          <DataItem label="DNI" value={persona.dni} mono />
          <DataItem label="CUIT" value={persona.cuit} mono />
          {persona.email && <DataItem label="Email" value={persona.email} />}
          {persona.telefono && <DataItem label="Teléfono" value={persona.telefono} />}
          {persona.nacionalidad && (
            <DataItem label="Nacionalidad" value={persona.nacionalidad} />
          )}
          <DataItem label="Estado civil" value={persona.estadoCivil} />
          <DataItem label="Profesión" value={persona.profesion} />
          {persona.fechaNacimiento && (
            <DataItem label="Fecha de nacimiento" value={persona.fechaNacimiento} />
          )}
          <DataItem label="Domicilio" value={domicilio} className="sm:col-span-2" />
        </DataList>
      </CardBody>
    </Card>
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

export default AdminTramiteDetallePage
