'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

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

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 text-red-900">Preguntas Frecuentes</h2>
          <p className="text-center text-gray-600 mb-12">
            Todo lo que necesitás saber sobre la constitución de tu S.A.S.
          </p>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden hover:border-red-300 transition"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-red-50 transition"
                >
                  <span className="font-semibold text-gray-900 pr-4">{faq.pregunta}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${
                      openIndex === index ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                {openIndex === index && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-gray-700 leading-relaxed">{faq.respuesta}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">¿No encontraste lo que buscabas?</p>
            <a
              href="mailto:contacto@quieromisas.com"
              className="inline-block bg-red-700 text-white px-6 py-3 rounded-lg hover:bg-red-800 transition font-medium"
            >
              Contactanos directamente
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

