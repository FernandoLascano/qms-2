import Link from 'next/link'
import Navbar from '@/components/Navbar'

export const metadata = {
  title: 'Política de Privacidad | QuieroMiSAS',
  description: 'Política de privacidad y protección de datos personales. Cumplimiento de la Ley 25.326 de la República Argentina.',
}

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <article className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Política de Privacidad</h1>
          <p className="text-gray-500 mb-12">Última actualización: {new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="prose prose-gray max-w-none space-y-8 text-gray-600">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Marco legal</h2>
              <p>
                QuieroMiSAS se encuentra comprometido con la protección de los datos personales de sus usuarios. El tratamiento de datos se realiza en cumplimiento de la <strong>Ley 25.326 de Protección de Datos Personales</strong> de la República Argentina, su decreto reglamentario 1558/2001, y las disposiciones de la Dirección Nacional de Protección de Datos Personales (DPDP).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Responsable del tratamiento</h2>
              <p>
                El responsable del tratamiento de los datos personales es QuieroMiSAS, con domicilio en Córdoba, República Argentina. Para ejercer sus derechos en materia de protección de datos, puede contactarse a: contacto@quieromisas.com.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Datos que recopilamos</h2>
              <p>
                Recopilamos únicamente los datos necesarios para prestar nuestros servicios y para cumplir con las obligaciones legales:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li><strong>Datos de identificación:</strong> nombre, apellido, documento nacional de identidad (DNI), CUIT/CUIL, fecha de nacimiento, nacionalidad.</li>
                <li><strong>Datos de contacto:</strong> correo electrónico, teléfono, domicilio.</li>
                <li><strong>Datos del trámite:</strong> información relativa a la constitución de la sociedad (denominación, capital social, socios, objeto social, etc.).</li>
                <li><strong>Datos de la cuenta:</strong> usuario, contraseña (encriptada), historial de actividad.</li>
                <li><strong>Datos de pago:</strong> información necesaria para procesar pagos (se procesan a través de proveedores autorizados como Mercado Pago).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Finalidad del tratamiento</h2>
              <p>
                Los datos personales se utilizan para: (a) gestionar la constitución de S.A.S. y los trámites asociados; (b) comunicarnos con el usuario sobre el estado de su trámite; (c) cumplir con obligaciones legales y regulatorias (IGJ, IPJ, AFIP, etc.); (d) emitir facturas y documentación; (e) mejorar nuestros servicios; (f) enviar comunicaciones comerciales cuando el usuario haya dado su consentimiento.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Base legal y consentimiento</h2>
              <p>
                El tratamiento de datos se basa en: (a) el consentimiento del titular para el registro y uso de la plataforma; (b) la ejecución del contrato de prestación de servicios; (c) el cumplimiento de obligaciones legales. Al registrarse y utilizar nuestros servicios, el usuario consiente el tratamiento de sus datos conforme a esta política. Para fines comerciales o de marketing, se solicitará consentimiento expreso adicional.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Derechos del titular (Ley 25.326)</h2>
              <p>
                Conforme a la Ley 25.326, el titular de los datos personales tiene derecho a:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li><strong>Acceso:</strong> conocer qué datos suyos tenemos y cómo los tratamos.</li>
                <li><strong>Rectificación:</strong> solicitar la corrección de datos inexactos o incompletos.</li>
                <li><strong>Supresión:</strong> solicitar la eliminación de datos cuando no exista obligación legal de conservarlos.</li>
                <li><strong>Oposición:</strong> oponerse al tratamiento en determinados supuestos.</li>
              </ul>
              <p className="mt-3">
                Para ejercer estos derechos, debe dirigirse a contacto@quieromisas.com con su solicitud. La DPDP es el órgano de control competente para atender reclamos: <a href="https://www.argentina.gob.ar/justicia/derechofacil/ley simple/proteccion-datos-personales" target="_blank" rel="noopener noreferrer" className="text-brand-700 hover:underline">www.argentina.gob.ar</a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Conservación de datos</h2>
              <p>
                Los datos se conservan durante el tiempo necesario para cumplir con la finalidad del tratamiento y con las obligaciones legales (por ejemplo, documentación societaria y contable según normativa vigente). Una vez cumplidos los plazos legales, los datos se suprimen o anonimizan de forma segura.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Seguridad</h2>
              <p>
                Implementamos medidas técnicas y organizativas para proteger los datos personales contra accesos no autorizados, alteración, pérdida o destrucción. Utilizamos conexiones seguras (HTTPS), encriptación de contraseñas y controles de acceso. Los datos se almacenan en servicios con medidas de seguridad adecuadas.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Cesión y transferencia</h2>
              <p>
                Los datos pueden ser comunicados a: organismos públicos (IGJ, IPJ, AFIP, etc.) cuando sea necesario para el trámite; proveedores de servicios que nos asisten (hosting, email, pagos), que actúan como encargados del tratamiento y están obligados a mantener la confidencialidad. No vendemos ni cedemos datos a terceros con fines comerciales sin consentimiento expreso.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Cookies y tecnologías similares</h2>
              <p>
                Utilizamos cookies y tecnologías similares para el funcionamiento del sitio, la sesión del usuario y la mejora de la experiencia. Se pueden configurar las preferencias de cookies desde el navegador. Las cookies esenciales son necesarias para el correcto funcionamiento del servicio.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Modificaciones</h2>
              <p>
                Esta Política de Privacidad puede ser actualizada. Los cambios se publicarán en esta página con la fecha de última actualización. Se recomienda revisarla periódicamente. El uso continuado del servicio tras la modificación implica la aceptación de la política actualizada.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Contacto</h2>
              <p>
                Para consultas sobre protección de datos: contacto@quieromisas.com | Tel: +54 351 428 4037 | Córdoba, Argentina.
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
