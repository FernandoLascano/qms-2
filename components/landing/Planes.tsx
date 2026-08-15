'use client'

import { Check, X } from 'lucide-react'
import Link from 'next/link'
import { useRef } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { AnimatedList } from './AnimatedList'
import { ParallaxCard } from './ParallaxCard'
import { PrecioDual } from '@/components/PrecioDual'

// Definición de características por plan
const caracteristicas = [
  { nombre: 'Constitución de Sociedad', basico: true, emprendedor: true, premium: true },
  { nombre: 'Obtención de CUIT', basico: true, emprendedor: true, premium: true },
  { nombre: 'Guía de uso de Libros Digitales', basico: true, emprendedor: true, premium: true },
  { nombre: 'Lista para facturar', basico: false, emprendedor: true, premium: true },
  { nombre: 'Alta de Libros Digitales', basico: false, emprendedor: false, premium: true },
  { nombre: 'Una reunión de asesoría societaria al mes', basico: false, emprendedor: false, premium: true },
]

type PreciosPlanes = {
  precioPlanBasico: number
  precioPlanEmprendedor: number
  precioPlanPremium: number
}

// Los precios llegan como prop desde el server component (app/page.tsx →
// getPublicConfig), así se renderizan en el HTML inicial y los ve cualquier
// request (crawler/curl) sin depender de JavaScript.
export function Planes({ precios }: { precios: PreciosPlanes }) {
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })

  return (
    <section ref={sectionRef} id="planes" className="py-seccion md:py-seccion-lg bg-gradient-to-b from-brand-50 to-surface">
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
          <h2 className="text-display md:text-display-lg font-black text-ink mb-4">
            Elegí el plan{' '}
            <span className="text-brand-700">ideal</span>
          </h2>
          <p className="text-lead text-ink-3 max-w-2xl mx-auto">
            Ofrecemos distintos servicios según las necesidades que tengas
          </p>
          <p className="text-body-lg font-semibold text-brand-700 max-w-2xl mx-auto mt-3">
            Pago único, no mensual: es el precio por la constitución de tu sociedad según el plan elegido.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Plan Básico */}
          <ParallaxCard intensity={0.15}>
            <motion.div
              className="bg-surface rounded-card shadow-pop p-8 border-2 border-line hover:border-brand-300 transition h-full"
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
            <div className="text-center mb-6">
              <h3 className="text-title font-bold mb-2 text-brand-900">Básico</h3>
              <p className="text-ink-2 text-sm mb-4">Para quienes están comenzando</p>
              <div className="mb-2">
                <PrecioDual transferencia={precios.precioPlanBasico} precioClassName="text-4xl font-bold text-ink" gastos align="center" />
              </div>
              <div className="mt-2 flex flex-col items-center gap-1">
                <span className="inline-block bg-success-soft text-success text-xs font-bold px-3 py-1 rounded-full">
                  Pago único
                </span>
                <p className="text-xs text-ink-3">Por la constitución de la sociedad</p>
              </div>
            </div>

            <AnimatedList asList className="space-y-3 mb-8">
              {caracteristicas.map((caracteristica, index) => (
                <span key={index} className="flex items-start gap-2">
                  {caracteristica.basico ? (
                    <Check className="w-5 h-5 text-success-solid flex-shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-5 h-5 text-n-300 flex-shrink-0 mt-0.5" />
                  )}
                  <span className={`text-sm ${caracteristica.basico ? 'text-n-700' : 'text-n-400 italic'}`}>
                    {caracteristica.nombre}
                  </span>
                </span>
              ))}
            </AnimatedList>

            <Link
              href="/registro"
              className="block w-full text-center bg-ink text-white py-3 rounded-chip hover:bg-n-800 transition font-semibold"
            >
              Elegir Plan
            </Link>
          </motion.div>
          </ParallaxCard>

          {/* Plan Emprendedor - Destacado */}
          <ParallaxCard intensity={0.2}>
          <motion.div
            className="bg-surface rounded-card shadow-modal p-8 border-2 border-brand-700 hover:border-brand-800 transition transform md:scale-105 relative h-full"
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
              <h3 className="text-title font-bold mb-2 text-brand-900">Emprendedor</h3>
              <p className="text-ink-2 text-sm mb-4">Para emprendedores en crecimiento</p>
              <div className="mb-2">
                <PrecioDual transferencia={precios.precioPlanEmprendedor} precioClassName="text-4xl font-bold text-brand-700" gastos align="center" />
              </div>
              <div className="mt-2 flex flex-col items-center gap-1">
                <span className="inline-block bg-success-soft text-success text-xs font-bold px-3 py-1 rounded-full">
                  Pago único
                </span>
                <p className="text-xs text-ink-3">Por la constitución de la sociedad</p>
              </div>
            </div>

            <AnimatedList asList className="space-y-3 mb-8">
              {caracteristicas.map((caracteristica, index) => (
                <span key={index} className="flex items-start gap-2">
                  {caracteristica.emprendedor ? (
                    <Check className="w-5 h-5 text-brand-700 flex-shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-5 h-5 text-n-300 flex-shrink-0 mt-0.5" />
                  )}
                  <span className={`text-sm ${caracteristica.emprendedor ? 'text-n-700' : 'text-n-400 italic'}`}>
                    {caracteristica.nombre}
                  </span>
                </span>
              ))}
            </AnimatedList>

            <Link
              href="/registro"
              className="block w-full text-center bg-brand-700 text-white py-3 rounded-chip hover:bg-brand-800 transition font-semibold shadow-pop"
            >
              Elegir Plan
            </Link>
          </motion.div>
          </ParallaxCard>

          {/* Plan Premium */}
          <ParallaxCard intensity={0.15}>
          <motion.div
            className="bg-surface rounded-card shadow-pop p-8 border-2 border-line hover:border-brand-300 transition h-full"
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="text-center mb-6">
              <h3 className="text-title font-bold mb-2 text-brand-900">Premium</h3>
              <p className="text-ink-2 text-sm mb-4">Para empresas consolidadas</p>
              <div className="mb-2">
                <PrecioDual transferencia={precios.precioPlanPremium} precioClassName="text-4xl font-bold text-ink" gastos align="center" />
              </div>
              <div className="mt-2 flex flex-col items-center gap-1">
                <span className="inline-block bg-success-soft text-success text-xs font-bold px-3 py-1 rounded-full">
                  Pago único
                </span>
                <p className="text-xs text-ink-3">Por la constitución de la sociedad</p>
              </div>
            </div>

            <AnimatedList asList className="space-y-3 mb-8">
              {caracteristicas.map((caracteristica, index) => (
                <span key={index} className="flex items-start gap-2">
                  {caracteristica.premium ? (
                    <Check className="w-5 h-5 text-success-solid flex-shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-5 h-5 text-n-300 flex-shrink-0 mt-0.5" />
                  )}
                  <span className={`text-sm ${caracteristica.premium ? 'text-n-700' : 'text-n-400 italic'}`}>
                    {caracteristica.nombre}
                  </span>
                </span>
              ))}
            </AnimatedList>

            <Link
              href="/registro"
              className="block w-full text-center bg-ink text-white py-3 rounded-chip hover:bg-n-800 transition font-semibold"
            >
              Elegir Plan
            </Link>
          </motion.div>
          </ParallaxCard>
        </div>

        <motion.div
          className="mt-12 text-center text-sm text-ink-2 max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <p>
            <strong>Es un pago único</strong> por la constitución de la sociedad —no es una suscripción mensual—.
            Los precios no incluyen las tasas de inscripción de IGJ/IPJ (varían según jurisdicción y capital social)
            ni el depósito del 25% del capital social. Te informamos todos los costos detallados antes de comenzar.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
