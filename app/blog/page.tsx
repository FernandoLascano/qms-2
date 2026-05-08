import { prisma } from '@/lib/prisma'
import BlogIndexClient from '@/components/blog/BlogIndexClient'

export const revalidate = 300

export default async function BlogPage() {
  let initialPosts: {
    id: string
    titulo: string
    descripcion: string
    slug: string
    categoria: string
    lectura: string
    imagenHero: string | null
    imagenAlt: string | null
    fechaPublicacion: string
  }[] = []

  if (process.env.DATABASE_URL) {
    try {
      const posts = await prisma.post.findMany({
        where: { publicado: true },
        orderBy: { fechaPublicacion: 'desc' },
        take: 50,
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
      initialPosts = posts.map((p) => ({
        ...p,
        fechaPublicacion: p.fechaPublicacion.toISOString(),
      }))
    } catch {
      initialPosts = []
    }
  }

  return <BlogIndexClient initialPosts={initialPosts} />
}
