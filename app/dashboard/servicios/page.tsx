import { getServerSession } from 'next-auth'
import { Handshake } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ServiciosCatalogo from '@/components/cliente/ServiciosCatalogo'

export const metadata = {
  title: 'Servicios'
}

export default async function ServiciosPage() {
  const session = await getServerSession(authOptions)
  // El catálogo sale de la base para que los precios se editen desde el panel
  // (Configuración → Catálogo de servicios) y no haga falta tocar código.
  const [servicios, contratados] = await Promise.all([
    prisma.servicioCatalogo.findMany({
      where: { activo: true },
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
      select: {
        id: true,
        slug: true,
        nombre: true,
        descripcion: true,
        icono: true,
        modalidad: true,
        precioDesde: true,
        precioTexto: true,
      },
    }),
    // Lo que ya tiene contratado no se le vuelve a ofrecer como nuevo.
    session?.user?.id
      ? prisma.servicioContratado.findMany({
          where: { tramite: { userId: session.user.id }, estado: 'ACTIVO' },
          select: { servicio: { select: { slug: true } } },
        })
      : Promise.resolve([]),
  ])

  return (
    <div className="space-y-section">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-soft ring-1 ring-primary-line" aria-hidden>
          <Handshake className="h-6 w-6 text-primary" />
        </span>
        <div>
          <h1 className="text-display text-ink">Servicios para tu <span className="text-primary">sociedad</span></h1>
          <p className="mt-1 max-w-2xl text-body text-ink-2">
            Constituir es el primer paso. Te acompañamos con la contabilidad, la marca y todos los trámites que vengan
            después, con el mismo equipo que ya conoce tu sociedad.
          </p>
        </div>
      </div>

      <ServiciosCatalogo servicios={servicios} contratados={contratados.map((c) => c.servicio.slug)} />
    </div>
  )
}
