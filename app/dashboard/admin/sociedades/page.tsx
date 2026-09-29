import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'
import CarteraLista, { type SociedadCartera } from '@/components/admin/sociedades/CarteraLista'
import { diasHasta, ingresoMensual, type Modalidad } from '@/lib/cartera'

/*
 * Sociedades como cartera de clientes: qué tiene contratado cada una, qué
 * vence y a quién ofrecerle algo más. Antes era un listado de tarjetas con
 * CUIT y matrícula, sin nada de lo que pasa después de la inscripción.
 */
export default async function SociedadesPage({
  searchParams,
}: {
  searchParams?: Promise<{ filtro?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.rol !== 'ADMIN') redirect('/dashboard')

  // El panel «Hoy» enlaza acá ya filtrado (vencimientos, oportunidades).
  const filtro = (await searchParams)?.filtro

  const tramites = await prisma.tramite.findMany({
    where: {
      estadoGeneral: 'COMPLETADO',
      cuit: { not: null },
      matricula: { not: null },
      numeroResolucion: { not: null },
    },
    select: {
      id: true,
      denominacionSocial1: true,
      denominacionAprobada: true,
      cuit: true,
      plan: true,
      jurisdiccion: true,
      fechaSociedadInscripta: true,
      fechaInscripcion: true,
      createdAt: true,
      user: { select: { name: true, email: true, partner: { select: { nombre: true } } } },
      domicilioSede: { select: { estado: true, fechaVencimiento: true, montoAnual: true } },
      serviciosContratados: {
        where: { estado: { in: ['ACTIVO', 'INTERESADO'] } },
        select: {
          id: true,
          estado: true,
          monto: true,
          proximoVencimiento: true,
          servicio: { select: { nombre: true, modalidad: true } },
        },
      },
    },
    orderBy: { fechaSociedadInscripta: 'desc' },
  })

  const sociedades: SociedadCartera[] = tramites.map((t) => {
    const domicilioActivo = t.domicilioSede?.estado === 'ACTIVO' ? t.domicilioSede : null
    const activos = t.serviciosContratados.filter((s) => s.estado === 'ACTIVO')

    // El vencimiento más cercano entre los servicios activos y el domicilio.
    const vencimientos = [
      ...activos.filter((s) => s.proximoVencimiento).map((s) => ({ que: s.servicio.nombre, fecha: s.proximoVencimiento! })),
      ...(domicilioActivo?.fechaVencimiento ? [{ que: 'Domicilio en sede', fecha: domicilioActivo.fechaVencimiento }] : []),
    ].sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
    const proximo = vencimientos[0]

    return {
      id: t.id,
      denominacion: t.denominacionAprobada || t.denominacionSocial1,
      cliente: t.user.name || t.user.email,
      partner: t.user.partner?.nombre ?? null,
      cuit: t.cuit,
      plan: t.plan,
      jurisdiccion: t.jurisdiccion,
      inscripta: (t.fechaSociedadInscripta || t.fechaInscripcion || t.createdAt).toISOString(),
      domicilio: t.domicilioSede
        ? {
            estado: t.domicilioSede.estado,
            vence: t.domicilioSede.fechaVencimiento?.toISOString() ?? null,
          }
        : null,
      servicios: activos.map((s) => ({ id: s.id, nombre: s.servicio.nombre })),
      oportunidades: t.serviciosContratados
        .filter((s) => s.estado === 'INTERESADO')
        .map((s) => ({ id: s.id, nombre: s.servicio.nombre })),
      ingresoMensual:
        activos.reduce((a, s) => a + ingresoMensual(s.monto, s.servicio.modalidad as Modalidad), 0) +
        ingresoMensual(domicilioActivo?.montoAnual, 'ANUAL'),
      proximoVencimiento: proximo ? { que: proximo.que, fecha: proximo.fecha.toISOString(), dias: diasHasta(proximo.fecha) } : null,
    }
  })

  return (
    <div className="space-y-section">
      <PageHeader
        title="Sociedades"
        description="Tu cartera de clientes: qué tiene contratado cada uno, qué vence y a quién ofrecerle algo más."
        breadcrumbs={[{ label: 'Hoy', href: '/dashboard/admin' }, { label: 'Sociedades' }]}
      />
      <CarteraLista
        sociedades={sociedades}
        filtroInicial={filtro === 'vencen' ? 'VENCEN' : filtro === 'oportunidades' ? 'OPORTUNIDADES' : 'TODAS'}
      />
    </div>
  )
}
