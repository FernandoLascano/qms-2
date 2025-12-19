import { prisma } from '../lib/prisma'

async function checkPosts() {
  try {
    console.log('🔍 Verificando posts en la base de datos...\n')

    const allPosts = await prisma.post.findMany()
    console.log(`📊 Total de posts: ${allPosts.length}\n`)

    if (allPosts.length > 0) {
      console.log('📝 Posts encontrados:')
      allPosts.forEach(post => {
        console.log(`\n- ID: ${post.id}`)
        console.log(`  Título: ${post.titulo}`)
        console.log(`  Slug: ${post.slug}`)
        console.log(`  Publicado: ${post.publicado ? '✅ Sí' : '❌ No'}`)
        console.log(`  Destacado: ${post.destacado ? '⭐ Sí' : '- No'}`)
        console.log(`  Categoría: ${post.categoria}`)
      })
    } else {
      console.log('❌ No se encontraron posts en la base de datos')
    }

    console.log('\n🔍 Verificando posts públicos y destacados...')
    const publicPosts = await prisma.post.findMany({
      where: {
        publicado: true,
        destacado: true
      }
    })
    console.log(`\n📊 Posts públicos y destacados: ${publicPosts.length}`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkPosts()
