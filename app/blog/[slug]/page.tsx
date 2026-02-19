'use client'

import Link from 'next/link'
import { Calendar, Clock, Tag, ArrowLeft, ArrowRight, BookOpen, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
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
          <h2 key={index} className="text-2xl md:text-3xl font-black text-gray-900 mt-10 mb-4 first:mt-0">
            {section.text || section.content}
          </h2>
        )
      case 'p':
        return (
          <p key={index} className="text-gray-600 leading-relaxed mb-5 text-lg">
            {section.text || section.content}
          </p>
        )
      case 'list':
        return (
          <ul key={index} className="space-y-3 mb-6 ml-4">
            {section.items?.map((item: string, i: number) => (
              <li key={i} className="text-gray-600 leading-relaxed text-lg flex items-start gap-3">
                <span className="w-2 h-2 bg-brand-700 rounded-full mt-2.5 flex-shrink-0"></span>
                {item}
              </li>
            ))}
          </ul>
        )
      case 'quote':
        return (
          <blockquote key={index} className="border-l-4 border-brand-700 pl-6 my-8 bg-brand-50 py-4 pr-4 rounded-r-xl">
            <p className="text-gray-700 italic text-lg leading-relaxed">
              {section.text || section.content}
            </p>
          </blockquote>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-700 mx-auto"></div>
          <p className="text-gray-500 mt-4">Cargando artículo...</p>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar currentPage="blog" />
        <div className="container mx-auto px-4 py-20 text-center max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-gray-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Artículo no encontrado</h1>
            <p className="text-gray-500 mb-8">El artículo que buscás no existe o fue eliminado.</p>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 bg-brand-700 text-white px-6 py-3 rounded-xl hover:bg-brand-800 transition-colors font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al blog
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar currentPage="blog" />

      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <motion.div
            className="flex items-center gap-2 text-sm text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Link href="/" className="hover:text-brand-700 transition">
              Inicio
            </Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-brand-700 transition">
              Blog
            </Link>
            <span>/</span>
            <span className="text-gray-900 truncate max-w-[200px]">{post.titulo}</span>
          </motion.div>
        </div>
      </div>

      {/* Hero Image */}
      {post.imagenHero && (
        <motion.div
          className="container mx-auto px-4 max-w-4xl mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="rounded-2xl overflow-hidden shadow-xl">
            <img
              src={post.imagenHero}
              alt={post.imagenAlt || post.titulo}
              className="w-full h-auto object-cover"
            />
          </div>
        </motion.div>
      )}

      {/* Article Content */}
      <article className="container mx-auto px-4 py-10 md:py-16 max-w-4xl">
        <motion.div
          className="bg-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <span className="text-xs font-bold text-white bg-brand-700 px-4 py-2 rounded-full">
              {post.categoria}
            </span>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>{new Date(post.fechaPublicacion).toLocaleDateString('es-AR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{post.lectura}</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-6 leading-tight">
            {post.titulo}
          </h1>

          {/* Description */}
          <div className="border-l-4 border-brand-700 pl-6 mb-8 bg-brand-50 py-4 pr-4 rounded-r-xl">
            <p className="text-xl text-gray-700 leading-relaxed">
              {post.descripcion}
            </p>
          </div>

          {/* Author */}
          {post.autor && (
            <div className="flex items-center gap-3 mb-10 pb-8 border-b border-gray-100">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Escrito por</p>
                <p className="font-semibold text-gray-900">{post.autor}</p>
              </div>
            </div>
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
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-gray-500">
                  <Tag className="w-5 h-5" />
                  <span className="font-semibold">Etiquetas:</span>
                </div>
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <motion.div
            className="mt-12 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white rounded-2xl p-8 md:p-10 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-2xl md:text-3xl font-black mb-3">¿Listo para constituir tu S.A.S.?</h3>
            <p className="text-lg mb-6 text-gray-300">
              Empezá tu trámite hoy y tené tu empresa lista en 5 días
            </p>
            <Link
              href="/registro"
              className="inline-flex items-center gap-2 bg-brand-700 text-white px-8 py-4 rounded-xl hover:bg-brand-800 transition-colors font-bold shadow-lg"
            >
              Comenzar ahora
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>

          {/* Back to Blog */}
          <div className="mt-10 text-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-brand-700 font-semibold hover:text-brand-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al blog
            </Link>
          </div>
        </motion.div>
      </article>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} QuieroMiSAS by Martínez Wehbe & Asociados. Todos los derechos reservados.
          </p>
          <div className="mt-6 flex justify-center gap-8 text-sm">
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
