'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { MapPin, Zap, DollarSign, Monitor, FileCheck, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function DesdeTodasLasProvincias() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  const ventajas = [
    { icon: Zap, text: 'Proceso más rápido (5 días vs semanas en otras jurisdicciones)' },
    { icon: DollarSign, text: 'Gastos de inscripción más bajos del país' },
    { icon: Monitor, text: '100% digital, sin trámites presenciales' },
    { icon: FileCheck, text: 'Publicación en boletín oficial bonificada' },
  ]

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-white to-gray-50" ref={ref}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="bg-white rounded-3xl border-2 border-brand-100 shadow-xl overflow-hidden"
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="grid lg:grid-cols-2">
              {/* Columna izquierda - Contenido */}
              <div className="p-8 md:p-12">
                <motion.div
                  className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 rounded-full px-4 py-2 mb-6"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <MapPin className="w-4 h-4 text-brand-700" />
                  <span className="text-sm font-semibold text-brand-800">Válido en todo el país</span>
                </motion.div>

                <motion.h2
                  className="text-3xl md:text-4xl font-black text-gray-900 mb-4 leading-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  ¿No sos de Córdoba?{' '}
                  <span className="text-brand-700">No importa.</span>
                </motion.h2>

                <motion.p
                  className="text-lg text-gray-600 mb-6 leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  Tu S.A.S. se inscribe en Córdoba (IPJ) pero es{' '}
                  <strong className="text-gray-900">válida en todo el territorio argentino</strong>.
                  Podés operar, facturar y tributar desde cualquier provincia.
                  Solo necesitás declarar tu domicilio fiscal donde tengas tu actividad comercial.
                </motion.p>

                <motion.div
                  className="space-y-3 mb-8"
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <p className="text-sm font-bold text-gray-900 uppercase tracking-wider">¿Por qué Córdoba?</p>
                  {ventajas.map((v, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center gap-3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={inView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                        <v.icon className="w-4 h-4 text-green-700" />
                      </div>
                      <span className="text-sm text-gray-700">{v.text}</span>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 1 }}
                >
                  <Link href="/registro">
                    <motion.button
                      className="group bg-brand-700 text-white px-8 py-4 rounded-xl font-bold text-base flex items-center gap-3 shadow-lg shadow-brand-200 cursor-pointer"
                      whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -15px rgba(185, 28, 28, 0.4)" }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Constituir mi SAS en Córdoba
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  </Link>
                </motion.div>
              </div>

              {/* Columna derecha - Visual */}
              <div className="hidden lg:flex bg-gradient-to-br from-brand-700 via-brand-800 to-gray-900 items-center justify-center p-12 relative overflow-hidden">
                {/* Patrón de fondo */}
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }} />

                <div className="relative text-center">
                  {/* Ícono de mapa */}
                  <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm border border-white/20">
                    <MapPin className="w-12 h-12 text-white" />
                  </div>

                  <p className="text-white/90 text-xl font-bold mb-2">
                    Inscribí en Córdoba
                  </p>
                  <p className="text-white/70 text-lg mb-8">
                    Operá en todo Argentina
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                      <p className="text-3xl font-black text-white">5</p>
                      <p className="text-white/70 text-xs mt-1">días hábiles</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                      <p className="text-3xl font-black text-white">50%</p>
                      <p className="text-white/70 text-xs mt-1">más económico</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
