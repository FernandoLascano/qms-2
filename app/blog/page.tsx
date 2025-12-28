'use client'

import Link from 'next/link'
import { Calendar, Clock, ArrowRight, BookOpen, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
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
  const [searchTerm, setSearchTerm] = useState('')

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

  const filteredPosts = posts.filter(post =>
    post.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700 mx-auto"></div>
          <p className="text-gray-500 mt-4">Cargando artículos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar currentPage="blog" />

      {/* Hero del Blog */}
      <section className="bg-gradient-to-b from-red-50 to-white py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-red-700 font-semibold text-sm tracking-wider uppercase mb-4">
              Blog
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6">
              Recursos y{' '}
              <span className="text-red-700">notas</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-500 max-w-3xl mx-auto mb-8">
              Información actualizada sobre sociedades, trámites y legislación en Argentina.
              Guías prácticas para emprendedores.
            </p>

            {/* Buscador */}
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar artículos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-red-300 focus:ring-2 focus:ring-red-100 outline-none transition-all text-gray-700"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Lista de Posts */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          {filteredPosts.length === 0 ? (
            <motion.div
              className="text-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg font-medium mb-2">
                {searchTerm ? 'No se encontraron resultados' : 'Pronto publicaremos contenido nuevo'}
              </p>
              <p className="text-gray-400">
                {searchTerm ? 'Intentá con otros términos de búsqueda' : '¡Volvé pronto!'}
              </p>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {filteredPosts.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-red-200 hover:shadow-xl transition-all duration-300"
                >
                  {/* Imagen */}
                  <div className="h-52 bg-gradient-to-br from-red-50 to-orange-50 overflow-hidden relative">
                    {post.imagenHero ? (
                      <img
                        src={post.imagenHero}
                        alt={post.imagenAlt || post.titulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-16 h-16 bg-white/80 rounded-2xl flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-red-300" />
                        </div>
                      </div>
                    )}
                    {/* Categoría badge */}
                    <div className="absolute top-4 left-4">
                      <span className="text-xs font-bold text-white bg-red-700 px-3 py-1.5 rounded-full shadow-lg">
                        {post.categoria}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Meta info */}
                    <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(post.fechaPublicacion).toLocaleDateString('es-AR')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{post.lectura}</span>
                      </div>
                    </div>

                    {/* Título */}
                    <h2 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-red-700 transition-colors leading-tight">
                      <Link href={`/blog/${post.slug}`}>
                        {post.titulo}
                      </Link>
                    </h2>

                    {/* Descripción */}
                    <p className="text-gray-600 mb-5 line-clamp-3 leading-relaxed text-sm">
                      {post.descripcion}
                    </p>

                    {/* Link */}
                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-2 text-red-700 font-semibold hover:text-red-800 transition-colors group/link"
                    >
                      Leer artículo
                      <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white rounded-3xl p-10 md:p-14 text-center shadow-2xl"
          >
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              ¿Listo para constituir tu S.A.S.?
            </h2>
            <p className="text-lg md:text-xl mb-8 text-gray-300">
              Empezá tu trámite hoy y tené tu empresa lista en 5 días
            </p>
            <Link
              href="/registro"
              className="inline-flex items-center gap-3 bg-red-700 text-white px-8 py-4 rounded-xl hover:bg-red-800 transition-colors font-bold text-lg shadow-lg shadow-red-900/30"
            >
              Comenzar ahora
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
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
