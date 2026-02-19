'use client'

import { Check, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { AnimatedList } from './AnimatedList'
import { ParallaxCard } from './ParallaxCard'

// Definición de características por plan
const caracteristicas = [
  { nombre: 'Constitución de Sociedad', basico: true, emprendedor: true, premium: true },
  { nombre: 'Obtención de CUIT', basico: true, emprendedor: true, premium: true },
  { nombre: 'Guía de uso de Libros Digitales', basico: true, emprendedor: true, premium: true },
  { nombre: 'Lista para facturar', basico: false, emprendedor: true, premium: true },
  { nombre: 'Alta de Libros Digitales', basico: false, emprendedor: false, premium: true },
  { nombre: 'Una reunión de asesoría societaria al mes', basico: false, emprendedor: false, premium: true },
]

export function Planes() {
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })
  const [precios, setPrecios] = useState({
    precioPlanBasico: 285000,
    precioPlanEmprendedor: 320000,
    precioPlanPremium: 390000
  })

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        setPrecios({
          precioPlanBasico: data.precioPlanBasico,
          precioPlanEmprendedor: data.precioPlanEmprendedor,
          precioPlanPremium: data.precioPlanPremium
        })
      })
      .catch(err => console.error('Error al cargar precios:', err))
  }, [])

  return (
    <section ref={sectionRef} id="planes" className="py-20 md:py-28 bg-gradient-to-b from-brand-50 to-white">
      <div className="container mx-auto px-4">
        {/* Header con nuevo diseño */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block text-brand-700 font-semibold text-sm tracking-wider uppercase mb-4">
            Planes y Precios
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            Elegí el plan{' '}
            <span className="text-brand-700">ideal</span>
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Ofrecemos distintos servicios según las necesidades que tengas
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Plan Básico */}
          <ParallaxCard intensity={0.15}>
            <motion.div
              className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200 hover:border-brand-300 transition h-full"
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2 text-brand-900">Básico</h3>
              <p className="text-gray-600 text-sm mb-4">Para quienes están comenzando</p>
              <div className="mb-2">
                <span className="text-4xl font-bold text-gray-900">${precios.precioPlanBasico.toLocaleString('es-AR')}</span>
              </div>
              <p className="text-sm text-gray-500">+ gastos</p>
            </div>

            <AnimatedList asList className="space-y-3 mb-8">
              {caracteristicas.map((caracteristica, index) => (
                <span key={index} className="flex items-start gap-2">
                  {caracteristica.basico ? (
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                  )}
                  <span className={`text-sm ${caracteristica.basico ? 'text-gray-700' : 'text-gray-400 italic'}`}>
                    {caracteristica.nombre}
                  </span>
                </span>
              ))}
            </AnimatedList>

            <Link
              href="/registro"
              className="block w-full text-center bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition font-semibold"
            >
              Elegir Plan
            </Link>
          </motion.div>
          </ParallaxCard>

          {/* Plan Emprendedor - Destacado */}
          <ParallaxCard intensity={0.2}>
          <motion.div
            className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-brand-700 hover:border-brand-800 transition transform md:scale-105 relative h-full"
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-brand-700 text-white px-4 py-1 rounded-full text-sm font-semibold">
                MÁS CONTRATADO
              </span>
            </div>

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2 text-brand-900">Emprendedor</h3>
              <p className="text-gray-600 text-sm mb-4">Para emprendedores en crecimiento</p>
              <div className="mb-2">
                <span className="text-4xl font-bold text-brand-700">${precios.precioPlanEmprendedor.toLocaleString('es-AR')}</span>
              </div>
              <p className="text-sm text-gray-500">+ gastos</p>
            </div>

            <AnimatedList asList className="space-y-3 mb-8">
              {caracteristicas.map((caracteristica, index) => (
                <span key={index} className="flex items-start gap-2">
                  {caracteristica.emprendedor ? (
                    <Check className="w-5 h-5 text-brand-700 flex-shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                  )}
                  <span className={`text-sm ${caracteristica.emprendedor ? 'text-gray-700' : 'text-gray-400 italic'}`}>
                    {caracteristica.nombre}
                  </span>
                </span>
              ))}
            </AnimatedList>

            <Link
              href="/registro"
              className="block w-full text-center bg-brand-700 text-white py-3 rounded-lg hover:bg-brand-800 transition font-semibold shadow-lg"
            >
              Elegir Plan
            </Link>
          </motion.div>
          </ParallaxCard>

          {/* Plan Premium */}
          <ParallaxCard intensity={0.15}>
          <motion.div
            className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200 hover:border-brand-300 transition h-full"
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2 text-brand-900">Premium</h3>
              <p className="text-gray-600 text-sm mb-4">Para empresas consolidadas</p>
              <div className="mb-2">
                <span className="text-4xl font-bold text-gray-900">${precios.precioPlanPremium.toLocaleString('es-AR')}</span>
              </div>
              <p className="text-sm text-gray-500">+ gastos</p>
            </div>

            <AnimatedList asList className="space-y-3 mb-8">
              {caracteristicas.map((caracteristica, index) => (
                <span key={index} className="flex items-start gap-2">
                  {caracteristica.premium ? (
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                  )}
                  <span className={`text-sm ${caracteristica.premium ? 'text-gray-700' : 'text-gray-400 italic'}`}>
                    {caracteristica.nombre}
                  </span>
                </span>
              ))}
            </AnimatedList>

            <Link
              href="/registro"
              className="block w-full text-center bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition font-semibold"
            >
              Elegir Plan
            </Link>
          </motion.div>
          </ParallaxCard>
        </div>

        <motion.div
          className="mt-12 text-center text-sm text-gray-600 max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <p>
            <strong>Nota:</strong> Los precios no incluyen las tasas de inscripción de IGJ/IPJ (varían según jurisdicción y capital social)
            ni el depósito del 25% del capital social. Te informamos todos los costos detallados antes de comenzar.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
