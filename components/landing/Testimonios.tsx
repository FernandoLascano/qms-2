import { Star } from 'lucide-react'

const testimonios = [
  {
    nombre: 'María González',
    empresa: 'Tech Innovate SAS',
    puesto: 'CEO & Founder',
    testimonio: 'Increíble experiencia. En menos de una semana teníamos todo listo para empezar a facturar. La plataforma es súper clara y el soporte respondió todas nuestras dudas al instante.',
    rating: 5,
    imagen: '/avatars/maria.jpg' // Placeholder
  },
  {
    nombre: 'Luciano Martínez',
    empresa: 'Estudio Contable LM',
    puesto: 'Contador Público',
    testimonio: 'Como contador, he trabajado con muchas plataformas de constitución. QuieroMiSAS es, sin dudas, la más eficiente. Los documentos llegaron perfectos y el proceso fue transparente de principio a fin.',
    rating: 5,
    imagen: '/avatars/luciano.jpg'
  },
  {
    nombre: 'Ana Rodríguez',
    empresa: 'Marketing Digital AR',
    puesto: 'Directora Comercial',
    testimonio: 'Necesitábamos constituir la S.A.S. urgente para cerrar un contrato. El equipo se movió super rápido, cumplieron con los tiempos prometidos y nos salvaron. 100% recomendable.',
    rating: 5,
    imagen: '/avatars/ana.jpg'
  }
]

export function Testimonios() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-4 text-red-900">Lo que dicen nuestros clientes</h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Más de 500 empresas ya confiaron en nosotros para constituir su S.A.S.
        </p>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonios.map((testimonio, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition"
            >
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonio.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Testimonio */}
              <p className="text-gray-700 mb-6 leading-relaxed italic">
                "{testimonio.testimonio}"
              </p>

              {/* Autor */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {testimonio.nombre.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{testimonio.nombre}</p>
                  <p className="text-sm text-gray-600">{testimonio.puesto}</p>
                  <p className="text-sm text-red-700 font-medium">{testimonio.empresa}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Estadísticas adicionales */}
        <div className="mt-16 grid md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
          <div>
            <div className="text-4xl font-bold text-red-700 mb-2">500+</div>
            <div className="text-gray-600 text-sm">Empresas constituidas</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-red-700 mb-2">4.9/5</div>
            <div className="text-gray-600 text-sm">Calificación promedio</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-red-700 mb-2">5 días</div>
            <div className="text-gray-600 text-sm">Tiempo promedio</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-red-700 mb-2">24/7</div>
            <div className="text-gray-600 text-sm">Soporte disponible</div>
          </div>
        </div>
      </div>
    </section>
  )
}

