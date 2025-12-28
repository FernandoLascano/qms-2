'use client'

import { useState, useRef } from 'react'
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'framer-motion'

interface FAQItem {
  pregunta: string
  respuesta: string
}

const faqs: FAQItem[] = [
  {
    pregunta: '¿Qué es una S.A.S. y por qué elegirla?',
    respuesta: 'La Sociedad por Acciones Simplificada (S.A.S.) es un tipo societario moderno en Argentina que combina la flexibilidad de una S.R.L. con las ventajas de una S.A., pero con costos menores y trámites más simples. Es ideal para startups, PyMEs y emprendedores que buscan formalizar su negocio rápidamente.'
  },
  {
    pregunta: '¿Cuánto tiempo tarda el proceso completo?',
    respuesta: 'El proceso completo toma aproximadamente 5 días hábiles desde que completás el formulario y aportás toda la documentación. Esto incluye la reserva de denominación, depósito de capital, firma digital y la inscripción ante IPJ (Córdoba) o IGJ (CABA).'
  },
  {
    pregunta: '¿Cuánto cuesta constituir una S.A.S.?',
    respuesta: 'Los costos varían según la jurisdicción y el capital social, pero incluyen: honorarios profesionales (desde $85.000), tasas de inscripción (variables según jurisdicción), y el depósito del 25% del capital social en una cuenta bancaria. Todos los costos son informados con transparencia antes de comenzar.'
  },
  {
    pregunta: '¿Necesito capital mínimo?',
    respuesta: 'Sí, una S.A.S. requiere un capital social mínimo de 2 salarios mínimos vitales y móviles (aproximadamente $280.000 al 2024). Solo necesitás integrar el 25% al momento de la constitución, el resto puede aportarse en hasta 2 años.'
  },
  {
    pregunta: '¿Puedo constituir solo o necesito socios?',
    respuesta: 'Podés constituir una S.A.S. unipersonal (con un solo socio) o con hasta 100 socios. Es una de las grandes ventajas: no necesitás buscar un socio ficticio como en otros tipos societarios tradicionales.'
  },
  {
    pregunta: '¿En qué jurisdicciones trabajan?',
    respuesta: 'Actualmente trabajamos en Córdoba (IPJ) y Ciudad Autónoma de Buenos Aires (IGJ). Tu empresa, una vez inscripta, puede operar en todo el territorio argentino sin restricciones.'
  },
  {
    pregunta: '¿Qué documentos necesito para empezar?',
    respuesta: 'Necesitás: DNI (frente y dorso) de todos los socios, CUIT/CUIL de cada socio, comprobante de domicilio del domicilio social, y constancia de CBU de la cuenta bancaria donde se depositará el capital social. Todo se sube digitalmente a la plataforma.'
  },
  {
    pregunta: '¿Puedo hacer seguimiento del trámite?',
    respuesta: 'Sí, nuestra plataforma te permite hacer seguimiento en tiempo real de cada etapa: desde la reserva de denominación hasta la inscripción final. Recibís notificaciones automáticas por email y podés chatear directamente con nuestro equipo desde tu panel.'
  },
  {
    pregunta: '¿Qué pasa si rechazan mi documentación?',
    respuesta: 'Si algún documento es rechazado, te notificamos inmediatamente con las observaciones específicas. Podés corregir y reenviar el documento desde tu panel. No cobramos extra por correcciones, está incluido en el servicio.'
  },
  {
    pregunta: '¿La S.A.S. es reconocida por AFIP y bancos?',
    respuesta: 'Sí, absolutamente. La S.A.S. es un tipo societario oficial regulado por la Ley 27.349. Obtenés CUIT automáticamente al inscribirte y podés operar con bancos, facturar, contratar empleados y realizar cualquier actividad comercial legal.'
  }
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })

  return (
    <section ref={sectionRef} id="faq" className="py-20 md:py-28 bg-gray-50 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header con nuevo diseño */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-red-700 font-semibold text-sm tracking-wider uppercase mb-4">
              FAQ
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Preguntas{' '}
              <span className="text-red-700">frecuentes</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Todo lo que necesitás saber sobre la constitución de tu S.A.S.
            </p>
          </motion.div>

          {/* Lista de preguntas */}
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
                className={`bg-white rounded-xl border overflow-hidden transition-all duration-300 ${
                  openIndex === index
                    ? 'border-red-200 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      openIndex === index ? 'bg-red-100' : 'bg-gray-100'
                    }`}>
                      <HelpCircle className={`w-4 h-4 transition-colors ${
                        openIndex === index ? 'text-red-600' : 'text-gray-500'
                      }`} />
                    </div>
                    <span className={`font-semibold transition-colors ${
                      openIndex === index ? 'text-red-900' : 'text-gray-900'
                    }`}>
                      {faq.pregunta}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 flex-shrink-0 transition-all duration-300 ${
                      openIndex === index ? 'text-red-600 rotate-180' : 'text-gray-400'
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
                          <p className="text-gray-600 leading-relaxed">{faq.respuesta}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* CTA de contacto */}
          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <p className="text-gray-900 font-semibold text-lg mb-2">¿No encontraste lo que buscabas?</p>
              <p className="text-gray-500 mb-6">Estamos acá para ayudarte con cualquier consulta</p>
              <a
                href="mailto:contacto@quieromisas.com"
                className="inline-flex items-center gap-2 bg-red-700 text-white px-6 py-3 rounded-xl hover:bg-red-800 transition-colors font-semibold shadow-lg shadow-red-200"
              >
                Contactanos directamente
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
