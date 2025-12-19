import { prisma } from '../lib/prisma'

async function seedPost1() {
  try {
    const post = await prisma.post.create({
      data: {
        titulo: 'La importancia de contar con una Sociedad para emprender en Argentina',
        slug: 'importancia-sociedad-emprender-argentina',
        descripcion: 'Descubrí por qué contar con una Sociedad es fundamental para proteger tu patrimonio, emitir facturas y hacer crecer tu negocio de manera profesional en Argentina.',
        categoria: 'Sociedades',
        tags: [
          'Sociedades',
          'Emprendimientos',
          'Argentina',
          'Constituir una Sociedad',
          'Emprendimiento en Argentina'
        ],
        autor: 'QMS - Quiero Mi SAS',
        lectura: '3 min',
        imagenHero: '/assets/img/nota.png',
        imagenAlt: 'La importancia de contar con una Sociedad',

        // SEO
        metaTitle: 'La importancia de contar con una Sociedad para emprender en Argentina | QuieroMiSAS',
        metaDescription: 'Descubrí por qué contar con una Sociedad es fundamental para proteger tu patrimonio, emitir facturas y hacer crecer tu negocio de manera profesional.',
        keywords: [
          'sociedad argentina',
          'emprender argentina',
          'constituir sociedad',
          'SAS argentina',
          'protección patrimonial',
          'crear empresa argentina'
        ],

        // Contenido estructurado
        contenido: {
          sections: [
            {
              type: 'h2',
              content: '¿Qué es una Sociedad y por qué debería interesarte?'
            },
            {
              type: 'p',
              content: 'Una Sociedad es una figura jurídica que permite separar tu patrimonio personal del patrimonio del negocio. Esto significa que, ante deudas, reclamos o contingencias, tus bienes personales (como tu casa, vehículo o ahorros) no quedan automáticamente comprometidos.'
            },
            {
              type: 'p',
              content: 'Además, tener una Sociedad te permite:'
            },
            {
              type: 'list',
              items: [
                '✅ Emitir facturas a tus clientes',
                '👥 Contratar empleados bajo relación laboral formal',
                '🏦 Abrir cuentas bancarias comerciales a nombre de la empresa',
                '💰 Solicitar financiamiento o reinvertir utilidades',
                '📑 Participar en licitaciones públicas o firmar contratos con grandes compañías'
              ]
            },
            {
              type: 'h2',
              content: '¿Qué riesgos asumís si no formalizás tu actividad?'
            },
            {
              type: 'p',
              content: 'Trabajar de manera informal puede parecer más sencillo al principio, pero a largo plazo genera muchos problemas:'
            },
            {
              type: 'list',
              items: [
                '⚠️ Responsabilidad patrimonial ilimitada: si algo sale mal, respondés con todos tus bienes personales',
                '❌ Falta de credibilidad: muchos clientes, entidades financieras e inversores desconfían de negocios informales',
                '💸 Riesgos fiscales y sanciones: no contar con una estructura legal te expone a multas, clausuras o inspecciones de ARCA y otros entes',
                '📉 Limitaciones de crecimiento: sin personería jurídica es casi imposible atraer inversión o profesionalizar tu proyecto'
              ]
            },
            {
              type: 'h2',
              content: '¿Qué tipo de Sociedad te conviene para empezar?'
            },
            {
              type: 'p',
              content: 'En Argentina, la Sociedad por Acciones Simplificada (SAS) es una de las opciones más elegidas por emprendedores. ¿Por qué? Porque es ágil, accesible y puede constituirse 100% online.'
            },
            {
              type: 'p',
              content: 'Con una SAS podés iniciar solo o con socios, establecer reglas internas adaptadas a tu negocio, y operar con un bajo costo de mantenimiento.'
            },
            {
              type: 'p',
              content: 'También existen otras figuras, como la Sociedad de Responsabilidad Limitada (SRL) o la Sociedad Anónima (SA), que puede ser más adecuada para emprendimientos de mayor escala o con múltiples inversores.'
            },
            {
              type: 'h2',
              content: '¿Cómo constituir una Sociedad de forma sencilla?'
            },
            {
              type: 'p',
              content: 'En QuieroMiSAS te acompañamos en todo el proceso de constitución de tu sociedad, para que puedas enfocarte en lo que realmente importa: hacer crecer tu negocio.'
            },
            {
              type: 'p',
              content: 'Nuestro equipo de profesionales se encarga de todas las gestiones legales y administrativas: reserva de nombre, redacción del estatuto, inscripción ante el Registro, tramitación de CUIT y más.'
            },
            {
              type: 'p',
              content: 'Constituimos tu empresa de manera ágil, segura y 100% online, para que cuentes con respaldo legal desde el primer día.'
            }
          ]
        },

        publicado: true,
        destacado: true,
        fechaPublicacion: new Date()
      }
    })

    console.log('✅ Post creado exitosamente:', post.titulo)
    console.log('📝 Slug:', post.slug)
    console.log('🆔 ID:', post.id)
  } catch (error) {
    console.error('❌ Error al crear post:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedPost1()
