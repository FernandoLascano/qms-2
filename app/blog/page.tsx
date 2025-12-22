'use client'

import Link from 'next/link'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'

interface Post {
  id: string
  titulo: string
  descripcion: string
  slug: string
  categoria: string
  lectura: string
  imagenHero: string | null
  imagenAlt: string | null
  fechaPublicacion: string
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/blog?publico=true')
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      const data = await res.json()
      if (Array.isArray(data)) {
        setPosts(data)
      } else {
        console.error('La respuesta no es un array:', data)
        setPosts([])
      }
    } catch (error) {
      console.error('Error al cargar posts:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700 mx-auto"></div>
          <p className="text-gray-600 mt-4">Cargando posts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      <Navbar currentPage="blog" />

      {/* Hero del Blog */}
      <section className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-red-900 mb-4">
            Blog y Recursos
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Información actualizada sobre sociedades, trámites y legislación en Argentina.
            Guías prácticas para emprendedores.
          </p>
        </div>

        {/* Lista de Posts */}
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 text-lg">
              Pronto publicaremos contenido nuevo. ¡Volvé pronto!
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-red-200 transition-all duration-300 group"
              >
                {/* Imagen */}
                <div className="h-56 bg-gradient-to-br from-red-50 to-orange-50 overflow-hidden relative">
                  {post.imagenHero ? (
                    <img
                      src={post.imagenHero}
                      alt={post.imagenAlt || post.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
                      <div className="text-gray-300 text-6xl">📄</div>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  {/* Categoría y Metadata */}
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <span className="text-xs font-bold text-red-700 bg-red-100 px-3 py-1.5 rounded-full border border-red-200">
                      {post.categoria}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {new Date(post.fechaPublicacion).toLocaleDateString('es-AR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{post.lectura}</span>
                    </div>
                  </div>

                  {/* Título */}
                  <h2 className="text-xl md:text-2xl font-bold mb-3 text-gray-900 group-hover:text-red-700 transition-colors leading-tight">
                    <Link href={`/blog/${post.slug}`} className="hover:underline">
                      {post.titulo}
                    </Link>
                  </h2>

                  {/* Descripción */}
                  <p className="text-gray-800 mb-5 line-clamp-3 leading-relaxed">
                    {post.descripcion}
                  </p>

                  {/* Link */}
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-2 text-red-700 font-bold hover:text-red-800 hover:gap-3 transition-all group/link"
                  >
                    Leer más
                    <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-red-700 to-red-900 text-white rounded-2xl p-12">
            <h2 className="text-3xl font-bold mb-4">¿Listo para constituir tu S.A.S.?</h2>
            <p className="text-xl mb-6 opacity-90">
              Empezá tu trámite hoy y tené tu empresa lista en 5 días
            </p>
            <Link
              href="/registro"
              className="inline-flex items-center gap-2 bg-white text-red-700 px-8 py-4 rounded-lg hover:bg-gray-100 transition font-semibold text-lg shadow-lg"
            >
              Comenzar ahora
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

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
