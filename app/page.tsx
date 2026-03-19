'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2, Shield, Zap, Users, Star, ChevronRight } from 'lucide-react'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { FAQ } from '@/components/landing/FAQ'
import { Planes } from '@/components/landing/Planes'
import { AsistenteChat } from '@/components/landing/AsistenteChat'
import { Testimonios } from '@/components/landing/Testimonios'
import { QueEsSAS } from '@/components/landing/QueEsSAS'
import { GastosJurisdiccion } from '@/components/landing/GastosJurisdiccion'
import { Notas } from '@/components/landing/Notas'
import { Contacto } from '@/components/landing/Contacto'
import { OtrosServicios } from '@/components/landing/OtrosServicios'
import { DesdeTodasLasProvincias } from '@/components/landing/DesdeTodasLasProvincias'
import { StaggeredText } from '@/components/landing/StaggeredText'

import Navbar from '@/components/Navbar'


export default function HomePage() {

  const stepsRef = useRef(null)



  const stepsInView = useInView(stepsRef, { once: true, margin: "-100px" })



  return (
    <div className="min-h-screen bg-white">
      <Navbar currentPage="home" />

      {/* Hero Section - Diseño Bold y Diferenciador */}
      <section className="relative overflow-hidden">
        {/* Background base + gradiente */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-brand-50/30" />

        {/* Elementos decorativos geométricos */}
        <div className="absolute top-20 right-0 w-96 h-96 bg-brand-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-brand-50/50 rounded-full blur-3xl" />

        {/* Fondo limpio sin pattern */}

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
                className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 rounded-full px-4 py-2 mb-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-brand-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                </span>
                <span className="text-sm font-medium text-brand-800">+500 empresas constituidas</span>
              </motion.div>

              {/* Título Principal - Texto staggered animado */}
              <StaggeredText
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 mb-6 tracking-tight leading-[1.1]"
                words={[
                  { text: 'Constituí' },
                  { text: 'tu' },
                  { text: 'SAS', withUnderline: true },
                  { lineBreak: true },
                  { text: 'en' },
                  { text: '5', highlight: true },
                  { text: 'días', highlight: true }
                ]}
              />

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
                    className="group relative bg-brand-700 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-brand-200 overflow-hidden"
                    style={{ cursor: 'pointer' }}
                    whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -15px rgba(185, 28, 28, 0.4)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="relative z-10">Comenzar ahora</span>
                    <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-700 to-brand-800 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </motion.button>
                </Link>

                <motion.a
                  href="#planes"
                  className="group border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 hover:border-brand-200 hover:bg-brand-50 transition-all"
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
                    <item.icon className="w-5 h-5 text-brand-600" />
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

      {/* Cómo Funciona - Timeline visual moderno */}
      <section id="procedimiento" className="py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white" ref={stepsRef}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={stepsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-brand-700 font-semibold text-sm tracking-wider uppercase mb-4">
              Proceso simple
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">
              4 pasos y{' '}
              <span className="text-brand-700">listo</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Un proceso diseñado para que sea lo más fácil posible
            </p>
          </motion.div>

          {/* Timeline horizontal */}
          <div className="max-w-6xl mx-auto">
            {/* Desktop: horizontal timeline */}
            <div className="hidden md:block relative px-4">
              {/* Línea horizontal de fondo */}
              <div className="absolute top-[52px] left-[12.5%] right-[12.5%] h-1 bg-gray-200 rounded-full">
                <motion.div
                  className="h-full bg-gradient-to-r from-brand-500 via-brand-600 to-brand-700 rounded-full origin-left"
                  initial={{ scaleX: 0 }}
                  animate={stepsInView ? { scaleX: 1 } : {}}
                  transition={{ duration: 2, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
                />
              </div>

              <div className="grid grid-cols-4 gap-8">
                {[
                  { number: '01', title: 'Completá el formulario', description: 'Ingresá los datos de tu futura sociedad: nombre, socios, capital y actividad.', icon: '📝', color: 'from-brand-500 to-brand-600' },
                  { number: '02', title: 'Subí documentación', description: 'Cargá DNI, CUIT y comprobantes desde tu panel. Seguimiento en tiempo real.', icon: '📎', color: 'from-brand-600 to-brand-700' },
                  { number: '03', title: 'Pagá online', description: 'Abonás honorarios y tasas de forma segura. Comprobantes automáticos.', icon: '💳', color: 'from-brand-600 to-brand-700' },
                  { number: '04', title: 'Recibí tu S.A.S.', description: 'Gestionamos todo ante IPJ/IGJ. En 5 días tenés CUIT y matrícula.', icon: '🎉', color: 'from-green-500 to-green-600' }
                ].map((step, index) => (
                  <div key={step.number} className="flex flex-col items-center text-center">
                    {/* Nodo con glow */}
                    <div className="relative mb-8 z-10">
                      {/* Glow ring */}
                      <motion.div
                        className={`absolute inset-0 rounded-full bg-gradient-to-r ${step.color} blur-md`}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={stepsInView ? { opacity: 0.4, scale: 1.3 } : {}}
                        transition={{ duration: 0.6, delay: 0.6 + index * 0.4 }}
                      />

                      {/* Nodo principal */}
                      <motion.div
                        className={`relative w-[104px] h-[104px] rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-xl`}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={stepsInView ? { scale: 1, rotate: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.5 + index * 0.4, type: 'spring', bounce: 0.35 }}
                      >
                        <div className="w-[88px] h-[88px] rounded-full bg-white flex items-center justify-center">
                          <span className="text-4xl">{step.icon}</span>
                        </div>
                      </motion.div>

                      {/* Número */}
                      <motion.div
                        className={`absolute -top-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center shadow-md`}
                        initial={{ scale: 0 }}
                        animate={stepsInView ? { scale: 1 } : {}}
                        transition={{ duration: 0.3, delay: 0.9 + index * 0.4, type: 'spring' }}
                      >
                        <span className="text-white font-black text-xs">{step.number}</span>
                      </motion.div>
                    </div>

                    {/* Contenido */}
                    <motion.div
                      className="w-full"
                      initial={{ opacity: 0, y: 20 }}
                      animate={stepsInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.5, delay: 0.8 + index * 0.4 }}
                    >
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
                    </motion.div>

                    {/* Conector flecha (entre nodos, no en el último) */}
                    {index < 3 && (
                      <motion.div
                        className="absolute hidden md:block"
                        style={{ left: `${(index + 1) * 25}%`, top: '44px', transform: 'translateX(-50%)' }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={stepsInView ? { opacity: 1, scale: 1 } : {}}
                        transition={{ duration: 0.3, delay: 1 + index * 0.4 }}
                      >
                        <ChevronRight className="w-5 h-5 text-brand-400" />
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile: vertical con línea */}
            <div className="md:hidden relative pl-8">
              {/* Línea vertical */}
              <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-gray-200">
                <motion.div
                  className="w-full bg-brand-600 origin-top"
                  initial={{ scaleY: 0 }}
                  animate={stepsInView ? { scaleY: 1 } : {}}
                  transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.2 }}
                  style={{ height: '100%' }}
                />
              </div>

              <div className="space-y-8">
                {[
                  { number: '01', title: 'Completá el formulario', description: 'Ingresá los datos de tu futura sociedad: nombre, socios, capital y actividad.', icon: '📝' },
                  { number: '02', title: 'Subí documentación', description: 'Cargá DNI, CUIT y comprobantes desde tu panel. Seguimiento en tiempo real.', icon: '📎' },
                  { number: '03', title: 'Pagá online', description: 'Abonás honorarios y tasas de forma segura. Comprobantes automáticos.', icon: '💳' },
                  { number: '04', title: 'Recibí tu S.A.S.', description: 'Gestionamos todo ante IPJ/IGJ. En 5 días tenés CUIT y matrícula.', icon: '🎉' }
                ].map((step, index) => (
                  <motion.div
                    key={step.number}
                    className="flex items-start gap-5 relative"
                    initial={{ opacity: 0, x: -20 }}
                    animate={stepsInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.2 }}
                  >
                    {/* Nodo */}
                    <motion.div
                      className="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center shadow-lg flex-shrink-0 -ml-8 z-10"
                      initial={{ scale: 0 }}
                      animate={stepsInView ? { scale: 1 } : {}}
                      transition={{ duration: 0.4, delay: 0.4 + index * 0.2, type: 'spring' }}
                    >
                      <span className="text-xl">{step.icon}</span>
                    </motion.div>

                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex-1">
                      <span className="inline-block text-xs font-black text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full mb-2">
                        PASO {step.number}
                      </span>
                      <h3 className="text-base font-bold text-gray-900 mb-1">{step.title}</h3>
                      <p className="text-gray-500 text-sm">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA después de pasos */}
          <motion.div
            className="text-center mt-14"
            initial={{ opacity: 0, y: 20 }}
            animate={stepsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 1.8 }}
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
      </section>

      {/* ¿Qué es una S.A.S.? - SEO + ventajas */}
      <QueEsSAS />

      {/* Planes y Precios */}
      <Planes />

      {/* Gastos por Jurisdicción */}
      <GastosJurisdiccion />

      {/* Constituí desde cualquier provincia */}
      <DesdeTodasLasProvincias />

      {/* Testimonios - prueba social */}
      <Testimonios />

      {/* Otros Servicios - después de testimonios */}
      <OtrosServicios />

      {/* FAQ - Preguntas Frecuentes */}
      <FAQ />

      {/* Notas y Blog - SEO */}
      <Notas />

      {/* Contacto */}
      <Contacto />

      {/* Asistente IA */}
      <AsistenteChat />

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 pt-16 pb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Footer Content */}
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            {/* Columna 1: Marca */}
            <div className="md:col-span-2">
              <Link href="/" className="inline-block mb-4">
                <img
                  src="/assets/img/qms-logo-white.png"
                  alt="QuieroMiSAS Logo"
                  className="h-12 w-auto"
                />
              </Link>
              <p className="text-sm text-gray-400 mb-4 max-w-sm">
                Plataforma digital para la constitución de Sociedades por Acciones Simplificadas en Argentina.
                Rápido, seguro y 100% online.
              </p>
              <img
                src="/assets/img/grupo-mw.png"
                alt="Part of Grupo MW"
                className="h-8 w-auto opacity-90"
              />
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

          {/* Bottom Footer - Centrado para no superponerse con el botón del chat */}
          <div className="border-t border-gray-800 pt-8 pr-20 md:pr-24">
            <div className="flex flex-col justify-center items-center gap-2 text-center">
              <p className="text-sm text-gray-500">
                © 2026 QuieroMiSAS
              </p>
              <div className="flex gap-6 text-xs text-gray-500">
                <a href="/terminos" className="hover:text-white transition">Términos</a>
                <a href="/privacidad" className="hover:text-white transition">Privacidad</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
