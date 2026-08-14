import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Building2, Download, FileText, MessageCircle, BookOpen, Handshake, MapPin, FolderOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { objetoSocialParaMostrar } from '@/lib/objeto-social'

export const dynamic = 'force-dynamic'

const fmtFecha = (f: Date | string | null | undefined) => (f ? new Date(f).toLocaleDateString('es-AR') : null)

// Documentos que forman el legajo, en orden de relevancia, con etiqueta amigable.
const DOCS_LEGAJO: { tipo: string; label: string }[] = [
  { tipo: 'RESOLUCION_FINAL', label: 'Resolución de Inscripción' },
  { tipo: 'CONSTANCIA_CUIT', label: 'Constancia de CUIT' },
  { tipo: 'ESTATUTO_FIRMADO', label: 'Estatuto Firmado' },
  { tipo: 'ACTA_CONSTITUTIVA', label: 'Acta Constitutiva' },
  { tipo: 'CERTIFICACION_FIRMA', label: 'Certificación de Firma' },
  { tipo: 'COMPROBANTE_DEPOSITO', label: 'Comprobante de Depósito' }
]

function Dato({ label, valor }: { label: string; valor: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900 break-words">{valor || '—'}</p>
    </div>
  )
}

const cargoLabel = (cargo?: string) => {
  if (!cargo) return null
  const c = cargo.toUpperCase()
  if (c === 'TITULAR') return 'Administrador Titular'
  if (c === 'SUPLENTE') return 'Administrador Suplente'
  return cargo
}

function Persona({ p, tipo }: { p: any; tipo: 'socio' | 'admin' }) {
  const nombre = `${p.nombre || ''} ${p.apellido || ''}`.trim() || p.nombreCompleto || 'Sin nombre'
  const iniciales = `${(p.nombre || '?').trim()[0] || ''}${(p.apellido || '').trim()[0] || ''}`.toUpperCase() || '?'
  const porcentaje = p.porcentaje ?? p.aportePorcentaje
  const chip =
    tipo === 'socio'
      ? porcentaje != null && porcentaje !== ''
        ? `${porcentaje}%`
        : null
      : cargoLabel(p.cargo)
  const chipClass =
    tipo === 'socio'
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-blue-100 text-blue-800 border-blue-200'

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-brand-100 text-brand-700 text-sm font-bold flex items-center justify-center">
        {iniciales}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-gray-900 truncate">{nombre}</p>
          {chip && (
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${chipClass}`}>
              {chip}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate">
          {[p.dni ? `DNI ${p.dni}` : null, p.cuit ? `CUIT ${p.cuit}` : null].filter(Boolean).join(' · ') || '—'}
        </p>
        {tipo === 'socio' && p.aporteCapital != null && (
          <p className="text-xs font-medium text-gray-700 mt-0.5">
            Aporte de capital: ${Number(p.aporteCapital).toLocaleString('es-AR')}
          </p>
        )}
      </div>
    </div>
  )
}

// Paleta categórica colorblind-safe (Okabe-Ito, reordenada para separar adyacentes).
const PALETA_SOCIOS = ['#0072B2', '#E69F00', '#009E73', '#56B4E9', '#CC79A7', '#D55E00', '#6b7280']

function TortaCapital({ socios }: { socios: any[] }) {
  const items = socios
    .map((s, i) => {
      const pct = Number(s.porcentaje ?? s.aportePorcentaje ?? 0)
      return {
        nombre: `${s.nombre || ''} ${s.apellido || ''}`.trim() || `Socio ${i + 1}`,
        pct: isFinite(pct) ? pct : 0,
        capital: Number(s.aporteCapital || 0),
        color: PALETA_SOCIOS[i] || PALETA_SOCIOS[PALETA_SOCIOS.length - 1]
      }
    })
    .filter((x) => x.pct > 0)

  const total = items.reduce((a, b) => a + b.pct, 0)
  if (items.length === 0 || total <= 0) return null

  // Donut con stroke-dasharray sobre un círculo.
  const r = 56
  const C = 2 * Math.PI * r
  let offset = 0
  const capitalTotal = items.reduce((a, b) => a + b.capital, 0)

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg viewBox="0 0 160 160" className="h-40 w-40 flex-shrink-0 -rotate-90">
        <circle cx="80" cy="80" r={r} fill="none" stroke="#f3f4f6" strokeWidth="22" />
        {items.map((it, i) => {
          const frac = it.pct / total
          const len = frac * C
          const gap = items.length > 1 ? 2 : 0
          const dash = `${Math.max(len - gap, 0)} ${C - Math.max(len - gap, 0)}`
          const el = (
            <circle
              key={i}
              cx="80"
              cy="80"
              r={r}
              fill="none"
              stroke={it.color}
              strokeWidth="22"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
            />
          )
          offset += len
          return el
        })}
      </svg>
      <div className="flex-1 w-full space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="h-3 w-3 rounded-sm flex-shrink-0" style={{ backgroundColor: it.color }} />
            <span className="font-medium text-gray-900 truncate flex-1">{it.nombre}</span>
            <span className="text-gray-500 tabular-nums whitespace-nowrap">
              {it.pct}%{it.capital ? ` · $${it.capital.toLocaleString('es-AR')}` : ''}
            </span>
          </div>
        ))}
        {capitalTotal > 0 && (
          <div className="flex items-center justify-between border-t pt-2 text-sm font-semibold text-gray-900">
            <span>Capital total</span>
            <span className="tabular-nums">${capitalTotal.toLocaleString('es-AR')}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default async function MiSociedadPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const sociedades = await prisma.tramite.findMany({
    where: { userId: session.user.id, sociedadInscripta: true },
    include: { documentos: true, domicilioSede: true },
    orderBy: { fechaInscripcion: 'desc' }
  })

  if (sociedades.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Building2 className="h-7 w-7 text-brand-700" />
          <h1 className="text-2xl font-bold text-brand-900">Mi Sociedad</h1>
        </div>
        <Card>
          <CardContent className="py-10 text-center">
            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">Todavía no tenés una sociedad inscripta.</p>
            <p className="text-sm text-gray-500 mt-1">Cuando tu trámite se complete, acá vas a tener el legajo con todos los datos y documentos de tu sociedad.</p>
            <Link href="/dashboard/tramites" className="inline-block mt-4 text-brand-700 font-medium underline">
              Ver mis trámites
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Building2 className="h-7 w-7 text-brand-700" />
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Mi Sociedad</h1>
          <p className="text-sm text-gray-500">El legajo completo de tu sociedad, siempre a mano.</p>
        </div>
      </div>

      {sociedades.map((soc) => {
        const socios = (soc.socios as any[]) || []
        const administradores = (soc.administradores as any[]) || []
        const docsAprobados = soc.documentos.filter((d) => d.estado === 'APROBADO')

        return (
          <div key={soc.id} className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">{soc.denominacionAprobada || soc.denominacionSocial1}</h2>

            {/* Datos oficiales */}
            <Card className="border-2 border-green-200 bg-green-50/40">
              <CardHeader>
                <CardTitle className="text-base">Datos oficiales</CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-3 gap-4">
                <Dato label="CUIT" valor={soc.cuit} />
                <Dato label="Matrícula" valor={soc.matricula} />
                <Dato label="N° Resolución" valor={soc.numeroResolucion} />
                <Dato label="Fecha de inscripción" valor={soc.fechaInscripcion ? new Date(soc.fechaInscripcion).toLocaleDateString('es-AR') : null} />
                <Dato label="Jurisdicción" valor={soc.jurisdiccion} />
                <Dato label="Plan" valor={soc.plan} />
              </CardContent>
            </Card>

            {/* Datos societarios */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Datos societarios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  <Dato label="Capital social" valor={soc.capitalSocial ? `$${soc.capitalSocial.toLocaleString('es-AR')}` : null} />
                  <Dato label="Domicilio legal" valor={soc.domicilioLegal} />
                  <Dato label="Integración" valor={`${soc.porcentajeIntegracion}%`} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Objeto social</p>
                  <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">{objetoSocialParaMostrar(soc.objetoSocial)}</p>
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Socios ({socios.length})</p>
                    <div className="space-y-2">
                      {socios.map((s: any, i: number) => (
                        <Persona key={i} p={s} tipo="socio" />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Administradores ({administradores.length})</p>
                    <div className="space-y-2">
                      {administradores.map((a: any, i: number) => (
                        <Persona key={i} p={a} tipo="admin" />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Composición del capital */}
            {socios.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Composición del capital</CardTitle>
                </CardHeader>
                <CardContent>
                  <TortaCapital socios={socios} />
                </CardContent>
              </Card>
            )}

            {/* Documentos del legajo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-600" /> Documentación
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const items = DOCS_LEGAJO
                    .map((d) => ({ ...d, doc: docsAprobados.find((x) => x.tipo === d.tipo) }))
                    .filter((d) => d.doc)
                  if (items.length === 0) {
                    return <p className="text-sm text-gray-500">Todavía no hay documentos disponibles para descargar.</p>
                  }
                  return (
                    <div className="space-y-2">
                      {items.map(({ label, doc }) => (
                        <div key={doc!.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="h-4 w-4 text-brand-600 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-900 truncate">{label}</span>
                          </div>
                          <a
                            href={`/api/documentos/${doc!.id}/view?download=1`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"
                          >
                            <Download className="h-4 w-4" /> Descargar
                          </a>
                        </div>
                      ))}
                    </div>
                  )
                })()}
                <Link href="/dashboard/documentos" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800">
                  <FolderOpen className="h-4 w-4" /> Ver todos mis documentos
                </Link>
                <p className="text-xs text-gray-400 mt-1">Toda la documentación que recibamos de tu sociedad la vas a encontrar en Documentos.</p>
              </CardContent>
            </Card>

            {/* Domicilio en Sede (si lo contrató con QMS) */}
            {soc.domicilioSede && soc.domicilioSede.estado === 'ACTIVO' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-600" /> Domicilio en Sede (QMS)
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-3 gap-4">
                  <Dato label="Dirección" valor={soc.domicilioSede.direccion} />
                  <Dato label="Estado" valor="Activo" />
                  <Dato label="Monto anual" valor={soc.domicilioSede.montoAnual ? `$${soc.domicilioSede.montoAnual.toLocaleString('es-AR')}` : null} />
                  <Dato label="Inicio" valor={fmtFecha(soc.domicilioSede.fechaInicio)} />
                  <Dato label="Vence / próximo pago" valor={fmtFecha(soc.domicilioSede.fechaVencimiento)} />
                  <Dato label="Último pago" valor={fmtFecha(soc.domicilioSede.ultimoCobro)} />
                </CardContent>
              </Card>
            )}

            {/* Seguir en contacto / próximos pasos */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Link href="/dashboard/documentos" className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 hover:border-brand-300 transition">
                <FolderOpen className="h-5 w-5 text-brand-700" />
                <span className="text-sm font-medium text-gray-900">Mis documentos</span>
              </Link>
              <Link href="/dashboard/libros-digitales" className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 hover:border-brand-300 transition">
                <BookOpen className="h-5 w-5 text-brand-700" />
                <span className="text-sm font-medium text-gray-900">Guía de Libros Digitales</span>
              </Link>
              <Link href="/dashboard/servicios" className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 hover:border-brand-300 transition">
                <Handshake className="h-5 w-5 text-brand-700" />
                <span className="text-sm font-medium text-gray-900">Otros servicios para tu empresa</span>
              </Link>
              <Link href={`/dashboard/tramites/${soc.id}`} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 hover:border-brand-300 transition">
                <MessageCircle className="h-5 w-5 text-brand-700" />
                <span className="text-sm font-medium text-gray-900">Contactar a QMS</span>
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}
