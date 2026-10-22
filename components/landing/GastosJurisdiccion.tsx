'use client'

import { useState } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { MapPin, Info, CheckCircle2, AlertCircle } from 'lucide-react'

export interface Jurisdiccion {
  id: string
  jurisdiccion: string
  nombre: string
  habilitada: boolean
  gastos: { concepto: string; valor: string }[]
  totalEstimado: string | null
  orden: number
}

/** Las jurisdicciones llegan del servidor (ISR de la home): sin fetch por visita. */
export function GastosJurisdiccion({ jurisdicciones }: { jurisdicciones: Jurisdiccion[] }) {
  // Seleccionar la primera habilitada por defecto
  const [selected, setSelected] = useState(() => Math.max(0, jurisdicciones.findIndex((j) => j.habilitada)))

  if (jurisdicciones.length === 0) {
    return null
  }

  const current = jurisdicciones[selected]
  const gastos = (current?.gastos as { concepto: string; valor: string }[]) || []

  return (
    <section id="gastos" className="py-seccion md:py-seccion-lg bg-surface">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <m.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block text-brand-700 font-semibold text-sm tracking-wider uppercase mb-4">
            Costos adicionales
          </span>
          <h2 className="text-display md:text-display-lg font-black text-ink mb-4">
            Gastos según{' '}
            <span className="text-brand-700">jurisdicción</span>
          </h2>
          <p className="text-lead text-ink-3 max-w-2xl mx-auto">
            Además de nuestros honorarios, existen gastos de inscripción que varían según donde constituyas tu S.A.S.
          </p>
        </m.div>

        {/* Selector de Jurisdicción */}
        <m.div
          className="flex justify-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="inline-flex bg-surface-3 rounded-control p-1.5 flex-wrap justify-center gap-1">
            {jurisdicciones.map((j, index) => (
              <button
                key={j.id}
                onClick={() => setSelected(index)}
                className={`relative flex items-center gap-2 px-5 py-3 rounded-chip font-semibold text-sm transition-all duration-300 cursor-pointer ${
                  selected === index
                    ? `text-white ${j.habilitada ? 'bg-brand-700' : 'bg-n-500'}`
                    : !j.habilitada
                      ? 'text-n-400'
                      : 'text-ink-2 hover:text-ink'
                }`}
              >
                <MapPin className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{j.nombre}</span>
                {!j.habilitada && selected !== index && (
                  <span className="relative z-10 text-xs bg-n-200 text-ink-3 px-1.5 py-0.5 rounded-full">
                    Próximamente
                  </span>
                )}
              </button>
            ))}
          </div>
        </m.div>

        {/* Cards de Gastos */}
        <div className="max-w-6xl mx-auto">
          {/* Banner de no disponible */}
          {!current.habilitada && (
            <m.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-warning-soft border border-warning-line rounded-control flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-warning">Jurisdicción no disponible actualmente</p>
                <p className="text-sm text-warning mt-1">
                  Por el momento no estamos operando en {current.nombre}. Te mostramos los gastos de referencia para que puedas comparar.
                  Te recomendamos constituir en <strong>Córdoba (IPJ)</strong> donde tenemos operación activa y los costos son más accesibles.
                </p>
              </div>
            </m.div>
          )}

          <AnimatePresence mode="wait">
            <m.div
              key={current.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {gastos.map((gasto, index) => (
                <m.div
                  key={gasto.concepto}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`rounded-control p-5 border transition-all duration-300 ${
                    current.habilitada
                      ? 'bg-surface-2 border-n-100 hover:border-line hover:shadow-raise'
                      : 'bg-surface-2/60 border-n-100/60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className={`font-bold ${current.habilitada ? 'text-ink' : 'text-ink-3'}`}>
                        {gasto.concepto}
                      </h3>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`text-title font-black ${current.habilitada ? 'text-ink' : 'text-n-400'}`}>
                        {gasto.valor}
                      </span>
                    </div>
                  </div>
                </m.div>
              ))}

              {/* Total estimado */}
              {current.totalEstimado && (
                <m.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className={`rounded-card p-6 mt-6 ${
                    current.habilitada
                      ? 'bg-gradient-to-r from-ink to-n-800'
                      : 'bg-gradient-to-r from-n-600 to-n-500'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-n-400 text-sm mb-1">Total estimado de gastos</p>
                      <p className="text-white text-sm">
                        Inscripción ante {current.nombre}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl md:text-display font-black text-white">
                        {current.totalEstimado}
                      </span>
                      <p className="text-n-400 text-xs mt-1">*Valores aproximados</p>
                    </div>
                  </div>
                </m.div>
              )}
            </m.div>
          </AnimatePresence>

          {/* Notas informativas */}
          <m.div
            className="mt-10 grid md:grid-cols-2 gap-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex items-start gap-3 p-4 bg-info-soft rounded-control border border-info-line">
              <Info className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-info mb-1">Sobre el capital social</p>
                <p className="text-sm text-info">
                  El depósito del 25% del capital social solo aplica para Córdoba y se realiza en una cuenta especial abierta en el Banco de Córdoba y se recupera una vez inscripta la sociedad.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-success-soft rounded-control border border-success-line">
              <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-success mb-1">Sin sorpresas</p>
                <p className="text-sm text-success">
                  Te informamos todos los costos detallados antes de comenzar el trámite. Transparencia total.
                </p>
              </div>
            </div>
          </m.div>

          {/* Comparación rápida */}
          {jurisdicciones.length > 1 && (
            <m.div
              className="mt-10 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <p className="text-ink-3 text-sm mb-4">Comparación rápida de gastos totales</p>
              <div className="inline-flex items-center gap-6 sm:gap-8 bg-surface-2 rounded-card px-6 sm:px-8 py-4 flex-wrap justify-center">
                {jurisdicciones.map((j, i) => (
                  <div key={j.id} className="flex items-center gap-6 sm:gap-8">
                    <div className="text-center">
                      <p className="text-xs text-ink-3 uppercase tracking-wider mb-1">
                        {j.nombre.split('(')[0].trim()}
                      </p>
                      <p className={`text-title font-black ${j.habilitada ? 'text-ink' : 'text-n-400'}`}>
                        {j.totalEstimado || '-'}
                      </p>
                      {!j.habilitada && (
                        <p className="text-xs text-warning font-medium mt-1">No disponible</p>
                      )}
                    </div>
                    {i < jurisdicciones.length - 1 && (
                      <div className="h-12 w-px bg-n-200" />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-n-400 mt-3">
                Los valores son aproximados y pueden variar según cuestiones particulares.
              </p>
            </m.div>
          )}
        </div>
      </div>
    </section>
  )
}
