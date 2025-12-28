'use client'

import { Star, Quote, TrendingUp, Clock, HeadphonesIcon, Building2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

const testimonios = [
  {
    nombre: 'María González',
    empresa: 'Tech Innovate SAS',
    puesto: 'CEO & Founder',
    testimonio: 'Increíble experiencia. En menos de una semana teníamos todo listo para empezar a facturar. La plataforma es súper clara y el soporte respondió todas nuestras dudas al instante.',
    rating: 5,
    destacado: false
  },
  {
    nombre: 'Luciano Martínez',
    empresa: 'Estudio Contable LM',
    puesto: 'Contador Público',
    testimonio: 'Como contador, he trabajado con muchas plataformas de constitución. QuieroMiSAS es, sin dudas, la más eficiente. Los documentos llegaron perfectos y el proceso fue transparente de principio a fin.',
    rating: 5,
    destacado: true
  },
  {
    nombre: 'Ana Rodríguez',
    empresa: 'Marketing Digital AR',
    puesto: 'Directora Comercial',
    testimonio: 'Necesitábamos constituir la S.A.S. urgente para cerrar un contrato. El equipo se movió super rápido, cumplieron con los tiempos prometidos y nos salvaron. 100% recomendable.',
    rating: 5,
    destacado: false
  }
]

const stats = [
  { valor: '500+', label: 'Empresas constituidas', icon: Building2 },
  { valor: '4.9/5', label: 'Calificación promedio', icon: Star },
  { valor: '5 días', label: 'Tiempo promedio', icon: Clock },
  { valor: '24/7', label: 'Soporte disponible', icon: HeadphonesIcon }
]

export function Testimonios() {
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })

  return (
    <section ref={sectionRef} className="py-24 bg-gradient-to-b from-white via-gray-50 to-white overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header con diseño más impactante */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block text-red-700 font-semibold text-sm tracking-wider uppercase mb-4">
            Testimonios
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            Historias de{' '}
            <span className="text-red-700">éxito</span>
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Emprendedores que confiaron en nosotros y hoy tienen su empresa funcionando
          </p>
        </motion.div>

        {/* Testimonios con diseño de cards elevadas */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto mb-20">
          {testimonios.map((testimonio, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className={`relative group ${testimonio.destacado ? 'md:-mt-4 md:mb-4' : ''}`}
            >
              <div
                className={`relative bg-white rounded-2xl p-8 h-full transition-all duration-300 ${
                  testimonio.destacado
                    ? 'shadow-xl border-2 border-red-100 hover:border-red-200 hover:shadow-2xl'
                    : 'shadow-lg border border-gray-100 hover:shadow-xl hover:border-gray-200'
                }`}
              >
                {/* Icono de comillas decorativo */}
                <div className={`absolute -top-4 -left-2 ${testimonio.destacado ? 'text-red-200' : 'text-gray-200'}`}>
                  <Quote className="w-12 h-12 fill-current" />
                </div>

                {/* Badge destacado */}
                {testimonio.destacado && (
                  <div className="absolute -top-3 right-6">
                    <span className="bg-red-700 text-white text-xs font-bold px-3 py-1 rounded-full">
                      DESTACADO
                    </span>
                  </div>
                )}

                {/* Rating con diseño mejorado */}
                <div className="flex gap-1 mb-5 pt-2">
                  {[...Array(testimonio.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        testimonio.destacado
                          ? 'fill-red-500 text-red-500'
                          : 'fill-amber-400 text-amber-400'
                      }`}
                    />
                  ))}
                </div>

                {/* Testimonio con mejor tipografía */}
                <blockquote className="text-gray-700 mb-8 leading-relaxed text-[15px]">
                  "{testimonio.testimonio}"
                </blockquote>

                {/* Autor con diseño refinado */}
                <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md ${
                      testimonio.destacado
                        ? 'bg-gradient-to-br from-red-600 to-red-800'
                        : 'bg-gradient-to-br from-gray-700 to-gray-900'
                    }`}
                  >
                    {testimonio.nombre.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{testimonio.nombre}</p>
                    <p className="text-sm text-gray-500">{testimonio.puesto}</p>
                    <p className={`text-sm font-semibold ${testimonio.destacado ? 'text-red-700' : 'text-gray-700'}`}>
                      {testimonio.empresa}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Estadísticas con diseño premium */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="max-w-5xl mx-auto"
        >
          <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 md:p-12 shadow-2xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                  className="text-center group"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 mb-4 group-hover:bg-white/20 transition-colors">
                    <stat.icon className="w-6 h-6 text-red-400" />
                  </div>
                  <div className="text-3xl md:text-4xl font-black text-white mb-1">
                    {stat.valor}
                  </div>
                  <div className="text-gray-400 text-sm font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTA sutil */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center mt-10 text-gray-500 text-sm"
        >
          Unite a los más de 500 emprendedores que ya eligieron QuieroMiSAS
        </motion.p>
      </div>
    </section>
  )
}
