'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAlAparecer } from '@/components/landing/al-aparecer'

import { faqs } from '@/lib/faqs'


export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [showAll, setShowAll] = useState(false)
  const visibleFaqs = showAll ? faqs : faqs.slice(0, 6)
  const lista = useAlAparecer<HTMLDivElement>()

  return (
    <section id="faq" className="py-seccion md:py-seccion-lg bg-surface-2 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header con nuevo diseño */}
          <div
            className="text-center mb-12"
          >
            <span className="inline-block text-brand-700 font-semibold text-sm tracking-wider uppercase mb-4">
              FAQ
            </span>
            <h2 className="text-display md:text-display-lg font-black text-ink mb-4">
              Preguntas{' '}
              <span className="text-brand-700">frecuentes</span>
            </h2>
            <p className="text-lead text-ink-3 max-w-2xl mx-auto">
              Todo lo que necesitás saber sobre la constitución de tu S.A.S.
            </p>
          </div>

          {/* Lista de preguntas */}
          <div ref={lista.ref} className={`space-y-3 ${lista.clase}`}>
            {visibleFaqs.map((faq, index) => (
              <div
                key={index}
                className={`bg-surface rounded-control border overflow-hidden transition-all duration-300 ${
                  openIndex === index
                    ? 'border-brand-200 shadow-pop'
                    : 'border-line hover:border-line-strong hover:shadow-raise'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-chip flex items-center justify-center flex-shrink-0 transition-colors ${
                      openIndex === index ? 'bg-brand-100' : 'bg-surface-3'
                    }`}>
                      <HelpCircle className={`w-4 h-4 transition-colors ${
                        openIndex === index ? 'text-brand-600' : 'text-ink-3'
                      }`} />
                    </div>
                    <span className={`font-semibold transition-colors ${
                      openIndex === index ? 'text-brand-900' : 'text-ink'
                    }`}>
                      {faq.pregunta}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 flex-shrink-0 transition-all duration-300 ${
                      openIndex === index ? 'text-brand-600 rotate-180' : 'text-n-400'
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 pt-0">
                        <div className="pl-12">
                          <p className="text-ink-2 leading-relaxed">{faq.respuesta}</p>
                          {faq.link && (
                            <Link
                              href={faq.link.href}
                              className="inline-flex items-center gap-1 mt-3 font-semibold text-brand-700 hover:text-brand-800 underline underline-offset-2"
                            >
                              {faq.link.text}
                            </Link>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Ver más preguntas */}
          {!showAll && faqs.length > 6 && (
            <div
              className="text-center mt-8"
            >
              <button
                onClick={() => setShowAll(true)}
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-line rounded-control text-sm font-semibold text-n-700 hover:border-brand-300 hover:text-brand-700 transition-all cursor-pointer"
              >
                <ChevronDown className="w-4 h-4" />
                Ver las {faqs.length - 6} preguntas restantes
              </button>
            </div>
          )}

          {/* CTA de contacto */}
          <div
            className="mt-12 text-center"
          >
            <div className="bg-surface rounded-card p-8 border border-line shadow-card">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 bg-brand-100 rounded-control flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-brand-600" />
                </div>
              </div>
              <p className="text-ink font-semibold text-lead mb-2">¿No encontraste lo que buscabas?</p>
              <p className="text-ink-3 mb-6">Estamos acá para ayudarte con cualquier consulta</p>
              <a
                href="mailto:contacto@quieromisas.com"
                className="inline-flex items-center gap-2 bg-brand-700 text-white px-6 py-3 rounded-control hover:bg-brand-800 transition-colors font-semibold shadow-pop shadow-brand-200"
              >
                Contactanos directamente
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
