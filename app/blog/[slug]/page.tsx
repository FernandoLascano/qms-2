'use client'

import Link from 'next/link'
import { Calendar, Clock, Tag, ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'

interface Post {
  id: string
  titulo: string
  descripcion: string
  slug: string
  categoria: string
  tags: string[]
  autor: string | null
  lectura: string
  imagenHero: string | null
  imagenAlt: string | null
  contenido: {
    sections: Array<{
      type: string
      content?: string
      items?: string[]
    }>
  }
  fechaPublicacion: string
  vistas: number
}

export default function PostPage() {
  const params = useParams()
  const slug = params?.slug as string
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (slug) {
      fetchPost()
    }
  }, [slug])

  // También necesitamos agregar fetchPost como dependencia para evitar warnings
  // eslint-disable-next-line react-hooks/exhaustive-deps

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/blog/slug/${slug}`)
      if (!res.ok) {
        setError(true)
        return
      }
      const data = await res.json()
      setPost(data)
    } catch (error) {
      console.error('Error al cargar post:', error)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const renderSection = (section: any, index: number) => {
    switch (section.type) {
      case 'h2':
        return (
          <h2 key={index} className="text-2xl md:text-3xl font-bold text-red-900 mt-8 mb-4 first:mt-0">
            {section.text || section.content}
          </h2>
        )
      case 'p':
        return (
          <p key={index} className="text-gray-700 leading-relaxed mb-4 text-lg">
            {section.text || section.content}
          </p>
        )
      case 'list':
        return (
          <ul key={index} className="list-disc list-inside space-y-3 mb-6">
            {section.items?.map((item: string, i: number) => (
              <li key={i} className="text-gray-700 leading-relaxed text-lg">
                {item}
              </li>
            ))}
          </ul>
        )
      case 'quote':
        return (
          <blockquote key={index} className="border-l-4 border-red-700 pl-6 italic text-gray-700 mb-6 my-8 text-lg">
            {section.text || section.content}
          </blockquote>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700 mx-auto"></div>
          <p className="text-gray-600 mt-4">Cargando post...</p>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <Link href="/" className="inline-block">
              <img
                src="/assets/img/logo4.png"
                alt="QuieroMiSAS Logo"
                className="h-12 w-auto"
              />
            </Link>
          </div>
        </header>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Post no encontrado</h1>
          <p className="text-gray-600 mb-8">El artículo que buscas no existe o fue eliminado.</p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 bg-red-700 text-white px-6 py-3 rounded-lg hover:bg-red-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al blog
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      <Navbar currentPage="blog" />

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/" className="hover:text-red-700 transition">
            Inicio
          </Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-red-700 transition">
            Blog
          </Link>
          <span>/</span>
          <span className="text-gray-900">{post.titulo}</span>
        </div>
      </div>

      {/* Hero Image */}
      {post.imagenHero && (
        <div className="container mx-auto px-4 max-w-4xl mb-8">
          <div className="rounded-2xl overflow-hidden shadow-xl">
            <img
              src={post.imagenHero}
              alt={post.imagenAlt || post.titulo}
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      )}

      {/* Article Content */}
      <article className="container mx-auto px-4 pb-20 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
            <span className="bg-red-100 text-red-700 px-4 py-2 rounded-full font-bold border border-red-200">
              {post.categoria}
            </span>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{new Date(post.fechaPublicacion).toLocaleDateString('es-AR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{post.lectura}</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-red-900 mb-6 leading-tight">
            {post.titulo}
          </h1>

          {/* Description */}
          <p className="text-xl text-gray-700 mb-8 leading-relaxed font-medium border-l-4 border-red-700 pl-6 italic">
            {post.descripcion}
          </p>

          {/* Author */}
          {post.autor && (
            <p className="text-gray-600 mb-8">
              Por <span className="font-semibold text-red-700">{post.autor}</span>
            </p>
          )}

          {/* Content Sections */}
          <div className="prose prose-lg max-w-none">
            {Array.isArray(post.contenido)
              ? post.contenido.map((section, index) => renderSection(section, index))
              : post.contenido?.sections?.map((section, index) => renderSection(section, index))
            }
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="w-5 h-5 text-gray-600" />
                <span className="text-gray-600 font-semibold">Etiquetas:</span>
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-12 bg-gradient-to-r from-red-700 to-red-900 text-white rounded-xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-3">¿Listo para constituir tu S.A.S.?</h3>
            <p className="text-lg mb-6 opacity-90">
              Empezá tu trámite hoy y tené tu empresa lista en 5 días
            </p>
            <Link
              href="/registro"
              className="inline-block bg-white text-red-700 px-8 py-3 rounded-lg hover:bg-gray-100 transition font-semibold shadow-lg"
            >
              Comenzar ahora
            </Link>
          </div>

          {/* Back to Blog */}
          <div className="mt-8 text-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-red-700 font-semibold hover:text-red-800 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al blog
            </Link>
          </div>
        </div>
      </article>

      {/* Footer Simple */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            &copy; 2024 QuieroMiSAS by Martínez Wehbe & Asociados. Todos los derechos reservados.
          </p>
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <Link href="/" className="hover:text-white transition">
              Inicio
            </Link>
            <Link href="/terminos" className="hover:text-white transition">
              Términos
            </Link>
            <Link href="/privacidad" className="hover:text-white transition">
              Privacidad
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
