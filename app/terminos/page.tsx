import Link from 'next/link'
import Navbar from '@/components/Navbar'

export const metadata = {
  title: 'Términos y Condiciones | QuieroMiSAS',
  description: 'Términos y condiciones de uso del servicio de constitución de Sociedades por Acciones Simplificadas (S.A.S.) en Argentina.',
}

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <article className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Términos y Condiciones</h1>
          <p className="text-gray-500 mb-12">Última actualización: {new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="prose prose-gray max-w-none space-y-8 text-gray-600">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Aceptación de los términos</h2>
              <p>
                Al acceder y utilizar el sitio web QuieroMiSAS (en adelante, &quot;el Sitio&quot;) y los servicios ofrecidos a través del mismo, el usuario acepta estar sujeto a los presentes Términos y Condiciones. Si no está de acuerdo con alguna de las disposiciones, deberá abstenerse de utilizar el Sitio y los servicios.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Descripción del servicio</h2>
              <p>
                QuieroMiSAS es una plataforma digital que facilita la constitución de Sociedades por Acciones Simplificadas (S.A.S.) en la República Argentina. El servicio incluye asesoramiento, preparación de documentación, tramitación ante organismos competentes (IGJ, IPJ, etc.) y gestión de los trámites asociados. Los servicios se prestan de acuerdo con la legislación argentina vigente.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Registro y cuenta de usuario</h2>
              <p>
                Para utilizar ciertos servicios, el usuario debe registrarse y crear una cuenta. Es responsable de mantener la confidencialidad de sus credenciales y de todas las actividades que se realicen bajo su cuenta. Debe proporcionar información veraz, completa y actualizada.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Obligaciones del usuario</h2>
              <p>
                El usuario se compromete a: (a) proporcionar información precisa y completa; (b) cumplir con los requisitos legales y documentales exigidos para la constitución de la S.A.S.; (c) realizar los pagos correspondientes en tiempo y forma; (d) no utilizar el servicio para fines ilegales o fraudulentos; (e) respetar los plazos y procedimientos indicados.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Precios y pagos</h2>
              <p>
                Los precios publicados se expresan en pesos argentinos e incluyen los honorarios por el servicio. Pueden no incluir tasas de organismos públicos, depósitos legales o gastos adicionales que se informarán según corresponda. Los pagos se realizan según los métodos de pago disponibles en la plataforma. Las facturas se emitirán según la normativa vigente.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Proceso y plazos</h2>
              <p>
                Los plazos de tramitación son estimados y pueden variar según la carga de los organismos, la jurisdicción y la complejidad del caso. QuieroMiSAS no garantiza plazos específicos pero se compromete a gestionar los trámites con diligencia. El usuario será informado sobre el avance del proceso.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Limitación de responsabilidad</h2>
              <p>
                QuieroMiSAS actúa como intermediario y facilitador de trámites. No se hace responsable por decisiones de organismos públicos, rechazos de denominaciones, demoras ajenas a su gestión o por la información proporcionada de manera incorrecta por el usuario. La responsabilidad se limita a la correcta tramitación de los documentos recibidos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Propiedad intelectual</h2>
              <p>
                Todo el contenido del Sitio (textos, logos, diseños, software) es propiedad de QuieroMiSAS o de sus licenciantes. Queda prohibida la reproducción, distribución o uso no autorizado sin consentimiento previo por escrito.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Modificaciones</h2>
              <p>
                QuieroMiSAS se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento. Los cambios se publicarán en el Sitio y se aplicarán a partir de su publicación. El uso continuado del servicio tras la modificación implica la aceptación de los nuevos términos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Ley aplicable y jurisdicción</h2>
              <p>
                Los presentes Términos y Condiciones se rigen por las leyes de la República Argentina. Para cualquier controversia, las partes se someten a los tribunales competentes de la ciudad de Córdoba, República Argentina.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Contacto</h2>
              <p>
                Para consultas sobre estos Términos y Condiciones: contacto@quieromisas.com | Tel: +54 351 428 4037 | Córdoba, Argentina.
              </p>
            </section>
          </div>

          <div className="mt-4 pt-8 border-t border-gray-200">
            <Link href="/" className="text-brand-700 hover:text-brand-800 font-medium">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </article>
    </div>
  )
}
