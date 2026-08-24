import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { SITE_URL as baseUrl } from '@/lib/seo/site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  // Páginas estáticas
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/registro`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    // Legales: bajan poco tráfico pero Google las usa como señal de que hay
    // una empresa real detrás del sitio.
    {
      url: `${baseUrl}/terminos`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacidad`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
  ]

  // Obtener posts publicados del blog
  let blogPosts: MetadataRoute.Sitemap = []
  try {
    const posts = await prisma.post.findMany({
      where: { publicado: true },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: { fechaPublicacion: 'desc' },
    })

    blogPosts = posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch (error) {
    console.error('Error fetching posts for sitemap:', error)
    // Si hay error con la DB, continuar sin posts
  }

  return [...staticPages, ...blogPosts]
}
