import HomePage from '@/components/landing/HomePage'
import { prisma } from '@/lib/prisma'
import { getPublicConfig } from '@/lib/config'
import type { NotaCard } from '@/components/landing/NotasClient'
import type { Jurisdiccion } from '@/components/landing/GastosJurisdiccion'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

// ISR: regenerar la home cada 5 min para reflejar cambios en notas destacadas
// (igual que /blog y /blog/[slug]). Sin esto la home queda estática desde el build.
export const revalidate = 300

async function leerDestacadas(): Promise<NotaCard[]> {
  if (!process.env.DATABASE_URL) return []
  try {
    const posts = await prisma.post.findMany({
      where: { publicado: true, destacado: true },
      take: 4,
      orderBy: { fechaPublicacion: 'desc' },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        slug: true,
        categoria: true,
        lectura: true,
        imagenHero: true,
        imagenAlt: true,
        fechaPublicacion: true,
      },
    })
    return posts.map((p) => ({
      ...p,
      fechaPublicacion: p.fechaPublicacion.toISOString(),
    }))
  } catch {
    return []
  }
}

// Antes la sección de gastos las pedía a /api/jurisdicciones en cada visita.
async function leerJurisdicciones(): Promise<Jurisdiccion[]> {
  if (!process.env.DATABASE_URL) return []
  try {
    const filas = await prisma.gastoJurisdiccion.findMany({ orderBy: { orden: 'asc' } })
    return filas.map((j) => ({
      id: j.id,
      jurisdiccion: j.jurisdiccion,
      nombre: j.nombre,
      habilitada: j.habilitada,
      gastos: (j.gastos as Jurisdiccion['gastos']) ?? [],
      totalEstimado: j.totalEstimado,
      orden: j.orden,
    }))
  } catch {
    return []
  }
}

export default async function Page() {
  // Precios leídos en el servidor para que las tarjetas de #planes se rendericen
  // con los valores reales de la DB en el HTML inicial (sin depender de un fetch
  // client-side que dejaba precios viejos hardcodeados a los crawlers).
  const [destacadas, jurisdicciones, config] = await Promise.all([
    leerDestacadas(),
    leerJurisdicciones(),
    getPublicConfig(),
  ])
  const { precioPlanBasico, precioPlanEmprendedor, precioPlanPremium } = config

  return (
    <HomePage
      destacadas={destacadas}
      jurisdicciones={jurisdicciones}
      precios={{ precioPlanBasico, precioPlanEmprendedor, precioPlanPremium }}
    />
  )
}
