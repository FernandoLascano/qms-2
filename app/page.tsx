'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2, Clock, Shield, Zap, Users, TrendingUp, Star, ChevronRight } from 'lucide-react'
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import { FAQ } from '@/components/landing/FAQ'
import { Planes } from '@/components/landing/Planes'
import { Testimonios } from '@/components/landing/Testimonios'
import { QueEsSAS } from '@/components/landing/QueEsSAS'
import { GastosJurisdiccion } from '@/components/landing/GastosJurisdiccion'
import { Notas } from '@/components/landing/Notas'
import { Contacto } from '@/components/landing/Contacto'
import Navbar from '@/components/Navbar'

// Componente de contador animado
function AnimatedCounter({ value, suffix = '', duration = 2 }: { value: number; suffix?: string; duration?: number }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => Math.round(latest))
  const [displayValue, setDisplayValue] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, { duration })
      return controls.stop
    }
  }, [isInView, value, count, duration])

  useEffect(() => {
    const unsubscribe = rounded.on('change', (latest) => setDisplayValue(latest))
    return unsubscribe
  }, [rounded])

  return (
    <span ref={ref}>
      {displayValue.toLocaleString('es-AR')}{suffix}
    </span>
  )
}

export default function HomePage() {
  const benefitsRef = useRef(null)
  const stepsRef = useRef(null)
  const statsRef = useRef(null)
  const ctaRef = useRef(null)
  const benefitsInView = useInView(benefitsRef, { once: true, margin: "-100px" })
  const stepsInView = useInView(stepsRef, { once: true, margin: "-100px" })
  const statsInView = useInView(statsRef, { once: true, margin: "-100px" })
  const ctaInView = useInView(ctaRef, { once: true, margin: "-100px" })

  return (
    <div className="min-h-screen bg-white">
      <Navbar currentPage="home" />

      {/* Hero Section - Diseño Bold y Diferenciador */}
      <section className="relative overflow-hidden">
        {/* Background con gradiente sutil */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-red-50/30" />

        {/* Elementos decorativos geométricos */}
        <div className="absolute top-20 right-0 w-96 h-96 bg-red-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-red-50/60 rounded-full blur-3xl" />

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 md:pt-16 md:pb-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-7xl mx-auto">

            {/* Contenido Principal */}
            <motion.div
              className="text-center lg:text-left"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Badge de confianza */}
              <motion.div
                className="inline-flex items-center gap-2 bg-red-50 border border-red-100 rounded-full px-4 py-2 mb-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-sm font-medium text-red-800">+500 empresas constituidas</span>
              </motion.div>

              {/* Título Principal - Tipografía más impactante */}
              <motion.h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 mb-6 tracking-tight leading-[1.1]"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                Tu empresa{' '}
                <span className="relative">
                  <span className="text-red-700">lista</span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                    <motion.path
                      d="M2 8C50 2 150 2 198 8"
                      stroke="#dc2626"
                      strokeWidth="4"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8, delay: 0.8 }}
                    />
                  </svg>
                </span>
                <br />
                en <span className="text-red-700">5 días</span>
              </motion.h1>

              {/* Subtítulo con valor claro */}
              <motion.p
                className="text-xl md:text-2xl text-gray-600 mb-4 font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                Constituí tu S.A.S. 100% online
              </motion.p>

              <motion.p
                className="text-base md:text-lg text-gray-500 mb-8 max-w-xl mx-auto lg:mx-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                Sin trámites presenciales. Sin complicaciones.
                Tu sociedad lista para facturar.
              </motion.p>

              {/* CTAs con diseño más prominente */}
              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <Link href="/registro">
                  <motion.button
                    className="group relative bg-red-700 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-red-200 overflow-hidden"
                    style={{ cursor: 'pointer' }}
                    whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -15px rgba(185, 28, 28, 0.4)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="relative z-10">Comenzar ahora</span>
                    <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-r from-red-700 to-red-800 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </motion.button>
                </Link>

                <motion.a
                  href="#planes"
                  className="group border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 hover:border-red-200 hover:bg-red-50 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Ver precios
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.a>
              </motion.div>

              {/* Trust indicators con iconos */}
              <motion.div
                className="mt-10 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              >
                {[
                  { icon: Shield, text: 'Seguro' },
                  { icon: Zap, text: 'Rápido' },
                  { icon: Users, text: 'Soporte' }
                ].map((item, index) => (
                  <motion.div
                    key={item.text}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg bg-white border border-gray-100 shadow-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 1 + index * 0.1 }}
                    whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  >
                    <item.icon className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium text-gray-700">{item.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Ilustración Hero con efecto de profundidad */}
            <motion.div
              className="relative hidden lg:block"
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Card flotante con estadística */}
              <motion.div
                className="absolute -left-8 top-1/4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100 z-10"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tiempo promedio</p>
                    <p className="text-lg font-bold text-gray-900">5 días</p>
                  </div>
                </div>
              </motion.div>

              {/* Card flotante con rating */}
              <motion.div
                className="absolute -right-4 bottom-1/4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100 z-10"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1.4 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-gray-900">4.9</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">+200 reseñas</p>
              </motion.div>

              <img
                src="/assets/img/img_ppal.png"
                alt="Constitución de S.A.S. digital"
                className="w-full h-auto relative z-0"
              />
            </motion.div>

            {/* Mobile: Ilustración simplificada */}
            <motion.div
              className="lg:hidden mt-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <img
                src="/assets/img/img_ppal.png"
                alt="Constitución de S.A.S. digital"
                className="w-full h-auto max-w-sm mx-auto"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Barra de estadísticas animadas */}
      <section className="bg-gray-900 py-8" ref={statsRef}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              { value: 500, suffix: '+', label: 'Empresas constituidas' },
              { value: 5, suffix: ' días', label: 'Tiempo promedio' },
              { value: 98, suffix: '%', label: 'Clientes satisfechos' },
              { value: 24, suffix: '/7', label: 'Soporte disponible' }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={statsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <p className="text-3xl md:text-4xl font-black text-white mb-1">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficios - Nuevo diseño con cards más sofisticadas */}
      <section id="beneficios" className="py-20 md:py-28 bg-white" ref={benefitsRef}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={benefitsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-red-700 font-semibold text-sm tracking-wider uppercase mb-4">
              Por qué elegirnos
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">
              La forma más simple de{' '}
              <span className="text-red-700">constituir tu empresa</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Nos encargamos de todo el proceso legal mientras vos te enfocás en tu negocio
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: Clock,
                iconBg: 'bg-red-100',
                iconColor: 'text-red-600',
                title: 'Ultra rápido',
                description: 'Tu S.A.S. inscripta en solo 5 días hábiles. CUIT y matrícula listos.',
                highlight: '5 días'
              },
              {
                icon: Shield,
                iconBg: 'bg-emerald-100',
                iconColor: 'text-emerald-600',
                title: 'Sin complicaciones',
                description: 'Solo completás un formulario online. Nosotros hacemos el resto.',
                highlight: '100% online'
              },
              {
                icon: TrendingUp,
                iconBg: 'bg-blue-100',
                iconColor: 'text-blue-600',
                title: 'Precio justo',
                description: 'Costos menores que S.R.L. o S.A. Transparencia total.',
                highlight: 'Económico'
              },
              {
                icon: Users,
                iconBg: 'bg-purple-100',
                iconColor: 'text-purple-600',
                title: 'Seguimiento real',
                description: 'Panel online para ver el estado de tu trámite 24/7.',
                highlight: 'Tiempo real'
              }
            ].map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <motion.div
                  key={benefit.title}
                  className="group relative bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-all duration-300"
                  initial={{ opacity: 0, y: 30 }}
                  animate={benefitsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                  whileHover={{ y: -8, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)" }}
                >
                  <div className={`w-14 h-14 ${benefit.iconBg} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-7 h-7 ${benefit.iconColor}`} />
                  </div>

                  <span className="inline-block text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full mb-3">
                    {benefit.highlight}
                  </span>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{benefit.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Cómo Funciona - Timeline visual moderno */}
      <section id="procedimiento" className="py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white" ref={stepsRef}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={stepsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-red-700 font-semibold text-sm tracking-wider uppercase mb-4">
              Proceso simple
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">
              4 pasos y{' '}
              <span className="text-red-700">listo</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Un proceso diseñado para que sea lo más fácil posible
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  number: '01',
                  title: 'Completá el formulario',
                  description: 'Ingresá los datos de tu futura sociedad: nombre, socios, capital y actividad. Guardá tu progreso.',
                  icon: '📝'
                },
                {
                  number: '02',
                  title: 'Subí documentación',
                  description: 'Cargá DNI, CUIT y comprobantes desde tu panel. Seguimiento de cada documento.',
                  icon: '📎'
                },
                {
                  number: '03',
                  title: 'Pagá online',
                  description: 'Abonás honorarios y tasas de forma segura. Comprobantes automáticos.',
                  icon: '💳'
                },
                {
                  number: '04',
                  title: 'Recibí tu S.A.S.',
                  description: 'Gestionamos todo ante IPJ/IGJ. En 5 días tenés CUIT y matrícula.',
                  icon: '🎉'
                }
              ].map((step, index) => (
                <motion.div
                  key={step.number}
                  className="relative"
                  initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                  animate={stepsInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.15 }}
                >
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300 h-full">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <span className="text-4xl">{step.icon}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs font-black text-red-600 bg-red-50 px-2 py-1 rounded">
                            PASO {step.number}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                        <p className="text-gray-500 text-sm">{step.description}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA después de pasos */}
            <motion.div
              className="text-center mt-12"
              initial={{ opacity: 0, y: 20 }}
              animate={stepsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <Link href="/registro">
                <motion.button
                  className="bg-gray-900 text-white px-8 py-4 rounded-xl font-bold text-lg inline-flex items-center gap-2 hover:bg-gray-800 transition-colors cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Empezar mi trámite
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ¿Qué es una S.A.S.? - SEO */}
      <QueEsSAS />

      {/* Planes y Precios */}
      <Planes />

      {/* Gastos por Jurisdicción */}
      <GastosJurisdiccion />

      {/* Testimonios */}
      <Testimonios />

      {/* FAQ - Preguntas Frecuentes */}
      <FAQ />

      {/* Notas y Blog - Para SEO */}
      <Notas />

      {/* Contacto */}
      <Contacto />

      {/* CTA Final - Diseño impactante */}
      <section className="relative py-24 overflow-hidden" ref={ctaRef}>
        {/* Background con patrón */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-red-900" />
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
              ¿Listo para dar el<br />
              <span className="text-red-400">siguiente paso</span>?
            </h2>

            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Unite a más de 500 emprendedores que ya confiaron en nosotros
            </p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={ctaInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Link href="/registro">
                <motion.button
                  className="group bg-white text-gray-900 px-10 py-5 rounded-xl font-bold text-lg inline-flex items-center justify-center gap-3 shadow-2xl cursor-pointer"
                  whileHover={{ scale: 1.02, boxShadow: "0 25px 50px -12px rgba(255, 255, 255, 0.2)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  Iniciar mi trámite ahora
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>

              <motion.a
                href="https://wa.me/5493514284037"
                target="_blank"
                rel="noopener noreferrer"
                className="border-2 border-white/30 text-white px-10 py-5 rounded-xl font-semibold text-lg inline-flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Hablar con un asesor
              </motion.a>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              className="mt-12 flex flex-wrap justify-center gap-8"
              initial={{ opacity: 0 }}
              animate={ctaInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {[
                { icon: Shield, text: 'Datos protegidos' },
                { icon: CheckCircle2, text: 'Garantía total' },
                { icon: Clock, text: 'Soporte 24/7' }
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2 text-gray-400">
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 pt-16 pb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Footer Content */}
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            {/* Columna 1: Marca */}
            <div className="md:col-span-2">
              <Link href="/" className="inline-block mb-4">
                <img
                  src="/assets/img/logo4.png"
                  alt="QuieroMiSAS Logo"
                  className="h-12 w-auto brightness-0 invert"
                />
              </Link>
              <p className="text-sm text-gray-400 mb-4 max-w-sm">
                Plataforma digital para la constitución de Sociedades por Acciones Simplificadas en Argentina.
                Rápido, seguro y 100% online.
              </p>
              <p className="text-sm text-gray-400 font-semibold">
                Martínez Wehbe & Asociados
              </p>
              <p className="text-xs text-gray-500">Grupo MW - Mat. Prof. 6-1234 IPJ Córdoba</p>
            </div>

            {/* Columna 2: Servicios */}
            <div>
              <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Servicios</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/tramite/nuevo" className="text-gray-400 hover:text-white transition">Constituir S.A.S.</Link></li>
                <li><a href="#planes" className="text-gray-400 hover:text-white transition">Planes y Precios</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Reformas de Estatuto</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Asesoría Societaria</a></li>
              </ul>
            </div>

            {/* Columna 3: Recursos */}
            <div>
              <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Recursos</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#faq" className="text-gray-400 hover:text-white transition">Preguntas Frecuentes</a></li>
                <li><Link href="/blog" className="text-gray-400 hover:text-white transition">Blog y Notas</Link></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Marco Legal</a></li>
              </ul>
            </div>

            {/* Columna 4: Contacto */}
            <div>
              <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Contacto</h4>
              <ul className="space-y-3 text-sm">
                <li className="text-gray-400">Córdoba, Argentina</li>
                <li>
                  <a href="tel:+5493514284037" className="text-gray-400 hover:text-white transition">
                    +54 9 351 428 4037
                  </a>
                </li>
                <li>
                  <a href="mailto:contacto@quieromisas.com" className="text-gray-400 hover:text-white transition">
                    contacto@quieromisas.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Jurisdicciones */}
          <div className="border-t border-gray-800 pt-8 mb-8">
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              <span className="bg-gray-800 px-4 py-2 rounded-full text-gray-300">Córdoba (IPJ)</span>
              <span className="bg-gray-800 px-4 py-2 rounded-full text-gray-300">CABA (IGJ)</span>
              <span className="text-gray-500 px-4 py-2">Próximamente más provincias</span>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-500">
                © 2024 QuieroMiSAS by Martínez Wehbe & Asociados
              </p>
              <div className="flex gap-6 text-sm">
                <a href="/terminos" className="text-gray-500 hover:text-white transition">Términos</a>
                <a href="/privacidad" className="text-gray-500 hover:text-white transition">Privacidad</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
