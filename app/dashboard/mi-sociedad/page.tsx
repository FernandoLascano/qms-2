import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Building2, Download, FileText, MessageCircle, BookOpen, Handshake } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

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

export default async function MiSociedadPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const sociedades = await prisma.tramite.findMany({
    where: { userId: session.user.id, sociedadInscripta: true },
    include: { documentos: true },
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
                  <p className="text-sm text-gray-800 whitespace-pre-line">{soc.objetoSocial}</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Socios ({socios.length})</p>
                    <ul className="text-sm text-gray-800 space-y-0.5">
                      {socios.map((s: any, i: number) => (
                        <li key={i}>{s.nombre || s.nombreCompleto || `${s.nombres || ''} ${s.apellidos || ''}`.trim() || 'Socio'}{s.porcentaje ? ` — ${s.porcentaje}%` : ''}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Administradores ({administradores.length})</p>
                    <ul className="text-sm text-gray-800 space-y-0.5">
                      {administradores.map((a: any, i: number) => (
                        <li key={i}>{a.nombre || a.nombreCompleto || `${a.nombres || ''} ${a.apellidos || ''}`.trim() || 'Administrador'}{a.cargo ? ` — ${a.cargo}` : ''}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

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
              </CardContent>
            </Card>

            {/* Seguir en contacto / próximos pasos */}
            <div className="grid sm:grid-cols-3 gap-3">
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
