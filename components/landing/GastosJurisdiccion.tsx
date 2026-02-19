'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Building2, FileText, Landmark, CreditCard, Info, CheckCircle2 } from 'lucide-react'

type Jurisdiccion = 'cordoba' | 'caba'

interface GastoItem {
  concepto: string
  descripcion: string
  cordoba: string
  caba: string
  nota?: string
}

const gastos: GastoItem[] = [
  {
    concepto: 'Tasa de constitución',
    descripcion: 'Tasa que cobra el organismo de control por inscribir la sociedad',
    cordoba: '$150.680',
    caba: 'Desde $158.900',
    
  },
  {
    concepto: 'Reserva de nombre',
    descripcion: 'Reserva del nombre de la sociedad ante el organismo',
    cordoba: '$16.170',
    caba: 'No aplica',
    nota: 'Solo Córdoba'
  },
  {
    concepto: 'Depósito capital social',
    descripcion: '25% del capital social inicial (se recupera)',
    cordoba: 'Desde $158.900',
    caba: 'No aplica',
    nota: 'Solo Córdoba'
  },
  {
    concepto: 'Publicación de edicto',
    descripcion: 'Publicación obligatoria en el Boletín Oficial',
    cordoba: 'Bonificado',
    caba: '~$60.000',
    nota: 'Aproximado'
  },
  {
    concepto: 'Certificación de firmas',
    descripcion: 'Certificación notarial de las firmas de los socios',
    cordoba: 'Posibilidad de hacerlo online',
    caba: '~$40.000',
    nota: 'Aproximado'
  }
]

export function GastosJurisdiccion() {
  const [jurisdiccion, setJurisdiccion] = useState<Jurisdiccion>('cordoba')

  // Córdoba: $150.680 + $16.170 = $166.850 (sin depósito capital porque se recupera)
  // CABA: $158.900 + $60.000 + $40.000 = $258.900 (sin depósito capital porque se recupera)
  const totalCordoba = '~$166.850'
  const totalCaba = '~$258.900'

  return (
    <section id="gastos" className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block text-brand-700 font-semibold text-sm tracking-wider uppercase mb-4">
            Costos adicionales
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">
            Gastos según{' '}
            <span className="text-brand-700">jurisdicción</span>
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Además de nuestros honorarios, existen gastos de inscripción que varían según donde constituyas tu S.A.S.
          </p>
        </motion.div>

        {/* Selector de Jurisdicción */}
        <motion.div
          className="flex justify-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="inline-flex bg-gray-100 rounded-xl p-1.5">
            <button
              onClick={() => setJurisdiccion('cordoba')}
              className={`relative flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300 ${
                jurisdiccion === 'cordoba'
                  ? 'text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {jurisdiccion === 'cordoba' && (
                <motion.div
                  layoutId="jurisdiccionBg"
                  className="absolute inset-0 bg-brand-700 rounded-lg"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <MapPin className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Córdoba (IPJ)</span>
            </button>
            <button
              onClick={() => setJurisdiccion('caba')}
              className={`relative flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300 ${
                jurisdiccion === 'caba'
                  ? 'text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {jurisdiccion === 'caba' && (
                <motion.div
                  layoutId="jurisdiccionBg"
                  className="absolute inset-0 bg-brand-700 rounded-lg"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Building2 className="w-4 h-4 relative z-10" />
              <span className="relative z-10">CABA (IGJ)</span>
            </button>
          </div>
        </motion.div>

        {/* Cards de Gastos */}
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={jurisdiccion}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {gastos.map((gasto, index) => (
                <motion.div
                  key={gasto.concepto}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-gray-50 rounded-xl p-5 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">{gasto.concepto}</h3>
                        {gasto.nota && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                            {gasto.nota}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{gasto.descripcion}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="text-2xl font-black text-gray-900">
                        {jurisdiccion === 'cordoba' ? gasto.cordoba : gasto.caba}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Total estimado */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 mt-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Total estimado de gastos</p>
                    <p className="text-white text-sm">
                      {jurisdiccion === 'cordoba'
                        ? 'Inscripción ante IPJ Córdoba'
                        : 'Inscripción ante IGJ CABA'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl md:text-4xl font-black text-white">
                      {jurisdiccion === 'cordoba' ? totalCordoba : totalCaba}
                    </span>
                    <p className="text-gray-400 text-xs mt-1">*Valores aproximados</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Notas informativas */}
          <motion.div
            className="mt-10 grid md:grid-cols-2 gap-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">Sobre el capital social</p>
                <p className="text-sm text-blue-700">
                  El depósito del 25% del capital social solo aplica para Córdoba y se realiza en una cuenta especial abierta en el Banco  de Córdoba y se recupera una vez inscripta la sociedad.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-900 mb-1">Sin sorpresas</p>
                <p className="text-sm text-green-700">
                  Te informamos todos los costos detallados antes de comenzar el trámite. Transparencia total.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Comparación rápida */}
          <motion.div
            className="mt-10 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <p className="text-gray-500 text-sm mb-4">Comparación rápida de gastos totales</p>
            <div className="inline-flex items-center gap-8 bg-gray-50 rounded-2xl px-8 py-4">
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Córdoba</p>
                <p className="text-2xl font-black text-gray-900">{totalCordoba}</p>
              </div>
              <div className="h-12 w-px bg-gray-200" />
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">CABA</p>
                <p className="text-2xl font-black text-gray-900">{totalCaba}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Los valores son aproximados y pueden variar según cuestiones particulares.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
