'use client'

import { Calendar, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

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

      // Asegurar que data sea un array
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
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700 mx-auto"></div>
            <p className="text-gray-600 mt-4">Cargando notas...</p>
          </div>
        </div>
      </section>
    )
  }
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-red-900">Recursos y Notas</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Información actualizada sobre sociedades, trámites y legislación en Argentina
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {notas.length === 0 ? (
            <div className="col-span-2 text-center py-12">
              <p className="text-gray-600">No hay notas publicadas aún</p>
            </div>
          ) : (
            notas.map((nota) => (
              <article
                key={nota.id}
                className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-red-200 transition-all duration-300 group"
              >
                {/* Imagen */}
                <div className="h-56 bg-gradient-to-br from-red-50 to-orange-50 overflow-hidden relative">
                  {nota.imagenHero ? (
                    <img
                      src={nota.imagenHero}
                      alt={nota.imagenAlt || nota.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
                      <div className="text-gray-300 text-6xl">📄</div>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  {/* Categoría */}
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <span className="text-xs font-bold text-red-700 bg-red-100 px-3 py-1.5 rounded-full border border-red-200">
                      {nota.categoria}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(nota.fechaPublicacion).toLocaleDateString('es-AR')}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{nota.lectura}</span>
                    </div>
                  </div>

                  {/* Título */}
                  <h3 className="text-xl md:text-2xl font-bold mb-3 text-gray-900 group-hover:text-red-700 transition-colors leading-tight">
                    <Link href={`/blog/${nota.slug}`} className="hover:underline">
                      {nota.titulo}
                    </Link>
                  </h3>

                  {/* Descripción */}
                  <p className="text-gray-800 mb-5 line-clamp-4 leading-relaxed">
                    {nota.descripcion}
                  </p>

                  {/* Link */}
                  <Link
                    href={`/blog/${nota.slug}`}
                    className="inline-flex items-center gap-2 text-red-700 font-bold hover:text-red-800 hover:gap-3 transition-all group/link"
                  >
                    Leer más
                    <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>

        {/* CTA Blog */}
        <div className="mt-12 text-center">
          <Link
            href="/blog"
            className="inline-block border-2 border-red-700 text-red-700 px-8 py-3 rounded-lg hover:bg-red-50 transition font-semibold"
          >
            Ver todas las notas
          </Link>
        </div>
      </div>
    </section>
  )
}

