import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import {
  AlertCircle,
  Building2,
  CheckCircle,
  Clock,
  FileText,
  Plus,
  Trash2,
  Users,
} from 'lucide-react'

import { PageHeader, SectionHeader } from '@/components/ui/page-header'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge, CountBadge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field } from '@/components/ui/field'
import { DataList, DataItem } from '@/components/ui/data-list'
import { Progress, LabeledProgress } from '@/components/ui/progress'
import { StatCard } from '@/components/ui/stat-card'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { EmptyState, ErrorState, Skeleton, InlineLoading } from '@/components/ui/states'

export const metadata = { title: 'Sistema de diseño · QMS' }

/* Ficha de referencia del sistema. No es una pantalla de producto:
   sirve para revisar tokens y componentes sin navegar 41 pantallas. */

function Bloque({
  titulo,
  nota,
  children,
}: {
  titulo: string
  nota?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <SectionHeader title={titulo} description={nota} />
      <Card>
        <CardBody className="space-y-6">{children}</CardBody>
      </Card>
    </section>
  )
}

function Muestra({ nombre, clase, texto }: { nombre: string; clase: string; texto?: string }) {
  return (
    <div className="min-w-0">
      <div className={`h-14 rounded-control border border-line ${clase}`} />
      <p className="mt-1.5 truncate text-label text-ink">{nombre}</p>
      {texto && <p className="truncate text-label text-ink-3">{texto}</p>}
    </div>
  )
}

export default async function DesignSystemPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  return (
    <div className="space-y-section">
      <PageHeader
        title="Sistema de diseño"
        description="Tokens y componentes del módulo de gestión. Todo sale de app/globals.css: cambiar --brand-h rebrandea esta página entera."
        badge={<Badge tone="info" dot>Interno</Badge>}
      />

      {/* ─────────────────────────  COLOR  ───────────────────────── */}
      <Bloque
        titulo="Marca"
        nota="Se genera desde --brand-h (tono) y --brand-c (saturación). El paso 700 es el color del logo, #991D23."
      >
        <div className="grid grid-cols-5 gap-3 sm:grid-cols-10">
          {[
            ['50', 'bg-brand-50'],
            ['100', 'bg-brand-100'],
            ['200', 'bg-brand-200'],
            ['300', 'bg-brand-300'],
            ['400', 'bg-brand-400'],
            ['500', 'bg-brand-500'],
            ['600', 'bg-brand-600'],
            ['700', 'bg-brand-700'],
            ['800', 'bg-brand-800'],
            ['900', 'bg-brand-900'],
          ].map(([n, clase]) => (
            <Muestra key={n} nombre={n} clase={clase} texto={n === '700' ? 'logo' : undefined} />
          ))}
        </div>
        <div className="rounded-control bg-surface-2 p-card-sm">
          <p className="text-body-sm text-ink-2">
            Para rebrandear, en <span className="font-mono text-ink">app/globals.css</span>:
          </p>
          <pre className="mt-2 overflow-x-auto font-mono text-body-sm text-ink">
{`--brand-h: 24.5;   /* 150 verde · 250 azul · 285 violeta · 45 naranja */`}
          </pre>
        </div>
      </Bloque>

      <Bloque
        titulo="Neutrales"
        nota="Gris levemente frío, independiente de la marca: si mañana la marca es verde, los grises no se vuelven verdes."
      >
        <div className="grid grid-cols-6 gap-3 sm:grid-cols-12">
          {[
            ['0', 'bg-n-0'],
            ['50', 'bg-n-50'],
            ['100', 'bg-n-100'],
            ['200', 'bg-n-200'],
            ['300', 'bg-n-300'],
            ['400', 'bg-n-400'],
            ['500', 'bg-n-500'],
            ['600', 'bg-n-600'],
            ['700', 'bg-n-700'],
            ['800', 'bg-n-800'],
            ['900', 'bg-n-900'],
            ['950', 'bg-n-950'],
          ].map(([n, clase]) => (
            <Muestra key={n} nombre={n} clase={clase} />
          ))}
        </div>
      </Bloque>

      <Bloque
        titulo="Estados"
        nota="Tono fijo, misma escalera de luminosidad que la marca. Contraste texto-sobre-fondo verificado entre 6,6:1 y 7,4:1 (AA)."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['success', 'border-success-line bg-success-soft', 'text-success', 'bg-success-solid'],
            ['warning', 'border-warning-line bg-warning-soft', 'text-warning', 'bg-warning-solid'],
            ['danger', 'border-danger-line bg-danger-soft', 'text-danger', 'bg-danger-solid'],
            ['info', 'border-info-line bg-info-soft', 'text-info', 'bg-info-solid'],
          ].map(([nombre, caja, texto, solido]) => (
            <div key={nombre} className={`rounded-card border p-card-sm ${caja}`}>
              <p className={`text-heading ${texto}`}>{nombre}</p>
              <p className="mt-1 text-body-sm text-ink-2">
                Texto de apoyo sobre el fondo suave del estado.
              </p>
              <div className={`mt-3 h-8 rounded-control ${solido}`} />
            </div>
          ))}
        </div>
        <p className="text-body-sm text-ink-2">
          La marca es roja, así que <span className="text-ink font-medium">danger</span> y{' '}
          <span className="text-ink font-medium">primary</span> son casi el mismo tono. Se
          distinguen por forma, no por color: lo destructivo es de contorno salvo dentro del
          diálogo de confirmación.
        </p>
      </Bloque>

      {/* ─────────────────────────  TIPOGRAFÍA  ───────────────────── */}
      <Bloque
        titulo="Tipografía"
        nota="Inter. Siete pasos, con interlineado y peso incluidos en el token. Pesos permitidos: 400, 500 y 600."
      >
        <div className="space-y-4">
          {[
            ['text-display', 'Constituí tu SAS', '28 / 34 · 600 · título de página'],
            ['text-title', 'Trámites recientes', '20 / 28 · 600 · título de sección'],
            ['text-heading', 'Información del cliente', '16 / 24 · 600 · título de card'],
            ['text-body', 'Texto general del módulo, valores de datos y párrafos.', '15 / 24 · 400'],
            ['text-body-sm', 'Metadatos, ayuda contextual y vistas densas del admin.', '13 / 20 · 400'],
            ['text-label', 'ETIQUETA · BADGE · OVERLINE', '12 / 16 · 500'],
          ].map(([clase, ejemplo, meta]) => (
            <div key={clase} className="flex flex-col gap-1 border-b border-line pb-4 last:border-0 last:pb-0">
              <p className={`${clase} text-ink`}>{ejemplo}</p>
              <p className="font-mono text-label text-ink-3">
                {clase} — {meta}
              </p>
            </div>
          ))}
          <div className="flex items-baseline gap-4">
            <span className="text-metric tnum text-ink">1.284</span>
            <span className="font-mono text-label text-ink-3">
              text-metric + .tnum — 26 / 30 · 600 · números alineados en columna
            </span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="font-mono text-body text-ink">0290 0710 9000 0012 3456 78</span>
            <span className="font-mono text-label text-ink-3">font-mono — CBU, CUIT, códigos</span>
          </div>
        </div>
      </Bloque>

      {/* ─────────────────────────  FORMA  ───────────────────────── */}
      <Bloque
        titulo="Forma y elevación"
        nota="Los radios derivan de --radius (10px). Las cards no llevan sombra en reposo: sólo borde."
      >
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            ['rounded-chip', '6px · badges'],
            ['rounded-control', '10px · botones, inputs'],
            ['rounded-card', '14px · cards'],
            ['rounded-modal', '20px · modales'],
          ].map(([clase, meta]) => (
            <div key={clase}>
              <div className={`h-16 border border-line-strong bg-surface-2 ${clase}`} />
              <p className="mt-1.5 font-mono text-label text-ink">{clase}</p>
              <p className="text-label text-ink-3">{meta}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ['shadow-raise', 'hover de card'],
            ['shadow-pop', 'dropdowns'],
            ['shadow-modal', 'modales'],
          ].map(([clase, meta]) => (
            <div key={clase}>
              <div className={`h-16 rounded-card bg-surface ${clase}`} />
              <p className="mt-1.5 font-mono text-label text-ink">{clase}</p>
              <p className="text-label text-ink-3">{meta}</p>
            </div>
          ))}
        </div>
      </Bloque>

      {/* ─────────────────────────  BOTONES  ─────────────────────── */}
      <Bloque titulo="Botones" nota="Cinco variantes, cuatro tamaños. Foco visible obligatorio: probá con Tab.">
        <div className="flex flex-wrap items-center gap-3">
          <Button>
            <Plus className="h-4 w-4" />
            Primario
          </Button>
          <Button variant="secondary">Secundario</Button>
          <Button variant="ghost">Fantasma</Button>
          <Button variant="danger">
            <Trash2 className="h-4 w-4" />
            Eliminar
          </Button>
          <Button variant="danger-solid">Confirmar borrado</Button>
          <Button variant="link">Enlace</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Pequeño</Button>
          <Button size="md">Mediano</Button>
          <Button size="lg">Grande</Button>
          <Button size="icon" aria-label="Agregar">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button loading>Guardando</Button>
          <Button disabled>Deshabilitado</Button>
          <Button variant="secondary" loading>
            Procesando
          </Button>
        </div>
        <p className="text-body-sm text-ink-2">
          El estado de carga es una prop (<span className="font-mono text-ink">loading</span>): el
          texto no cambia, el botón se bloquea y anuncia <span className="font-mono text-ink">aria-busy</span>.
        </p>
      </Bloque>

      {/* ─────────────────────────  BADGES  ──────────────────────── */}
      <Bloque titulo="Estados de trámite" nota="Un solo mapa de tonos para cliente y admin. El punto ayuda a leer el estado sin depender del color.">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral" dot>Borrador</Badge>
          <Badge tone="info" dot>En proceso</Badge>
          <Badge tone="warning" dot>Te toca a vos</Badge>
          <Badge tone="success" dot>Completado</Badge>
          <Badge tone="danger" dot>Cancelado</Badge>
          <Badge tone="primary">Premium</Badge>
          <Badge tone="neutral" size="sm">sm</Badge>
          <CountBadge count={7} />
          <CountBadge count={124} />
        </div>
      </Bloque>

      {/* ─────────────────────────  MÉTRICAS  ────────────────────── */}
      <Bloque titulo="Métricas" nota="El color aparece sólo cuando el valor exige una acción. Los demás son informativos y pesan igual.">
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard label="Trámites totales" value="128" hint="En el sistema" icon={FileText} />
          <StatCard label="En proceso" value="34" hint="Sin inscribir" icon={Clock} />
          <StatCard label="Completados" value="94" hint="Inscriptos" icon={CheckCircle} />
          <StatCard
            label="Esperando al cliente"
            value="6"
            hint="Ver trámites"
            icon={AlertCircle}
            alert
            href="/dashboard/design-system"
          />
        </div>
      </Bloque>

      {/* ─────────────────────────  PROGRESO  ────────────────────── */}
      <Bloque titulo="Progreso" nota="Color plano, no gradiente: el progreso es discreto (7 etapas), el gradiente sugería una transición que no existe.">
        <LabeledProgress value={43} caption="Progreso del trámite" />
        <LabeledProgress value={100} caption="Trámite completado" tone="success" />
        <Progress value={71} size="sm" />
      </Bloque>

      {/* ─────────────────────────  FORMULARIOS  ─────────────────── */}
      <Bloque titulo="Formularios" nota="Un solo control base. El error se asocia al campo con aria-describedby.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Denominación social" htmlFor="ds-1" required hint="Sin el sufijo S.A.S.">
            <Input id="ds-1" placeholder="Ej: Drix" />
          </Field>
          <Field label="CUIT" htmlFor="ds-2" error="El CUIT debe tener 11 dígitos">
            <Input id="ds-2" defaultValue="2033" invalid />
          </Field>
          <Field label="Campo deshabilitado" htmlFor="ds-3">
            <Input id="ds-3" disabled defaultValue="No editable" />
          </Field>
          <Field label="Observaciones" htmlFor="ds-4" hint="Se envía al cliente por email">
            <Textarea id="ds-4" placeholder="Escribí la observación…" />
          </Field>
        </div>
      </Bloque>

      {/* ─────────────────────────  DATOS  ───────────────────────── */}
      <Bloque titulo="Listas de datos" nota="Reemplaza el patrón etiqueta/valor que estaba escrito a mano unas 100 veces.">
        <DataList columns={4}>
          <DataItem label="Jurisdicción" value="Córdoba (IPJ)" icon={Building2} />
          <DataItem label="Plan" value="Premium" />
          <DataItem label="Capital social" value="$1.500.000" />
          <DataItem label="Socios" value="3" icon={Users} />
          <DataItem label="CUIT" value="30-71234567-8" mono />
          <DataItem label="Matrícula" value="12.345-A" mono />
          <DataItem label="Sin dato" value={null} />
        </DataList>
      </Bloque>

      {/* ─────────────────────────  PLEGABLE  ────────────────────── */}
      <Bloque titulo="Secciones plegables" nota="Disparador con <button> real, aria-expanded y aria-controls. Las acciones no disparan el plegado.">
        <div className="space-y-3">
          <CollapsibleSection
            title="Socios / Accionistas"
            summary="3 socios"
            icon={<Users className="h-4 w-4" />}
            action={
              <Button variant="ghost" size="sm">
                Editar
              </Button>
            }
          >
            <p className="text-body text-ink-2">
              Contenido del panel. Abrí y cerrá con Enter o Espacio: el foco nunca se pierde.
            </p>
          </CollapsibleSection>
          <CollapsibleSection title="Información general" defaultOpen>
            <DataList columns={3}>
              <DataItem label="Fecha de inicio" value="14 de agosto, 2026" />
              <DataItem label="Estado" value="En proceso" />
              <DataItem label="Responsable" value="Equipo QMS" />
            </DataList>
          </CollapsibleSection>
        </div>
      </Bloque>

      {/* ─────────────────────────  FEEDBACK  ────────────────────── */}
      <Bloque titulo="Carga, vacío y error" nota="Antes no existía ningún loading.tsx ni error.tsx en toda la app.">
        <div className="space-y-3">
          <div className="rounded-card border border-line bg-surface p-card-sm">
            <Skeleton className="h-5 w-1/3" />
            <div className="mt-4 space-y-2">
              <Skeleton className="h-3.5" />
              <Skeleton className="h-3.5 w-4/5" />
              <Skeleton className="h-3.5 w-2/3" />
            </div>
          </div>
          <InlineLoading />
        </div>
        <Card>
          <EmptyState
            icon={FileText}
            title="No hay trámites todavía"
            description="Cuando inicies tu primer trámite de constitución vas a verlo acá, con su progreso y los pasos pendientes."
            action={
              <Button>
                <Plus className="h-4 w-4" />
                Iniciar trámite
              </Button>
            }
          />
        </Card>
        <ErrorState />
      </Bloque>
    </div>
  )
}
