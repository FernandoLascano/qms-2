/**
 * Copia carpetas (prefijos) desde el bucket privado al público en Supabase Storage.
 *
 * Uso (desde la raíz del repo, con .env cargado):
 *   node --env-file=.env scripts/move-storage-prefixes.mjs blog partners
 *
 * Dry-run (no sube ni borra):
 *   node --env-file=.env scripts/move-storage-prefixes.mjs --dry-run blog partners
 *
 * Tras copiar, borrar en origen:
 *   node --env-file=.env scripts/move-storage-prefixes.mjs --delete-source blog partners
 *
 * Variables: SUPABASE_URL, SUPABASE_SERVICE_KEY
 * Opcionales: SUPABASE_STORAGE_BUCKET_DOCUMENTS (default documentos), SUPABASE_STORAGE_BUCKET_PUBLIC (default assets-publicos)
 */

import { createClient } from '@supabase/supabase-js'

const SRC =
  process.env.SUPABASE_STORAGE_BUCKET_DOCUMENTS || process.env.SRC_BUCKET || 'documentos'
const DST =
  process.env.SUPABASE_STORAGE_BUCKET_PUBLIC || process.env.DST_BUCKET || 'assets-publicos'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const deleteSource = args.includes('--delete-source')
const prefixes = args.filter((a) => !a.startsWith('--'))

if (prefixes.length === 0) {
  console.error(
    'Uso: node --env-file=.env scripts/move-storage-prefixes.mjs [--dry-run] [--delete-source] <carpeta1> [carpeta2 ...]\n' +
      'Ejemplo: node --env-file=.env scripts/move-storage-prefixes.mjs blog partners'
  )
  process.exit(1)
}

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_KEY
if (!url || !key) {
  console.error('Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY en el entorno (.env)')
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

/** Lista recursiva de paths de archivo relativos al bucket (sin slash inicial). */
async function listFilesRecursive(bucket, dir = '') {
  const out = []
  const { data, error } = await supabase.storage.from(bucket).list(dir, { limit: 1000 })
  if (error) throw error
  for (const item of data || []) {
    if (item.name === '.emptyFolderPlaceholder') continue
    const rel = dir ? `${dir}/${item.name}` : item.name
    if (item.id) {
      out.push(rel)
    } else {
      const sub = await listFilesRecursive(bucket, rel)
      out.push(...sub)
    }
  }
  return out
}

async function copyOne(srcPath, dstPath) {
  if (dryRun) {
    console.log(`[dry-run] ${SRC}/${srcPath} -> ${DST}/${dstPath}`)
    return true
  }
  const { data: blob, error: dlErr } = await supabase.storage.from(SRC).download(srcPath)
  if (dlErr || !blob) {
    console.error(`Descarga falló ${srcPath}:`, dlErr?.message)
    return false
  }
  const buf = Buffer.from(await blob.arrayBuffer())
  const { error: upErr } = await supabase.storage.from(DST).upload(dstPath, buf, {
    contentType: blob.type || 'application/octet-stream',
    upsert: true,
  })
  if (upErr) {
    console.error(`Subida falló ${dstPath}:`, upErr.message)
    return false
  }
  if (deleteSource) {
    const { error: rmErr } = await supabase.storage.from(SRC).remove([srcPath])
    if (rmErr) console.error(`Borrado origen falló ${srcPath}:`, rmErr.message)
  }
  console.log(`OK ${srcPath} -> ${dstPath}`)
  return true
}

async function main() {
  console.log(`Origen: ${SRC}  Destino: ${DST}  dryRun=${dryRun} deleteSource=${deleteSource}`)
  let ok = 0
  let fail = 0

  for (const prefix of prefixes) {
    const base = prefix.replace(/^\/+|\/+$/g, '')
    const files = await listFilesRecursive(SRC, base)
    console.log(`\nPrefijo "${base}": ${files.length} archivos`)
    for (const srcPath of files) {
      const dstPath = srcPath
      const success = await copyOne(srcPath, dstPath)
      if (success) ok++
      else fail++
    }
  }

  console.log(`\nResumen: ${ok} ok, ${fail} fallidos`)
  if (dryRun) console.log('Dry-run: no se escribió nada. Quitá --dry-run para ejecutar.')
  if (!deleteSource && !dryRun && ok > 0)
    console.log('Origen no borrado. Pasá --delete-source si querés liberar el bucket viejo (después de verificar URLs en BD).')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
