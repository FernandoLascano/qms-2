/**
 * Respaldo diario a S3 (lo corre .github/workflows/backup.yml).
 *
 * 1. Sube el dump de la base (ya generado por pg_dump) a db/AAAA-MM-DD.dump.
 *    La lifecycle rule del bucket lo borra a los 30 días.
 * 2. Espeja Supabase Storage en storage/<bucket>/<ruta>, de forma incremental:
 *    sube sólo lo que todavía no está en S3. Nunca borra, así que un archivo
 *    eliminado en la app sigue estando en el backup.
 * 3. Anota la corrida en maintenance_runs (kind 'backup'), que además cuenta
 *    como actividad para que Supabase no pause la base.
 *
 * Corre fuera del proyecto, en una carpeta temporal con sólo
 * @supabase/supabase-js y @aws-sdk/client-s3 instalados.
 */
import { createReadStream, statSync, writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'

const env = (name) => {
  const v = process.env[name]
  if (!v) throw new Error(`Falta la variable ${name}`)
  return v
}

// Si el script llega a anotar la corrida, el paso `if: failure()` del workflow
// no vuelve a anotarla.
const MARCA_ANOTADO = '.anotado'

const supabase = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_KEY'), {
  auth: { autoRefreshToken: false, persistSession: false },
})

const s3 = new S3Client({
  region: process.env.BACKUP_AWS_REGION || 'sa-east-1',
  credentials: {
    accessKeyId: env('BACKUP_AWS_ACCESS_KEY_ID'),
    secretAccessKey: env('BACKUP_AWS_SECRET_ACCESS_KEY'),
  },
})
const BUCKET = env('BACKUP_BUCKET')

async function existeEnS3(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))
    return true
  } catch (e) {
    if (e?.$metadata?.httpStatusCode === 404) return false
    throw e
  }
}

async function subirDump() {
  const ruta = env('DUMP_PATH')
  const bytes = statSync(ruta).size
  if (bytes === 0) throw new Error('El dump está vacío')
  const fecha = new Date().toISOString().slice(0, 10)
  const key = `db/${fecha}.dump`
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: createReadStream(ruta),
      ContentLength: bytes,
      ContentType: 'application/octet-stream',
    }),
  )
  console.log(`Dump subido: ${key} (${(bytes / 1024 / 1024).toFixed(1)} MB)`)
  return { key, bytes }
}

/**
 * Lista todos los archivos de un bucket. list() devuelve un nivel por vez y
 * las carpetas vienen sin `id`, así que hay que bajar en ellas recursivamente.
 */
async function listarArchivos(bucket, prefijo = '') {
  const archivos = []
  const LIMITE = 1000
  for (let offset = 0; ; offset += LIMITE) {
    const { data, error } = await supabase.storage.from(bucket).list(prefijo, {
      limit: LIMITE,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    })
    if (error) throw new Error(`No se pudo listar ${bucket}/${prefijo}: ${error.message}`)
    for (const item of data) {
      const ruta = prefijo ? `${prefijo}/${item.name}` : item.name
      if (item.id === null) archivos.push(...(await listarArchivos(bucket, ruta)))
      else archivos.push({ ruta, tipo: item.metadata?.mimetype })
    }
    if (data.length < LIMITE) break
  }
  return archivos
}

async function espejarStorage() {
  const { data: buckets, error } = await supabase.storage.listBuckets()
  if (error) throw new Error(`No se pudieron listar los buckets: ${error.message}`)

  let total = 0
  let nuevos = 0
  let bytesNuevos = 0
  for (const { name: bucket } of buckets) {
    const archivos = await listarArchivos(bucket)
    total += archivos.length
    for (const { ruta, tipo } of archivos) {
      const key = `storage/${bucket}/${ruta}`
      if (await existeEnS3(key)) continue
      const { data: blob, error: errDescarga } = await supabase.storage.from(bucket).download(ruta)
      if (errDescarga) throw new Error(`No se pudo bajar ${bucket}/${ruta}: ${errDescarga.message}`)
      const cuerpo = Buffer.from(await blob.arrayBuffer())
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: cuerpo,
          ContentType: tipo || blob.type || 'application/octet-stream',
        }),
      )
      nuevos++
      bytesNuevos += cuerpo.length
    }
    console.log(`Bucket ${bucket}: ${archivos.length} archivos`)
  }
  console.log(`Storage: ${total} archivos, ${nuevos} nuevos subidos`)
  return { buckets: buckets.length, total, nuevos, bytesNuevos }
}

async function anotar(ok, detail) {
  const { error } = await supabase.from('maintenance_runs').insert({ kind: 'backup', ok, detail })
  if (error) throw new Error(`No se pudo anotar la corrida: ${error.message}`)
  writeFileSync(MARCA_ANOTADO, '')
}

const run = process.env.RUN_URL || null
try {
  const dump = await subirDump()
  const storage = await espejarStorage()
  await anotar(true, {
    dump_key: dump.key,
    dump_bytes: dump.bytes,
    storage_buckets: storage.buckets,
    storage_total: storage.total,
    storage_nuevos: storage.nuevos,
    storage_bytes_nuevos: storage.bytesNuevos,
    run,
  })
  console.log('Respaldo completo')
} catch (e) {
  const mensaje = e instanceof Error ? e.message : String(e)
  console.error(`Respaldo fallido: ${mensaje}`)
  try {
    await anotar(false, { error: mensaje, run })
  } catch (e2) {
    console.error(e2 instanceof Error ? e2.message : e2)
  }
  process.exit(1)
}
