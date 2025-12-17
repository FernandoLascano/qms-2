import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Clock, Tag } from 'lucide-react'

type Section =
  | { type: 'h2'; text: string }
  | { type: 'p'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'quote'; text: string }

type Post = {
  slug: string
  title: string
  category: string
  date: string
  lectura: string
  hero: string
  alt: string
  summary: string
  tags: string[]
  sections: Section[]
}

const posts: Post[] = [
  {
    slug: 'importancia-contar-sociedad-emprender-argentina',
    title: 'La importancia de contar con una Sociedad para emprender en Argentina',
    category: 'Emprendimiento',
    date: '20 Dic 2024',
    lectura: '3 min',
    hero: '/assets/img/nota.png',
    alt: 'Profesional firma documentos con laptop y bandera argentina',
    summary:
      'Separar tu patrimonio personal, ganar credibilidad y proteger tu negocio. Por qué formalizarse cambia el juego para los emprendedores.',
    tags: [
      'Sociedades',
      'Emprendimientos',
      'Argentina',
      'Constituir una Sociedad',
      'Sociedad por Acciones Simplificada (SAS)',
      'Protección patrimonial emprendedores',
    ],
    sections: [
      { type: 'h2', text: '¿Qué es una Sociedad y por qué debería interesarte?' },
      {
        type: 'p',
        text: 'Una Sociedad separa tu patrimonio personal del del negocio. Ante deudas o reclamos, tus bienes personales quedan protegidos. Además te permite emitir facturas, contratar empleados formalmente, abrir cuentas bancarias comerciales, pedir financiamiento y participar en licitaciones o contratos grandes.',
      },
      { type: 'h2', text: '¿Qué riesgos asumís si no formalizás tu actividad?' },
      {
        type: 'list',
        items: [
          'Responsabilidad patrimonial ilimitada: respondés con todos tus bienes.',
          'Menos credibilidad frente a clientes, bancos e inversores.',
          'Riesgos fiscales y sanciones (multas, clausuras, inspecciones).',
          'Limitaciones de crecimiento: es casi imposible atraer inversión o profesionalizar el proyecto.',
        ],
      },
      { type: 'h2', text: '¿Qué tipo de Sociedad te conviene para empezar?' },
      {
        type: 'p',
        text: 'La Sociedad por Acciones Simplificada (SAS) es la más elegida: ágil, accesible y 100% online. Podés iniciar solo o con socios, con reglas internas flexibles y bajo costo de mantenimiento. SRL o SA siguen siendo alternativas válidas para negocios de mayor escala.',
      },
      { type: 'h2', text: '¿Cómo constituir una Sociedad de forma sencilla?' },
      {
        type: 'p',
        text: 'Completa el formulario, reservamos el nombre, redactamos estatuto e inscribimos la sociedad. Obtenés CUIT, matrícula y toda la documentación lista para operar. Todo online, rápido y con soporte profesional.',
      },
    ],
  },
  {
    slug: 'guia-practica-constitucion-sociedades-argentina',
    title: 'Guía Práctica: Constitución de Sociedades en Argentina',
    category: 'Guías',
    date: '18 Dic 2024',
    lectura: '5 min',
    hero: '/assets/img/nota2.png',
    alt: 'Guía práctica de constitución de sociedades con iconos legales',
    summary:
      'Tipos societarios, requisitos generales y paso a paso para constituir una SAS de manera ágil y 100% digital.',
    tags: [
      'Sociedades',
      'Emprendimientos',
      'Constituir una Sociedad',
      'Requisitos',
      'Sociedad por Acciones Simplificada (SAS)',
      'Crear empresa en Argentina',
    ],
    sections: [
      { type: 'h2', text: 'Tipos de sociedades en Argentina: ¿cuál elegir?' },
      {
        type: 'p',
        text: 'Elegir la figura societaria impacta en operativa, responsabilidad y crecimiento. La SRL limita la responsabilidad pero es menos flexible; la SA es ideal para grandes inversiones pero requiere capital alto; la SAS combina agilidad, digitalización y costos bajos, permitiendo 1 o más socios.',
      },
      { type: 'h2', text: 'Requisitos generales para constituir' },
      {
        type: 'list',
        items: [
          'Documentación personal (DNI/ CDI) y reserva de denominación social.',
          'Capital mínimo según tipo: SAS (2 SMVM), SA (capital legal), SRL (capital acorde).',
          'Estatuto social: nombre, domicilio, objeto, capital, gobierno interno.',
          'Inscripción en Registro Público, publicación en Boletín Oficial y pago de tasas.',
        ],
      },
      { type: 'h2', text: 'Cómo constituir una SAS paso a paso' },
      {
        type: 'list',
        items: [
          'Elegir nombre disponible y reservar denominación.',
          'Completar formulario digital con datos de socios y capital.',
          'Redactar estatuto y presentar en el Registro Público.',
          'Obtener CUIT, abrir cuenta bancaria y emitir facturas.',
        ],
      },
      { type: 'h2', text: 'Después de constituir: qué sigue' },
      {
        type: 'p',
        text: 'Obligaciones contables y fiscales permanentes (facturación, DJ mensuales y anuales), registro como empleador, ART y cumplimiento laboral. Profesionalizar desde el inicio reduce riesgos y mejora la escalabilidad.',
      },
    ],
  },
  {
    slug: 'costos-2025-constituir-sas-argentina-guia-completa',
    title: 'Costos 2025 para Constituir una SAS en Argentina: Guía Completa y Comparativa',
    category: 'Costos',
    date: '15 Dic 2024',
    lectura: '4 min',
    hero: '/assets/img/nota3.png',
    alt: 'Comparativa de costos de constitución de SAS en Argentina',
    summary:
      'Relevamos costos por jurisdicción (Córdoba, CABA, Buenos Aires, Mendoza) y qué considerar para optimizar la inversión inicial.',
    tags: [
      'SAS Argentina 2025',
      'Costo de constituir una SAS',
      'Sociedad por Acciones Simplificada precios',
      'Abrir SAS en Córdoba',
      'Costos SAS por provincia',
    ],
    sections: [
      { type: 'h2', text: '¿Cuánto cuesta abrir una SAS en 2025?' },
      {
        type: 'p',
        text: 'Costos administrativos típicos: tasas de inscripción, publicación legal, honorarios profesionales, depósito transitorio de capital y certificaciones de firma.',
      },
      { type: 'h2', text: 'Comparativa de costos por jurisdicción' },
      {
        type: 'list',
        items: [
          'Córdoba: ~$130.000. Suele ser la opción más económica y ágil.',
          'Buenos Aires (PBA): ~$155.000. Procedimiento más restrictivo y menos ágil.',
          'CABA (IGJ): ~$185.000. Proceso eficiente y digital; publicación puede variar.',
          'Mendoza: ~$215.000. Costos más altos; elegir solo si la operación lo requiere.',
        ],
      },
      { type: 'h2', text: 'Otros gastos a considerar' },
      {
        type: 'list',
        items: [
          'Honorarios jurídicos y contables.',
          'Apertura de cuenta bancaria empresarial.',
          'Depósitos iniciales de capital (según el caso).',
        ],
      },
      { type: 'h2', text: '¿Por qué Córdoba es la mejor opción en 2025?' },
      {
        type: 'p',
        text: 'Costos bajos, tiempos mínimos, trámite 100% digital y reintegro rápido del capital. Si tu negocio no depende de otra plaza, Córdoba es la opción más eficiente.',
      },
    ],
  },
  {
    slug: 'sas-vs-srl-cual-conviene-mas',
    title: 'S.A.S. vs S.R.L.: ¿Cuál conviene más para tu emprendimiento?',
    category: 'Comparativas',
    date: '12 Dic 2024',
    lectura: '6 min',
    hero: '/assets/img/comparativa-sas-srl.png',
    alt: 'Comparativa entre SAS y SRL para emprendedores',
    summary:
      'Ventajas, desventajas, costos y tiempos de la SAS frente a la SRL. Qué elegir según etapa y tamaño de tu empresa.',
    tags: [
      'SAS vs SRL',
      'Comparativa sociedades',
      'Elegir tipo societario',
      'Emprendimientos Argentina',
    ],
    sections: [
      { type: 'h2', text: 'Lo esencial en pocas palabras' },
      {
        type: 'list',
        items: [
          'SAS: flexible, 100% digital, capital bajo (2 SMVM), permite 1 socio y trámites rápidos.',
          'SRL: más tradicional, requiere al menos 2 socios, capital acorde, trámites presenciales según jurisdicción.',
        ],
      },
      { type: 'h2', text: 'Ventajas de la SAS' },
      {
        type: 'list',
        items: [
          'Constitución ágil y digital; menores costos de mantenimiento.',
          'Acciones transferibles de forma privada; permite 1 socio.',
          'Mandatos y administración más flexibles.',
        ],
      },
      { type: 'h2', text: 'Ventajas de la SRL' },
      {
        type: 'list',
        items: [
          'Figura muy conocida por bancos y proveedores tradicionales.',
          'Cuotas sociales (no acciones) que pueden dar más control entre pocos socios.',
        ],
      },
      { type: 'h2', text: 'Costos y tiempos' },
      {
        type: 'p',
        text: 'La SAS suele ser más rápida y económica en la mayoría de jurisdicciones (Córdoba y CABA especialmente). La SRL puede demorar más y requerir pasos presenciales, aunque varía según el registro local.',
      },
      { type: 'h2', text: '¿Cuál elegir?' },
      {
        type: 'p',
        text: 'Si buscás velocidad, bajo costo inicial y operar 100% online, la SAS es el camino. Si preferís una estructura tradicional con 2 o más socios y no te apura el tiempo, la SRL sigue siendo válida. Para startups y pymes en fase inicial, la SAS ofrece la mejor relación velocidad/costo/flexibilidad.',
      },
    ],
  },
]

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = posts.find((p) => p.slug === params.slug)

  if (!post) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 max-w-5xl">
        {/* Breadcrumbs */}
        <div className="text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:text-red-700">Inicio</Link>
          <span className="mx-2">/</span>
          <Link href="/blog" className="hover:text-red-700">Blog</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">{post.category}</span>
        </div>

        {/* Header */}
        <header className="space-y-3 mb-8">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold text-red-700 bg-red-100 px-3 py-1.5 rounded-full border border-red-200">
              {post.category}
            </span>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{post.date}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{post.lectura}</span>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
            {post.title}
          </h1>
          <p className="text-lg text-gray-700 max-w-3xl">
            {post.summary}
          </p>
        </header>

        {/* Hero image */}
        <div className="relative w-full h-72 md:h-96 rounded-2xl overflow-hidden mb-10 border border-gray-200">
          <Image
            src={post.hero}
            alt={post.alt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 900px"
            priority
          />
        </div>

        {/* Content */}
        <article className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-800 prose-li:text-gray-800 prose-strong:text-gray-900">
          {post.sections.map((section, idx) => {
            if (section.type === 'h2') {
              return <h2 key={idx}>{section.text}</h2>
            }
            if (section.type === 'p') {
              return <p key={idx}>{section.text}</p>
            }
            if (section.type === 'list') {
              return (
                <ul key={idx}>
                  {section.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )
            }
            if (section.type === 'quote') {
              return <blockquote key={idx}>{section.text}</blockquote>
            }
            return null
          })}
        </article>

        {/* Tags */}
        <section className="mt-12">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
            <Tag className="w-4 h-4" />
            <span>Etiquetas</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm border border-gray-200"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

