import { Shield, Users, Zap, TrendingUp, FileCheck, DollarSign } from 'lucide-react'

export function QueEsSAS() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Intro */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-red-900">¿Qué es una S.A.S.?</h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              La <strong>Sociedad por Acciones Simplificada</strong> es un tipo societario moderno creado en 2017 
              que revolucionó la forma de constituir empresas en Argentina.
            </p>
          </div>

          {/* Características principales */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-red-700" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2 text-red-900">Puede ser unipersonal</h3>
                <p className="text-gray-600">
                  No necesitás socios. Podés constituirla vos solo, algo imposible en S.R.L. o S.A. tradicionales.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2 text-red-900">Trámite 100% digital</h3>
                <p className="text-gray-600">
                  Todo el proceso se hace online. Firma digital, documentos electrónicos, sin vueltas a escribanías.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2 text-red-900">Costos reducidos</h3>
                <p className="text-gray-600">
                  Gastos de constitución hasta 50% menores que una S.R.L. o S.A. tradicional.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2 text-red-900">Flexibilidad</h3>
                <p className="text-gray-600">
                  Estatuto adaptable a tus necesidades. Podés modificarlo sin grandes complicaciones.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2 text-red-900">Responsabilidad limitada</h3>
                <p className="text-gray-600">
                  Protegés tu patrimonio personal. Respondés solo con el capital que aportaste a la empresa.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <FileCheck className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2 text-red-900">Reconocimiento oficial</h3>
                <p className="text-gray-600">
                  CUIT automático, facturación electrónica, cuentas bancarias, todo como cualquier otra sociedad.
                </p>
              </div>
            </div>
          </div>

          {/* Marco legal */}
          <div className="bg-red-50 border-l-4 border-red-700 p-6 rounded-lg">
            <h3 className="font-bold text-lg mb-2 text-red-900">Marco Legal</h3>
            <p className="text-gray-700 mb-2">
              La S.A.S. está regulada por la <strong>Ley 27.349</strong> (modificada por Ley 27.444) y el <strong>Decreto 27/2018</strong>. 
              Es un tipo societario oficial, reconocido por AFIP, IGJ, IPJ y todas las entidades públicas y privadas.
            </p>
            <p className="text-gray-700">
              Podés consultar más información en el <a href="https://www.argentina.gob.ar/justicia/registronacional/registrodesociedades/sas" target="_blank" rel="noopener noreferrer" className="text-red-700 underline hover:text-red-800">sitio oficial del Gobierno Argentino</a>.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

