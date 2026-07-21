import HomePage from '@/components/landing/HomePage'
import { prisma } from '@/lib/prisma'
import type { NotaCard } from '@/components/landing/NotasClient'

// ISR: regenerar la home cada 5 min para reflejar cambios en notas destacadas
// (igual que /blog y /blog/[slug]). Sin esto la home queda estática desde el build.
export const revalidate = 300

export default async function Page() {
  let destacadas: NotaCard[] = []

  if (process.env.DATABASE_URL) {
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
      destacadas = posts.map((p) => ({
        ...p,
        fechaPublicacion: p.fechaPublicacion.toISOString(),
      }))
    } catch {
      destacadas = []
    }
  }

  return <HomePage destacadas={destacadas} />
}
