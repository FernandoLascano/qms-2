'use client'

import {
  FileEdit,
  FileCheck,
  UserPlus,
  UserMinus,
  Calculator,
  Building2,
  TrendingUp,
  GitMerge,
  XCircle,
  ArrowLeftRight,
  Repeat,
  Building,
  LucideIcon,
} from 'lucide-react'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const servicios: { icon: LucideIcon; name: string; color: string }[] = [
  { icon: FileEdit, name: 'Reformas de Estatuto', color: 'bg-amber-100 text-amber-600' },
  { icon: FileCheck, name: 'Confección de Actas', color: 'bg-blue-100 text-blue-600' },
  { icon: UserPlus, name: 'Designación de Autoridades', color: 'bg-pink-100 text-pink-600' },
  { icon: UserMinus, name: 'Renuncia de Autoridades', color: 'bg-purple-100 text-purple-600' },
  { icon: Calculator, name: 'Tratamiento de Estados Contables', color: 'bg-sky-100 text-sky-600' },
  { icon: Building2, name: 'Cambio de Sede Social', color: 'bg-orange-100 text-orange-600' },
  { icon: TrendingUp, name: 'Aumentos de Capital Social', color: 'bg-green-100 text-green-600' },
  { icon: GitMerge, name: 'Fusiones', color: 'bg-blue-100 text-blue-600' },
  { icon: XCircle, name: 'Disolución/Liquidación', color: 'bg-brand-100 text-brand-600' },
  { icon: ArrowLeftRight, name: 'Escisión', color: 'bg-blue-100 text-blue-600' },
  { icon: Repeat, name: 'Transformación', color: 'bg-orange-100 text-orange-600' },
  { icon: Building, name: 'Compra/Venta de Sociedades', color: 'bg-green-100 text-green-600' },
]

export function OtrosServicios() {
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  return (
    <section ref={sectionRef} className="py-12 md:py-16 bg-gray-50 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - estilo consistente con la página */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block text-brand-700 font-semibold text-sm tracking-wider uppercase mb-4">
            Servicios adicionales
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            Otros{' '}
            <span className="text-brand-700">Servicios</span>
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Además ofrecemos una gran variedad de Servicios Jurídicos y Contables para tu Sociedad
          </p>
        </motion.div>

        {/* Grid más denso: 4 columnas en desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 max-w-5xl mx-auto">
          {servicios.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.3, delay: index * 0.03 }}
              className="group flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200"
            >
              <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${item.color}`}>
                <item.icon className="w-4 h-4" />
              </div>
              <span className="font-medium text-gray-900 text-xs sm:text-sm leading-tight">{item.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
