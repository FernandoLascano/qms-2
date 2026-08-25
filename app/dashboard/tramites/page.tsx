import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowRight, Building2, Calendar, FileText, Plus, Users } from 'lucide-react'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LabeledProgress } from '@/components/ui/progress'
import { EmptyState } from '@/components/ui/states'
import { calcularProgreso, etapaActual, getEstado } from '@/lib/tramites/estado'

async function TramitesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const tramites = await prisma.tramite.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  const enCurso = tramites.filter((t) => !t.sociedadInscripta).length
  const inscriptas = tramites.length - enCurso

  return (
    <div className="stagger space-y-section">
      <PageHeader
        title="Mis trámites"
        description={
          tramites.length === 0
            ? 'Acá vas a ver el seguimiento de cada constitución.'
            : `${enCurso} en curso · ${inscriptas} ${inscriptas === 1 ? 'inscripta' : 'inscriptas'}`
        }
        actions={
          <Button asChild variant={tramites.length === 0 ? 'primary' : 'secondary'}>
            <Link href="/tramite/nuevo">
              <Plus className="h-4 w-4" aria-hidden />
              Nuevo trámite
            </Link>
          </Button>
        }
      />

      {tramites.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title="Todavía no tenés trámites"
            description="Empezá tu primera constitución de S.A.S. Te guiamos en cada paso y podés guardar para seguir después."
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
      ) : (
        <div className="space-y-3">
          {tramites.map((tramite) => {
            const socios = (tramite.socios as unknown[]) ?? []
            const estado = getEstado(tramite, 'cliente')
            const progreso = calcularProgreso(tramite)
            const completo = progreso === 100
            const href = tramite.formularioCompleto
              ? `/dashboard/tramites/${tramite.id}`
              : `/tramite/nuevo?tramiteId=${tramite.id}`

            /* Un borrador no es un trámite, y hasta acá se veía igual: mismo
               título, mismo capital, mismos socios, y sólo el badge los
               distinguía. Hay clientes con dos entradas del MISMO nombre —una
               enviada y un borrador que dejó el autoguardado— y no había forma
               de saber cuál era cuál de un vistazo. La tarjeta del borrador
               pasa a decir qué es y qué hacer con ella. */
            const esBorrador = !tramite.formularioCompleto

            return (
              <Link key={tramite.id} href={href} className="block rounded-card">
                <Card interactive tone={completo ? 'success' : 'default'}>
                  <CardBody className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-heading text-ink">
                          {esBorrador
                            ? 'Formulario sin terminar'
                            : tramite.denominacionAprobada || tramite.denominacionSocial1}
                        </h2>

                        {esBorrador ? (
                          <p className="mt-1 text-body-sm text-ink-2">
                            {tramite.denominacionSocial1 !== 'Pendiente de definir' ? (
                              <>
                                Para <span className="font-medium text-ink">{tramite.denominacionSocial1}</span>.{' '}
                              </>
                            ) : null}
                            Lo empezaste el{' '}
                            {format(new Date(tramite.createdAt), "d 'de' MMMM", { locale: es })} y
                            quedó sin enviar. Tocá para continuar donde lo dejaste.
                          </p>
                        ) : (
                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-ink-2">
                            <span className="inline-flex items-center gap-2">
                              <Calendar className="h-3.5 w-3.5 text-ink-3" aria-hidden />
                              {format(new Date(tramite.createdAt), "d 'de' MMMM, yyyy", {
                                locale: es,
                              })}
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <Building2 className="h-3.5 w-3.5 text-ink-3" aria-hidden />
                              {tramite.jurisdiccion === 'CORDOBA' ? 'Córdoba (IPJ)' : 'CABA (IGJ)'}
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <Users className="h-3.5 w-3.5 text-ink-3" aria-hidden />
                              {socios.length} {socios.length === 1 ? 'socio' : 'socios'}
                            </span>
                            <span className="tnum">
                              Capital ${tramite.capitalSocial.toLocaleString('es-AR')}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <Badge tone={estado.tone} dot>
                          {estado.label}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-ink-3" aria-hidden />
                      </div>
                    </div>

                    {/* En un borrador la barra medía el avance del trámite, que
                        todavía no arrancó: marcaba 8% y parecía un trámite
                        frenado en vez de un formulario a medio llenar. */}
                    {!esBorrador && (
                      <LabeledProgress
                        value={progreso}
                        caption={etapaActual(tramite, 'cliente')}
                        tone={completo ? 'success' : 'primary'}
                      />
                    )}
                  </CardBody>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default TramitesPage
