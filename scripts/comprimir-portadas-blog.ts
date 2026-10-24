/**
 * Una sola vez (24/10/2026): pasa las portadas del blog ya subidas (PNG de
 * ~2 MB) por optimizarPortada, sube la versión liviana y apunta el post a ella.
 * Las originales quedan en el bucket (no se borran).
 *
 *   node --env-file=.env.local node_modules/.bin/jiti scripts/comprimir-portadas-blog.ts [--aplicar]
 */
import { prisma } from '../lib/prisma'
import { optimizarPortada } from '../lib/imagenes'
import { uploadToSupabase } from '../lib/supabase-storage'

const aplicar = process.argv.includes('--aplicar')

async function main() {
  const posts = await prisma.post.findMany({ where: { imagenHero: { not: null } }, select: { id: true, slug: true, imagenHero: true } })
  for (const post of posts) {
    const url = post.imagenHero!
    if (/\.jpe?g$/i.test(url)) continue
    const res = await fetch(url)
    if (!res.ok) { console.log('✗', post.slug, res.status); continue }
    const original = Buffer.from(await res.arrayBuffer())
    const nombre = decodeURIComponent(url.split('/').pop()!).replace(/^\d+-/, '')
    const portada = await optimizarPortada(original, nombre, res.headers.get('content-type') ?? 'image/png')
    console.log(post.slug, `${(original.length / 1e6).toFixed(2)} MB → ${(portada.buffer.length / 1e3).toFixed(0)} KB`)
    if (!aplicar) continue
    const subida = await uploadToSupabase(portada.buffer, 'blog/hero', portada.nombre, portada.tipo, 'public')
    if (!subida?.url) { console.log('  ✗ no se pudo subir'); continue }
    await prisma.post.update({ where: { id: post.id }, data: { imagenHero: subida.url } })
    console.log('  ✓', subida.url)
  }
}

main().finally(() => prisma.$disconnect())
