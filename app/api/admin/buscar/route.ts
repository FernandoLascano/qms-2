import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export interface ResultadoBusqueda {
  tipo: 'tramite' | 'borrador' | 'lead' | 'usuario'
  titulo: string
  detalle: string
  href: string
}

const POR_GRUPO = 6

/**
 * GET ?q= — Búsqueda del panel admin (⌘K): trámites por denominación, CUIT o
 * matrícula; clientes por nombre, email o teléfono; consultas de la web.
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const q = new URL(request.url).searchParams.get('q')?.trim().slice(0, 100) ?? ''
  if (q.length < 2) return NextResponse.json({ resultados: [] })

  const contiene = { contains: q, mode: 'insensitive' as const }
  const porUsuario = { user: { OR: [{ name: contiene }, { email: contiene }, { phone: contiene }] } }

  const [tramites, leads, usuarios] = await Promise.all([
    prisma.tramite.findMany({
      where: {
        OR: [
          { denominacionSocial1: contiene },
          { denominacionSocial2: contiene },
          { denominacionSocial3: contiene },
          { denominacionAprobada: contiene },
          { cuit: contiene },
          { matricula: contiene },
          porUsuario,
        ],
      },
      select: {
        id: true, denominacionSocial1: true, denominacionAprobada: true, formularioCompleto: true,
        cuit: true, sociedadInscripta: true, user: { select: { name: true, email: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: POR_GRUPO * 2,
    }),
    prisma.lead.findMany({
      where: { OR: [{ nombre: contiene }, { email: contiene }, { telefono: contiene }] },
      select: { id: true, nombre: true, email: true, telefono: true },
      orderBy: { createdAt: 'desc' },
      take: POR_GRUPO,
    }),
    // Usuarios sin ningún trámite (los que tienen, ya salen arriba).
    prisma.user.findMany({
      where: { OR: [{ name: contiene }, { email: contiene }, { phone: contiene }], tramites: { none: {} } },
      select: { id: true, name: true, email: true },
      take: POR_GRUPO,
    }),
  ])

  const nombre = (t: { denominacionSocial1: string; denominacionAprobada: string | null }) =>
    t.denominacionAprobada || (t.denominacionSocial1 === 'Pendiente de definir' ? 'Sin denominación' : t.denominacionSocial1)
  const cliente = (u: { name: string | null; email: string }) => u.name || u.email

  const resultados: ResultadoBusqueda[] = [
    ...tramites.filter((t) => t.formularioCompleto).slice(0, POR_GRUPO).map((t) => ({
      tipo: 'tramite' as const,
      titulo: nombre(t),
      detalle: [cliente(t.user), t.sociedadInscripta ? 'Inscripta' : 'En curso', t.cuit && `CUIT ${t.cuit}`].filter(Boolean).join(' · '),
      href: `/dashboard/admin/tramites/${t.id}`,
    })),
    ...tramites.filter((t) => !t.formularioCompleto).slice(0, POR_GRUPO).map((t) => ({
      tipo: 'borrador' as const,
      titulo: nombre(t),
      detalle: `${cliente(t.user)} · Formulario sin terminar`,
      href: `/dashboard/admin/leads?lead=${t.id}`,
    })),
    ...leads.map((l) => ({
      tipo: 'lead' as const,
      titulo: l.nombre || l.email || l.telefono || 'Sin nombre',
      detalle: [l.email, l.telefono].filter(Boolean).join(' · ') || 'Consulta',
      href: `/dashboard/admin/leads?lead=${l.id}`,
    })),
    ...usuarios.map((u) => ({
      tipo: 'usuario' as const,
      titulo: u.name || u.email,
      detalle: `${u.email} · Sin trámites`,
      href: `/dashboard/admin/usuarios`,
    })),
  ]

  return NextResponse.json({ resultados })
}
