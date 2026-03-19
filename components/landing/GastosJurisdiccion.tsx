'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Info, CheckCircle2, AlertCircle } from 'lucide-react'

interface Jurisdiccion {
  id: string
  jurisdiccion: string
  nombre: string
  habilitada: boolean
  gastos: { concepto: string; valor: string }[]
  totalEstimado: string | null
  orden: number
}

export function GastosJurisdiccion() {
  const [jurisdicciones, setJurisdicciones] = useState<Jurisdiccion[]>([])
  const [selected, setSelected] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/jurisdicciones')
      .then(res => res.json())
      .then(data => {
        setJurisdicciones(data)
        // Seleccionar la primera habilitada por defecto
        const firstEnabled = data.findIndex((j: Jurisdiccion) => j.habilitada)
        if (firstEnabled >= 0) setSelected(firstEnabled)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading || jurisdicciones.length === 0) {
    return null
  }

  const current = jurisdicciones[selected]
  const gastos = (current?.gastos as { concepto: string; valor: string }[]) || []

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
          <div className="inline-flex bg-gray-100 rounded-xl p-1.5 flex-wrap justify-center gap-1">
            {jurisdicciones.map((j, index) => (
              <button
                key={j.id}
                onClick={() => setSelected(index)}
                className={`relative flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm transition-all duration-300 cursor-pointer ${
                  selected === index
                    ? 'text-white'
                    : !j.habilitada
                      ? 'text-gray-400'
                      : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {selected === index && (
                  <motion.div
                    layoutId="jurisdiccionBg"
                    className={`absolute inset-0 rounded-lg ${j.habilitada ? 'bg-brand-700' : 'bg-gray-500'}`}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <MapPin className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{j.nombre}</span>
                {!j.habilitada && selected !== index && (
                  <span className="relative z-10 text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">
                    Próximamente
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Cards de Gastos */}
        <div className="max-w-6xl mx-auto">
          {/* Banner de no disponible */}
          {!current.habilitada && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900">Jurisdicción no disponible actualmente</p>
                <p className="text-sm text-amber-700 mt-1">
                  Por el momento no estamos operando en {current.nombre}. Te mostramos los gastos de referencia para que puedas comparar.
                  Te recomendamos constituir en <strong>Córdoba (IPJ)</strong> donde tenemos operación activa y los costos son más accesibles.
                </p>
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
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
                  className={`rounded-xl p-5 border transition-all duration-300 ${
                    current.habilitada
                      ? 'bg-gray-50 border-gray-100 hover:border-gray-200 hover:shadow-md'
                      : 'bg-gray-50/60 border-gray-100/60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className={`font-bold ${current.habilitada ? 'text-gray-900' : 'text-gray-500'}`}>
                        {gasto.concepto}
                      </h3>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`text-2xl font-black ${current.habilitada ? 'text-gray-900' : 'text-gray-400'}`}>
                        {gasto.valor}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Total estimado */}
              {current.totalEstimado && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className={`rounded-2xl p-6 mt-6 ${
                    current.habilitada
                      ? 'bg-gradient-to-r from-gray-900 to-gray-800'
                      : 'bg-gradient-to-r from-gray-600 to-gray-500'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Total estimado de gastos</p>
                      <p className="text-white text-sm">
                        Inscripción ante {current.nombre}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl md:text-4xl font-black text-white">
                        {current.totalEstimado}
                      </span>
                      <p className="text-gray-400 text-xs mt-1">*Valores aproximados</p>
                    </div>
                  </div>
                </motion.div>
              )}
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
                  El depósito del 25% del capital social solo aplica para Córdoba y se realiza en una cuenta especial abierta en el Banco de Córdoba y se recupera una vez inscripta la sociedad.
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
          {jurisdicciones.length > 1 && (
            <motion.div
              className="mt-10 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <p className="text-gray-500 text-sm mb-4">Comparación rápida de gastos totales</p>
              <div className="inline-flex items-center gap-6 sm:gap-8 bg-gray-50 rounded-2xl px-6 sm:px-8 py-4 flex-wrap justify-center">
                {jurisdicciones.map((j, i) => (
                  <div key={j.id} className="flex items-center gap-6 sm:gap-8">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                        {j.nombre.split('(')[0].trim()}
                      </p>
                      <p className={`text-2xl font-black ${j.habilitada ? 'text-gray-900' : 'text-gray-400'}`}>
                        {j.totalEstimado || '-'}
                      </p>
                      {!j.habilitada && (
                        <p className="text-xs text-amber-600 font-medium mt-1">No disponible</p>
                      )}
                    </div>
                    {i < jurisdicciones.length - 1 && (
                      <div className="h-12 w-px bg-gray-200" />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Los valores son aproximados y pueden variar según cuestiones particulares.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  )
}
