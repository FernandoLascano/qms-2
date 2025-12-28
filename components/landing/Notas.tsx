'use client'

import { Calendar, Clock, ArrowRight, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface Nota {
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

export function Notas() {
  const [notas, setNotas] = useState<Nota[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotas()
  }, [])

  const fetchNotas = async () => {
    try {
      const res = await fetch('/api/blog?publico=true&destacados=true&limit=4')

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const data = await res.json()

      if (Array.isArray(data)) {
        setNotas(data)
      } else {
        console.error('La respuesta no es un array:', data)
        setNotas([])
      }
    } catch (error) {
      console.error('Error al cargar notas:', error)
      setNotas([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700 mx-auto"></div>
            <p className="text-gray-500 mt-4">Cargando notas...</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 md:py-28 bg-white overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header con nuevo diseño */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block text-red-700 font-semibold text-sm tracking-wider uppercase mb-4">
            Blog
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            Recursos y{' '}
            <span className="text-red-700">notas</span>
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Información actualizada sobre sociedades, trámites y legislación en Argentina
          </p>
        </motion.div>

        {/* Grid de notas */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {notas.length === 0 ? (
            <motion.div
              className="col-span-2"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No hay notas publicadas aún</p>
                <p className="text-gray-400 text-sm mt-1">Pronto agregaremos contenido nuevo</p>
              </div>
            </motion.div>
          ) : (
            notas.map((nota, index) => (
              <motion.article
                key={nota.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-red-200 hover:shadow-xl transition-all duration-300"
              >
                {/* Imagen */}
                <div className="h-52 bg-gradient-to-br from-red-50 to-orange-50 overflow-hidden relative">
                  {nota.imagenHero ? (
                    <img
                      src={nota.imagenHero}
                      alt={nota.imagenAlt || nota.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/80 rounded-2xl flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-red-300" />
                      </div>
                    </div>
                  )}
                  {/* Categoría badge sobre imagen */}
                  <div className="absolute top-4 left-4">
                    <span className="text-xs font-bold text-white bg-red-700 px-3 py-1.5 rounded-full shadow-lg">
                      {nota.categoria}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  {/* Meta info */}
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(nota.fechaPublicacion).toLocaleDateString('es-AR')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>{nota.lectura}</span>
                    </div>
                  </div>

                  {/* Título */}
                  <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-red-700 transition-colors leading-tight">
                    <Link href={`/blog/${nota.slug}`}>
                      {nota.titulo}
                    </Link>
                  </h3>

                  {/* Descripción */}
                  <p className="text-gray-600 mb-5 line-clamp-3 leading-relaxed text-sm">
                    {nota.descripcion}
                  </p>

                  {/* Link */}
                  <Link
                    href={`/blog/${nota.slug}`}
                    className="inline-flex items-center gap-2 text-red-700 font-semibold hover:text-red-800 transition-colors group/link"
                  >
                    Leer artículo
                    <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.article>
            ))
          )}
        </div>

        {/* CTA Blog */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 border-2 border-red-700 text-red-700 px-8 py-3 rounded-xl hover:bg-red-50 transition-colors font-semibold"
          >
            Ver todas las notas
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
