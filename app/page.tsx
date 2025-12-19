'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, CheckCircle2, Clock, DollarSign, Smartphone, Menu, X } from 'lucide-react'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { FAQ } from '@/components/landing/FAQ'
import { Planes } from '@/components/landing/Planes'
import { Testimonios } from '@/components/landing/Testimonios'
import { QueEsSAS } from '@/components/landing/QueEsSAS'
import { Comparativa } from '@/components/landing/Comparativa'
import { Notas } from '@/components/landing/Notas'

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const benefitsRef = useRef(null)
  const stepsRef = useRef(null)
  const ctaRef = useRef(null)
  const benefitsInView = useInView(benefitsRef, { once: true, margin: "-100px" })
  const stepsInView = useInView(stepsRef, { once: true, margin: "-100px" })
  const ctaInView = useInView(ctaRef, { once: true, margin: "-100px" })

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      {/* Header/Navbar */}
      <header className="border-b border-gray-200 bg-white shadow-md sticky top-0 z-50 transition-all duration-300">
        <nav className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center group">
              <img 
                src="/assets/img/logo4.png" 
                alt="QuieroMiSAS Logo" 
                className="h-12 md:h-14 w-auto transition-transform group-hover:scale-105"
              />
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <a 
                href="#beneficios" 
                className="px-4 py-2 text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium text-sm"
              >
                Beneficios
              </a>
              <a 
                href="#procedimiento" 
                className="px-4 py-2 text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium text-sm"
              >
                Cómo Funciona
              </a>
              <a 
                href="#planes" 
                className="px-4 py-2 text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium text-sm"
              >
                Planes
              </a>
              <a 
                href="#faq" 
                className="px-4 py-2 text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium text-sm"
              >
                FAQ
              </a>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <Link 
                href="/login"
                className="px-5 py-2 text-gray-700 hover:text-red-700 transition-all duration-200 font-semibold text-sm border border-transparent hover:border-gray-200 rounded-lg"
              >
                Ingresar
              </Link>
              <Link 
                href="/registro"
                className="bg-red-700 text-white px-6 py-2.5 rounded-lg hover:bg-red-800 transition-all duration-200 font-semibold text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Registrarse
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div
              className="md:hidden mt-2 pb-4 border-t border-gray-200 bg-white rounded-b-lg shadow-lg overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <motion.div
                className="flex flex-col space-y-1 pt-4"
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                {['Beneficios', 'Cómo Funciona', 'Planes', 'FAQ'].map((item, index) => (
                  <motion.a
                    key={item}
                    href={`#${item === 'Cómo Funciona' ? 'procedimiento' : item === 'FAQ' ? 'faq' : item.toLowerCase()}`}
                    className="px-4 py-3 text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 0.1 + (index * 0.05) }}
                  >
                    {item}
                  </motion.a>
                ))}
                <motion.div
                  className="pt-3 mt-3 border-t border-gray-200 space-y-2 px-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <Link
                    href="/login"
                    className="block text-center px-4 py-2.5 text-gray-700 hover:text-red-700 transition-all duration-200 font-semibold border border-gray-200 rounded-lg hover:border-red-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Ingresar
                  </Link>
                  <Link
                    href="/registro"
                    className="block bg-red-700 text-white px-4 py-2.5 rounded-lg hover:bg-red-800 transition-all duration-200 font-semibold text-center shadow-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Registrarse
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20 overflow-hidden">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center max-w-7xl mx-auto">
          {/* Texto Hero */}
          <motion.div
            className="text-center md:text-left"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 md:mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            >
              Constituí tu <span className="text-red-700">S.A.S.</span> en{' '}
              <span className="text-red-700">5 días</span>
            </motion.h1>

            <motion.p
              className="text-lg sm:text-xl text-gray-600 mb-3 md:mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              En Córdoba o CABA - Funcional en todo el país
            </motion.p>

            <motion.p
              className="text-base sm:text-lg text-gray-500 mb-6 md:mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              100% digital, rápido, económico y con seguimiento en tiempo real.
              Tu sociedad lista para facturar en menos de una semana.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start items-stretch sm:items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Link
                href="/registro"
                className="bg-red-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg hover:bg-red-800 transition-all duration-300 font-semibold text-base sm:text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
              >
                Quiero mi S.A.S.
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <a
                href="#planes"
                className="border-2 border-red-700 text-red-700 px-6 sm:px-8 py-3 sm:py-4 rounded-lg hover:bg-red-50 transition-all duration-300 font-semibold text-base sm:text-lg text-center hover:scale-105"
              >
                Ver Planes y Precios
              </a>
            </motion.div>

            <motion.div
              className="mt-8 md:mt-12 flex flex-wrap justify-center md:justify-start gap-4 sm:gap-8 text-xs sm:text-sm text-gray-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              {[
                'Más de 500 empresas constituidas',
                'Garantía de transparencia',
                'Soporte profesional'
              ].map((text, index) => (
                <motion.div
                  key={text}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.9 + (index * 0.1) }}
                >
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>{text}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Ilustración Hero */}
          <motion.div
            className="hidden md:block order-2"
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          >
            <img
              src="/assets/img/img_ppal.png"
              alt="Constitución de S.A.S. digital"
              className="w-full h-auto"
            />
          </motion.div>

          {/* Mobile: Mostrar ilustración más pequeña */}
          <motion.div
            className="md:hidden order-2 mt-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <img
              src="/assets/img/img_ppal.png"
              alt="Constitución de S.A.S. digital"
              className="w-full h-auto max-w-sm mx-auto"
            />
          </motion.div>
        </div>
      </section>

      {/* Beneficios */}
      <section id="beneficios" className="bg-white py-20" ref={benefitsRef}>
        <div className="container mx-auto px-4">
          <motion.h2
            className="text-4xl font-bold text-center mb-4 text-red-900"
            initial={{ opacity: 0, y: 30 }}
            animate={benefitsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            ¿Por qué elegir QuieroMiSAS?
          </motion.h2>
          <motion.p
            className="text-center text-gray-600 mb-12 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={benefitsInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Hacemos que constituir tu empresa sea simple, rápido y económico
          </motion.p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                bg: 'bg-red-50',
                iconBg: 'bg-red-700',
                icon: Clock,
                title: 'Rápido',
                description: 'Tu S.A.S. inscripta en 5 días hábiles. CUIT y matrícula listos para operar.'
              },
              {
                bg: 'bg-green-50',
                iconBg: 'bg-green-600',
                icon: CheckCircle2,
                title: 'Fácil',
                description: 'Solo completá un formulario online. Nosotros nos encargamos de todo el proceso legal.'
              },
              {
                bg: 'bg-purple-50',
                iconBg: 'bg-purple-600',
                icon: DollarSign,
                title: 'Económico',
                description: 'Costos inferiores a S.R.L. o S.A. Honorarios transparentes e imbatibles.'
              },
              {
                bg: 'bg-orange-50',
                iconBg: 'bg-orange-600',
                icon: Smartphone,
                title: '100% Digital',
                description: 'Todo online: formulario, firma digital, seguimiento en tiempo real desde tu panel.'
              }
            ].map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <motion.div
                  key={benefit.title}
                  className={`${benefit.bg} p-8 rounded-2xl hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-2`}
                  initial={{ opacity: 0, y: 50 }}
                  animate={benefitsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{
                    duration: 0.5,
                    delay: 0.3 + (index * 0.1),
                    ease: "easeOut"
                  }}
                  whileHover={{ scale: 1.05 }}
                >
                  <motion.div
                    className={`w-14 h-14 ${benefit.iconBg} rounded-xl flex items-center justify-center mb-4`}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-bold mb-3 text-red-900">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Cómo Funciona */}
      <section id="procedimiento" className="py-20 bg-gradient-to-b from-white to-red-50" ref={stepsRef}>
        <div className="container mx-auto px-4">
          <motion.h2
            className="text-4xl font-bold text-center mb-4 text-red-900"
            initial={{ opacity: 0, y: 30 }}
            animate={stepsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            ¿Cómo funciona?
          </motion.h2>
          <motion.p
            className="text-center text-gray-600 mb-12 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={stepsInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            En solo 4 pasos tenés tu empresa constituida
          </motion.p>

          <div className="max-w-4xl mx-auto">
            {[
              {
                number: 1,
                title: 'Completá el formulario',
                description: 'Ingresá los datos de tu futura sociedad: nombre, socios, capital social y actividad. Guardá tu progreso y continuá cuando quieras.'
              },
              {
                number: 2,
                title: 'Subí documentación',
                description: 'Cargá DNI, CUIT y comprobantes necesarios directamente en tu panel. Seguimiento en tiempo real de cada documento.'
              },
              {
                number: 3,
                title: 'Pagá online',
                description: 'Abonás honorarios y tasas de forma segura desde la plataforma. Recibís comprobantes automáticamente.'
              },
              {
                number: 4,
                title: 'Recibí tu S.A.S.',
                description: 'Nosotros gestionamos todo ante IPJ/IGJ. En 5 días tenés CUIT, matrícula y tu empresa lista para facturar.'
              }
            ].map((step, index) => (
              <motion.div
                key={step.number}
                className="flex gap-6 mb-8 last:mb-0"
                initial={{ opacity: 0, x: -50 }}
                animate={stepsInView ? { opacity: 1, x: 0 } : {}}
                transition={{
                  duration: 0.5,
                  delay: 0.3 + (index * 0.15),
                  ease: "easeOut"
                }}
              >
                <div className="flex-shrink-0">
                  <motion.div
                    className="w-12 h-12 bg-red-700 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg"
                    initial={{ scale: 0 }}
                    animate={stepsInView ? { scale: 1 } : {}}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 15,
                      delay: 0.4 + (index * 0.15)
                    }}
                    whileHover={{ scale: 1.2, rotate: 360 }}
                  >
                    {step.number}
                  </motion.div>
                </div>
                <motion.div
                  className="flex-1"
                  initial={{ opacity: 0 }}
                  animate={stepsInView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.5, delay: 0.5 + (index * 0.15) }}
                >
                  <h3 className="text-xl font-bold mb-2 text-red-900">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ¿Qué es una S.A.S.? - SEO */}
      <QueEsSAS />

      {/* Comparativa - Informativa */}
      <Comparativa />

      {/* Planes y Precios */}
      <Planes />

      {/* Testimonios */}
      <Testimonios />

      {/* FAQ - Preguntas Frecuentes */}
      <FAQ />

      {/* Notas y Blog - Para SEO */}
      <Notas />

      {/* CTA Final */}
      <section className="bg-gradient-to-r from-red-700 to-red-900 text-white py-20 overflow-hidden" ref={ctaRef}>
        <div className="container mx-auto px-4 text-center">
          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            ¿Listo para dar el siguiente paso?
          </motion.h2>
          <motion.p
            className="text-xl mb-8 opacity-90 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={ctaInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Más de 500 emprendedores ya confiaron en nosotros. Unite a la revolución digital de las sociedades.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/registro"
                className="inline-flex items-center justify-center gap-2 bg-white text-red-700 px-8 py-4 rounded-lg hover:bg-gray-100 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl"
              >
                Iniciar mi trámite ahora
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
            <motion.a
              href="mailto:contacto@quieromisas.com"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-red-700 transition-all duration-300 font-semibold text-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Consultar con un asesor
            </motion.a>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            className="mt-12 flex flex-wrap justify-center gap-8 opacity-80"
            initial={{ opacity: 0 }}
            animate={ctaInView ? { opacity: 0.8 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {['Garantía de transparencia', 'Soporte 24/7', 'Pago seguro'].map((text, index) => (
              <motion.div
                key={text}
                className="flex items-center gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={ctaInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.6 + (index * 0.1) }}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm">{text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="container mx-auto px-4">
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
              <p className="text-sm text-gray-400 mb-4 max-w-md">
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
              <h4 className="font-semibold text-white mb-4">Servicios</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/tramite/nuevo" className="hover:text-white transition">Constituir S.A.S.</Link></li>
                <li><a href="#planes" className="hover:text-white transition">Planes y Precios</a></li>
                <li><a href="#" className="hover:text-white transition">Reformas de Estatuto</a></li>
                <li><a href="#" className="hover:text-white transition">Modificaciones</a></li>
                <li><a href="#" className="hover:text-white transition">Asesoría Societaria</a></li>
              </ul>
            </div>

            {/* Columna 3: Recursos */}
            <div>
              <h4 className="font-semibold text-white mb-4">Recursos</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#faq" className="hover:text-white transition">Preguntas Frecuentes</a></li>
                <li><Link href="/blog" className="hover:text-white transition">Blog y Notas</Link></li>
                <li><a href="#" className="hover:text-white transition">Guías Descargables</a></li>
                <li><a href="#" className="hover:text-white transition">Calculadora de Costos</a></li>
                <li><a href="#" className="hover:text-white transition">Marco Legal</a></li>
              </ul>
            </div>

            {/* Columna 4: Contacto */}
            <div>
              <h4 className="font-semibold text-white mb-4">Contacto</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-gray-500">📍</span>
                  <span>Córdoba, Argentina</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-500">📞</span>
                  <a href="tel:+5493514284037" className="hover:text-white transition">
                    +54 9 351 428 4037
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-500">✉️</span>
                  <a href="mailto:contacto@quieromisas.com" className="hover:text-white transition">
                    contacto@quieromisas.com
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-500">💬</span>
                  <a href="https://wa.me/5493514284037" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
                    WhatsApp
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Jurisdicciones */}
          <div className="border-t border-gray-800 pt-8 mb-8">
            <h4 className="font-semibold text-white mb-4 text-center">Trabajamos en</h4>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <span className="bg-gray-800 px-4 py-2 rounded-full">Córdoba (IPJ)</span>
              <span className="bg-gray-800 px-4 py-2 rounded-full">CABA (IGJ)</span>
              <span className="text-gray-500 px-4 py-2">Próximamente: Buenos Aires, Santa Fe, Mendoza</span>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-400">
                <p>&copy; 2024 QuieroMiSAS by Martínez Wehbe & Asociados. Todos los derechos reservados.</p>
              </div>
              <div className="flex gap-6 text-sm">
                <a href="/terminos" className="hover:text-white transition">Términos y Condiciones</a>
                <a href="/privacidad" className="hover:text-white transition">Política de Privacidad</a>
                <a href="#" className="hover:text-white transition">Defensa del Consumidor</a>
              </div>
            </div>
            <div className="mt-4 text-center text-xs text-gray-500">
              <p>Sitio web seguro. Certificado SSL. Datos protegidos. Cumplimos con la Ley 25.326 de Protección de Datos Personales.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}