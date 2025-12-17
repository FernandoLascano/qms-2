import { Check } from 'lucide-react'
import Link from 'next/link'

export function Planes() {
  return (
    <section id="planes" className="py-20 bg-gradient-to-b from-red-50 to-white">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-4 text-red-900">Planes y Precios</h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Elegí el plan que mejor se adapte a tu proyecto. Todos incluyen seguimiento completo y garantía.
        </p>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Plan Esencial */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200 hover:border-red-300 transition">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2 text-red-900">Esencial</h3>
              <p className="text-gray-600 text-sm mb-4">Para startups y emprendedores</p>
              <div className="mb-2">
                <span className="text-4xl font-bold text-gray-900">$85.000</span>
              </div>
              <p className="text-sm text-gray-500">+ Tasas de jurisdicción</p>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Constitución completa en 5 días</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Hasta 3 socios</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Estatuto estándar</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Seguimiento online 24/7</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">CUIT y matrícula incluidos</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Soporte por chat</span>
              </li>
            </ul>

            <Link
              href="/registro"
              className="block w-full text-center bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition font-semibold"
            >
              Elegir Plan
            </Link>
          </div>

          {/* Plan Profesional - Destacado */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-red-700 hover:border-red-800 transition transform md:scale-105 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-red-700 text-white px-4 py-1 rounded-full text-sm font-semibold">
                MÁS POPULAR
              </span>
            </div>

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2 text-red-900">Profesional</h3>
              <p className="text-gray-600 text-sm mb-4">Para PyMEs en crecimiento</p>
              <div className="mb-2">
                <span className="text-4xl font-bold text-red-700">$120.000</span>
              </div>
              <p className="text-sm text-gray-500">+ Tasas de jurisdicción</p>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 font-medium">Todo del Plan Esencial, más:</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Hasta 10 socios</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Estatuto personalizado</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Asesoría legal incluida</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Gestoría de bancos</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Prioridad en respuestas</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">1 reforma de estatuto gratis</span>
              </li>
            </ul>

            <Link
              href="/registro"
              className="block w-full text-center bg-red-700 text-white py-3 rounded-lg hover:bg-red-800 transition font-semibold shadow-lg"
            >
              Elegir Plan
            </Link>
          </div>

          {/* Plan Empresarial */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200 hover:border-red-300 transition">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2 text-red-900">Empresarial</h3>
              <p className="text-gray-600 text-sm mb-4">Para grandes proyectos</p>
              <div className="mb-2">
                <span className="text-4xl font-bold text-gray-900">Consultar</span>
              </div>
              <p className="text-sm text-gray-500">Presupuesto personalizado</p>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 font-medium">Todo del Plan Profesional, más:</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Socios ilimitados</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Cláusulas especiales</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Acuerdos de accionistas</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Asesoría contable/impositiva</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Gestor dedicado</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Soporte 24/7 prioritario</span>
              </li>
            </ul>

            <a
              href="mailto:contacto@quieromisas.com"
              className="block w-full text-center bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition font-semibold"
            >
              Contactar
            </a>
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-gray-600 max-w-3xl mx-auto">
          <p>
            <strong>Nota:</strong> Los precios no incluyen las tasas de inscripción de IGJ/IPJ (varían según jurisdicción y capital social) 
            ni el depósito del 25% del capital social. Te informamos todos los costos detallados antes de comenzar.
          </p>
        </div>
      </div>
    </section>
  )
}

