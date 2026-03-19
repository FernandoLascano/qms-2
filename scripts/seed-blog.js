const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const posts = [
  {
    titulo: 'Guía Completa: Cómo Constituir una SAS en Argentina (2026)',
    slug: 'como-constituir-sas-argentina-guia-completa',
    descripcion: 'Todo lo que necesitás saber para crear tu Sociedad por Acciones Simplificada en Argentina. Requisitos, costos, plazos y paso a paso del proceso de constitución.',
    categoria: 'Guías',
    tags: ['SAS', 'constituir empresa', 'Argentina', 'guía', 'requisitos'],
    autor: 'Equipo QuieroMiSAS',
    lectura: '12 min',
    metaTitle: 'Cómo Constituir una SAS en Argentina 2026 | Guía Completa Paso a Paso',
    metaDescription: 'Guía completa para constituir una SAS en Argentina. Requisitos, costos actualizados 2026, plazos y proceso paso a paso. Todo 100% online.',
    keywords: ['constituir SAS', 'crear SAS Argentina', 'requisitos SAS', 'SAS paso a paso', 'empresa Argentina 2026'],
    publicado: true,
    destacado: true,
    contenido: {
      sections: [
        { type: 'h2', content: '¿Qué es una SAS y por qué elegirla?' },
        { type: 'p', content: 'La Sociedad por Acciones Simplificada (SAS) es el tipo societario más moderno de Argentina, creado por la Ley 27.349 de Apoyo al Capital Emprendedor. Desde su implementación, se ha convertido en la opción preferida por emprendedores y startups por su simplicidad, rapidez y bajo costo.' },
        { type: 'p', content: 'A diferencia de las S.R.L. y S.A. tradicionales, la SAS puede constituirse con un solo socio, de forma 100% digital, y en un plazo promedio de 5 días hábiles. No requiere escritura pública ni intervención de escribano.' },
        { type: 'h2', content: 'Requisitos para constituir una SAS' },
        { type: 'p', content: 'Los requisitos son simples y accesibles para cualquier persona mayor de 18 años:' },
        { type: 'list', items: ['DNI argentino o extranjero válido', 'CUIT o CUIL de cada socio/accionista', 'Firma digital (se tramita gratuitamente)', 'Capital mínimo: 2 veces el Salario Mínimo Vital y Móvil (solo se integra el 25% al inicio)', 'Denominación social (nombre de la empresa)', 'Objeto social (actividad de la empresa)', 'Domicilio legal en la jurisdicción elegida'] },
        { type: 'h2', content: '¿Cuánto cuesta constituir una SAS en 2026?' },
        { type: 'p', content: 'El costo total se compone de honorarios profesionales y gastos de jurisdicción (tasas gubernamentales):' },
        { type: 'list', items: ['Honorarios profesionales: desde $285.000 hasta $390.000 según el plan elegido', 'Gastos de jurisdicción en Córdoba (IPJ): tasas de constitución, reserva de nombre, publicación en boletín oficial', 'Gastos de jurisdicción en CABA (IGJ): tasas similares con valores propios', 'El capital mínimo a depositar es el 25% de 2 SMVM (actualizable)'] },
        { type: 'p', content: 'Comparado con una S.R.L. (que puede costar el doble o más) o una S.A. (que requiere mayor capital y trámites), la SAS es la opción más económica para constituir una empresa en Argentina.' },
        { type: 'h2', content: 'Proceso paso a paso' },
        { type: 'list', items: ['Paso 1: Completar el formulario online con los datos de la sociedad, socios y administradores', 'Paso 2: Subir la documentación requerida (DNI, CUIT de cada socio)', 'Paso 3: Abonar honorarios y tasas de forma segura online', 'Paso 4: Nuestro equipo legal gestiona todo ante IPJ (Córdoba) o IGJ (CABA)', 'Paso 5: En 5 días hábiles recibís tu SAS inscripta con CUIT y matrícula'] },
        { type: 'h2', content: '¿Dónde se puede constituir?' },
        { type: 'p', content: 'Actualmente en QuieroMiSAS operamos en dos jurisdicciones: Córdoba (inscripción ante la Inspección de Personas Jurídicas - IPJ) y Ciudad Autónoma de Buenos Aires (inscripción ante la Inspección General de Justicia - IGJ). Tu sociedad será válida en todo el territorio argentino independientemente de dónde la inscribas.' },
        { type: 'h2', content: '¿Qué recibís al finalizar?' },
        { type: 'list', items: ['Estatuto social inscripto', 'Número de CUIT de la sociedad', 'Matrícula de la sociedad', 'Guía para habilitación de libros digitales (según plan)', 'Alta para facturación electrónica (según plan)'] },
        { type: 'quote', content: 'Con QuieroMiSAS, más de 500 emprendedores ya constituyeron su empresa de forma rápida, segura y 100% online. ¿Estás listo para dar el siguiente paso?' }
      ]
    }
  },
  {
    titulo: 'SAS vs SRL vs SA: ¿Cuál Conviene para tu Empresa?',
    slug: 'sas-vs-srl-vs-sa-comparativa-completa',
    descripcion: 'Comparativa detallada entre los tres tipos societarios más comunes en Argentina. Ventajas, desventajas, costos y para quién conviene cada uno.',
    categoria: 'Comparativas',
    tags: ['SAS', 'SRL', 'SA', 'comparativa', 'tipos societarios'],
    autor: 'Equipo QuieroMiSAS',
    lectura: '8 min',
    metaTitle: 'SAS vs SRL vs SA: Diferencias y Cuál Conviene en Argentina 2026',
    metaDescription: 'Comparativa completa entre SAS, SRL y SA en Argentina. Costos, plazos, requisitos y ventajas de cada tipo societario. Descubrí cuál te conviene.',
    keywords: ['SAS vs SRL', 'SAS vs SA', 'diferencias SAS SRL', 'tipos de sociedad Argentina', 'comparativa sociedades'],
    publicado: true,
    destacado: true,
    contenido: {
      sections: [
        { type: 'h2', content: 'Los tres tipos societarios más usados en Argentina' },
        { type: 'p', content: 'Cuando decidís crear una empresa en Argentina, las tres opciones principales son la Sociedad por Acciones Simplificada (SAS), la Sociedad de Responsabilidad Limitada (SRL) y la Sociedad Anónima (SA). Cada una tiene sus particularidades y conviene para situaciones diferentes.' },
        { type: 'h2', content: 'Cantidad mínima de socios' },
        { type: 'list', items: ['SAS: 1 socio (puede ser unipersonal)', 'SRL: 2 socios mínimo', 'SA: 2 accionistas mínimo'] },
        { type: 'p', content: 'Si sos emprendedor individual, la SAS es tu única opción para tener una sociedad con responsabilidad limitada sin necesitar un segundo socio.' },
        { type: 'h2', content: 'Tiempo de constitución' },
        { type: 'list', items: ['SAS: 5 días hábiles promedio', 'SRL: 30 a 90 días', 'SA: 60 a 120 días o más'] },
        { type: 'p', content: 'La diferencia es abismal. Mientras que con una SAS podés estar operando en una semana, una SRL o SA puede demorar meses.' },
        { type: 'h2', content: 'Costo de constitución' },
        { type: 'list', items: ['SAS: Desde $285.000 + gastos de jurisdicción', 'SRL: Desde $500.000 + gastos notariales + publicaciones', 'SA: Desde $800.000 + gastos notariales + publicaciones + capital mínimo mayor'] },
        { type: 'p', content: 'La SAS es hasta un 50-60% más económica que una SRL, y aún más barata que una SA. Esto se debe a que no requiere escritura pública ni intervención de escribano.' },
        { type: 'h2', content: 'Proceso digital' },
        { type: 'list', items: ['SAS: 100% digital, con firma digital', 'SRL: Requiere trámites presenciales y escribano', 'SA: Requiere trámites presenciales, escribano y publicaciones'] },
        { type: 'h2', content: 'Capital mínimo' },
        { type: 'list', items: ['SAS: 2 veces el SMVM (se integra solo el 25% al inicio)', 'SRL: No tiene mínimo legal, pero en la práctica se exige un monto razonable', 'SA: $100.000 (capital estatutario fijo, desactualizado)'] },
        { type: 'h2', content: '¿Cuál te conviene?' },
        { type: 'list', items: ['Emprendedores y startups: SAS (rápida, económica, flexible)', 'Empresas familiares con estructura simple: SRL (más tradicional, 2+ socios)', 'Grandes empresas o que necesitan cotizar en bolsa: SA (estructura corporativa completa)'] },
        { type: 'quote', content: 'En el 90% de los casos, la SAS es la mejor opción para quien arranca un nuevo emprendimiento o negocio en Argentina. Es más rápida, más barata y más flexible que las alternativas tradicionales.' }
      ]
    }
  },
  {
    titulo: 'Costos de Constituir una Empresa en Argentina (Actualizado 2026)',
    slug: 'costos-constituir-empresa-argentina-2026',
    descripcion: 'Desglose completo y actualizado de todos los costos para crear una SAS, SRL o SA en Argentina en 2026. Honorarios, tasas gubernamentales y gastos adicionales.',
    categoria: 'Costos',
    tags: ['costos', 'precios', 'constituir empresa', 'SAS', 'Argentina 2026'],
    autor: 'Equipo QuieroMiSAS',
    lectura: '7 min',
    metaTitle: 'Cuánto Cuesta Constituir una Empresa en Argentina 2026 | Precios Actualizados',
    metaDescription: 'Costos actualizados 2026 para constituir SAS, SRL y SA en Argentina. Desglose de honorarios, tasas y gastos. Desde $285.000 con QuieroMiSAS.',
    keywords: ['cuánto cuesta constituir SAS', 'costos empresa Argentina', 'precios SAS 2026', 'gastos constitución sociedad', 'capital mínimo SAS'],
    publicado: true,
    destacado: false,
    contenido: {
      sections: [
        { type: 'h2', content: '¿Cuánto cuesta crear una empresa en Argentina?' },
        { type: 'p', content: 'El costo de constituir una empresa en Argentina varía según el tipo societario que elijas (SAS, SRL o SA), la jurisdicción donde la inscribas, y el nivel de servicio profesional que contrates. En esta guía te detallamos todos los costos actualizados a 2026.' },
        { type: 'h2', content: 'Costos de constituir una SAS' },
        { type: 'p', content: 'La SAS es la opción más económica. Los costos se dividen en honorarios profesionales y gastos de jurisdicción:' },
        { type: 'h2', content: 'Honorarios profesionales (QuieroMiSAS)' },
        { type: 'list', items: ['Plan Básico: $285.000 - Incluye constitución, CUIT y guía de libros digitales', 'Plan Emprendedor: $320.000 - Todo lo anterior + alta para facturar (el más contratado)', 'Plan Premium: $390.000 - Todo lo anterior + inscripción de libros digitales + reuniones de asesoría mensuales'] },
        { type: 'h2', content: 'Gastos de jurisdicción (tasas gubernamentales)' },
        { type: 'p', content: 'Estos gastos son obligatorios y se pagan directamente a los organismos gubernamentales. Varían según la jurisdicción:' },
        { type: 'list', items: ['Córdoba (IPJ): Tasa de constitución + reserva de nombre + depósito de capital (25% de 2 SMVM) + publicación en boletín oficial + certificación de firmas', 'CABA (IGJ): Tasa de constitución + reserva de nombre + depósito de capital + publicación + tasa de actuación'] },
        { type: 'h2', content: 'Capital mínimo requerido' },
        { type: 'p', content: 'El capital social mínimo de una SAS es equivalente a 2 veces el Salario Mínimo Vital y Móvil (SMVM) vigente. Solo se necesita integrar (depositar) el 25% al momento de la constitución. El 75% restante se puede integrar en los 2 años siguientes.' },
        { type: 'h2', content: 'Comparación de costos por tipo societario' },
        { type: 'list', items: ['SAS: Desde $285.000 + gastos (~$50.000-80.000) = Total aprox. $335.000-470.000', 'SRL: Desde $500.000 + escribano (~$150.000) + gastos = Total aprox. $700.000-900.000', 'SA: Desde $800.000 + escribano + gastos = Total aprox. $1.000.000+'] },
        { type: 'h2', content: '¿Qué incluye el servicio de QuieroMiSAS?' },
        { type: 'list', items: ['Asesoramiento legal completo durante todo el proceso', 'Redacción del estatuto social adaptado a tu actividad', 'Gestión de reserva de denominación social', 'Trámite de constitución ante IPJ o IGJ', 'Obtención de CUIT de la sociedad', 'Matrícula de la sociedad', 'Panel online con seguimiento en tiempo real', 'Soporte 24/7 vía chat y email'] },
        { type: 'quote', content: 'La SAS es hasta un 60% más económica que una SRL y puede constituirse en 5 días vs los 30-90 días de una SRL. Es la opción más inteligente para emprendedores en Argentina.' }
      ]
    }
  }
];

async function seed() {
  for (const post of posts) {
    const existing = await prisma.post.findUnique({ where: { slug: post.slug } });
    if (!existing) {
      await prisma.post.create({ data: post });
      console.log('Creado:', post.slug);
    } else {
      console.log('Ya existe:', post.slug);
    }
  }
  await prisma.$disconnect();
  console.log('Done!');
}

seed().catch(e => { console.error(e); process.exit(1); });
