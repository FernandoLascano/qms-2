import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import BlogPostContent from './BlogPostContent'

interface Props {
  params: Promise<{ slug: string }>
}

// Generar metadata dinámica para SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await prisma.post.findUnique({
    where: { slug, publicado: true },
    select: {
      titulo: true,
      descripcion: true,
      metaTitle: true,
      metaDescription: true,
      keywords: true,
      canonical: true,
      imagenHero: true,
      imagenAlt: true,
      categoria: true,
      autor: true,
      fechaPublicacion: true,
    }
  })

  if (!post) {
    return {
      title: 'Artículo no encontrado | QuieroMiSAS',
    }
  }

  const title = post.metaTitle || `${post.titulo} | QuieroMiSAS`
  const description = post.metaDescription || post.descripcion

  return {
    title,
    description,
    keywords: post.keywords?.length ? post.keywords : undefined,
    openGraph: {
      title,
      description,
      type: 'article',
      locale: 'es_AR',
      siteName: 'QuieroMiSAS',
      publishedTime: post.fechaPublicacion.toISOString(),
      authors: post.autor ? [post.autor] : undefined,
      images: post.imagenHero ? [{
        url: post.imagenHero,
        alt: post.imagenAlt || post.titulo,
      }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.imagenHero ? [post.imagenHero] : undefined,
    },
    alternates: {
      canonical: post.canonical || `https://www.quieromisas.com/blog/${slug}`,
    },
  }
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const post = await prisma.post.findUnique({
    where: { slug, publicado: true },
  })

  if (!post) {
    notFound()
  }

  // Incrementar vistas en background (no bloquea el render)
  prisma.post.update({
    where: { slug },
    data: { vistas: { increment: 1 } }
  }).catch(() => {})

  // Serializar datos para el client component
  const postData = {
    ...post,
    fechaPublicacion: post.fechaPublicacion.toISOString(),
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    contenido: post.contenido as any,
  }

  return (
    <>
      {/* Schema JSON-LD para el artículo */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": post.titulo,
            "description": post.descripcion,
            "image": post.imagenHero || undefined,
            "author": {
              "@type": "Organization",
              "name": post.autor || "QuieroMiSAS"
            },
            "publisher": {
              "@type": "Organization",
              "name": "QuieroMiSAS",
              "logo": {
                "@type": "ImageObject",
                "url": "https://www.quieromisas.com/assets/img/qms-logo-reg.png"
              }
            },
            "datePublished": post.fechaPublicacion.toISOString(),
            "dateModified": post.updatedAt.toISOString(),
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `https://www.quieromisas.com/blog/${slug}`
            }
          })
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://www.quieromisas.com" },
              { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://www.quieromisas.com/blog" },
              { "@type": "ListItem", "position": 3, "name": post.titulo, "item": `https://www.quieromisas.com/blog/${slug}` }
            ]
          })
        }}
      />
      <BlogPostContent post={postData} />
    </>
  )
}
