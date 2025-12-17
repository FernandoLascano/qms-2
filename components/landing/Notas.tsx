import { Calendar, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const notas = [
  {
    titulo: 'La importancia de contar con una Sociedad para emprender en Argentina',
    descripcion: 'Descubrí por qué formalizar tu emprendimiento con una Sociedad es fundamental. Separación patrimonial, credibilidad y protección legal para tu negocio.',
    fecha: '20 Dic 2024',
    lectura: '3 min',
    categoria: 'Emprendimiento',
    slug: 'importancia-contar-sociedad-emprender-argentina',
    imagen: '/assets/img/nota.png'
  },
  {
    titulo: 'Guía Práctica: Constitución de Sociedades en Argentina',
    descripcion: 'Todo lo que necesitás saber sobre tipos de sociedades, requisitos y el proceso paso a paso para constituir tu empresa de forma sencilla.',
    fecha: '18 Dic 2024',
    lectura: '5 min',
    categoria: 'Guías',
    slug: 'guia-practica-constitucion-sociedades-argentina',
    imagen: '/assets/img/nota2.png'
  },
  {
    titulo: 'Costos 2025 para Constituir una SAS en Argentina: Guía Completa y Comparativa',
    descripcion: 'Análisis detallado de costos por jurisdicción. Comparativa entre Córdoba, CABA, Buenos Aires y Mendoza. Consejos para optimizar tu inversión inicial.',
    fecha: '15 Dic 2024',
    lectura: '4 min',
    categoria: 'Costos',
    slug: 'costos-2025-constituir-sas-argentina-guia-completa',
    imagen: '/assets/img/nota3.png'
  },
  {
    titulo: 'S.A.S. vs S.R.L.: ¿Cuál conviene más para tu emprendimiento?',
    descripcion: 'Comparativa detallada entre los dos tipos societarios más populares para PyMEs. Analizamos ventajas, desventajas, costos y tiempos de cada uno.',
    fecha: '12 Dic 2024',
    lectura: '6 min',
    categoria: 'Comparativas',
    slug: 'sas-vs-srl-cual-conviene-mas',
    imagen: '/assets/img/comparativa-sas-srl.png'
  }
]

export function Notas() {
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
          {notas.map((nota, index) => (
            <article
              key={index}
              className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-red-200 transition-all duration-300 group"
            >
              {/* Imagen */}
              <div className="h-56 bg-gradient-to-br from-red-50 to-orange-50 overflow-hidden relative">
                {nota.imagen ? (
                  <img 
                    src={nota.imagen} 
                    alt={nota.titulo}
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
                    <span>{nota.fecha}</span>
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
          ))}
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

