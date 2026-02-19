'use client'

import { Shield, Users, Zap, TrendingUp, FileCheck, DollarSign } from 'lucide-react'
import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

const caracteristicas = [
  {
    icon: Users,
    iconBg: 'bg-brand-100',
    iconColor: 'text-brand-700',
    title: 'Puede ser unipersonal',
    description: 'No necesitás socios. Podés constituirla vos solo, algo imposible en S.R.L. o S.A. tradicionales.'
  },
  {
    icon: Zap,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    title: 'Trámite 100% digital',
    description: 'Todo el proceso se hace online. Sin necesidad de papelería obsoleta.'
  },
  {
    icon: DollarSign,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    title: 'Costos reducidos',
    description: 'Gastos de constitución hasta 50% menores que una S.R.L. o S.A. tradicional.'
  },
  {
    icon: TrendingUp,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    title: 'Flexibilidad',
    description: 'Estatuto adaptable a tus necesidades. Podés modificarlo sin grandes complicaciones.'
  },
  {
    icon: Shield,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    title: 'Responsabilidad limitada',
    description: 'Protegés tu patrimonio personal. Respondés solo con el capital que aportaste a la empresa.'
  },
  {
    icon: FileCheck,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    title: 'Reconocimiento oficial',
    description: 'CUIT automático, facturación electrónica, cuentas bancarias, todo como cualquier otra sociedad.'
  }
]

export function QueEsSAS() {
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })

  return (
    <section ref={sectionRef} className="py-20 md:py-28 bg-white overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header con nuevo diseño */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-brand-700 font-semibold text-sm tracking-wider uppercase mb-4">
              Conocé más
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              ¿Qué es una{' '}
              <span className="text-brand-700">S.A.S.</span>?
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              La <strong className="text-gray-700">Sociedad por Acciones Simplificada</strong> es un tipo societario moderno creado en 2017
              que revolucionó la forma de constituir empresas en Argentina.
            </p>
          </motion.div>

          {/* Características con animación escalonada */}
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8 mb-12">
            {caracteristicas.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                className="group flex gap-4 p-5 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300"
              >
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 ${item.iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon className={`w-6 h-6 ${item.iconColor}`} />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1 text-gray-900">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Marco legal con animación */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="bg-gradient-to-r from-brand-50 to-brand-100/50 border-l-4 border-brand-700 p-6 md:p-8 rounded-xl"
          >
            <h3 className="font-bold text-lg mb-3 text-gray-900">Marco Legal</h3>
            <p className="text-gray-700 mb-3 leading-relaxed">
              La S.A.S. está regulada por la <strong>Ley 27.349</strong> (modificada por Ley 27.444) y el <strong>Decreto 27/2018</strong>.
              Es un tipo societario oficial, reconocido por ARCA, IGJ, IPJ y todas las entidades públicas y privadas.
            </p>
            <p className="text-gray-700">
              Podés consultar más información en el{' '}
              <a
                href="https://www.argentina.gob.ar/justicia/registronacional/registrodesociedades/sas"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-700 font-semibold underline hover:text-brand-800 transition-colors"
              >
                sitio oficial del Gobierno Argentino
              </a>.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
