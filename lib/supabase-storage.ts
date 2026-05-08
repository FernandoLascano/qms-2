import { createClient, SupabaseClient } from '@supabase/supabase-js'

const getProjectId = () => {
  const dbUrl = process.env.DATABASE_URL || ''
  const match = dbUrl.match(/db\.([^.]+)\.supabase\.co/)
  return match ? match[1] : ''
}

let supabaseClient: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL || `https://${getProjectId()}.supabase.co`
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''

    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_KEY no está configurado')
    }

    supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return supabaseClient
}

/** Documentos de clientes y comprobantes (privado; acceso vía URL firmada). */
export const DOCUMENTS_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET_DOCUMENTS || 'documentos'

/** Logos de partners, hero del blog, assets de marketing (público). */
export const PUBLIC_ASSETS_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET_PUBLIC || 'assets-publicos'

export type UploadVisibility = 'public' | 'private'

async function ensureBucket(bucketName: string, isPublic: boolean): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      return false
    }

    const bucketExists = buckets?.some((b) => b.name === bucketName)

    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: isPublic,
        fileSizeLimit: 52428800,
      })

      if (createError) {
        return false
      }
    }

    return true
  } catch {
    return false
  }
}

/**
 * Sube un archivo.
 * - `private`: bucket documentos; devuelve `url` = path del objeto (para guardar en BD y firmar al ver).
 * - `public`: bucket assets públicos; devuelve URL pública completa.
 */
export async function uploadToSupabase(
  buffer: Buffer,
  folder: string,
  fileName: string,
  mimeType: string,
  visibility: UploadVisibility = 'private'
): Promise<{ url: string; path: string } | null> {
  try {
    const supabase = getSupabaseClient()
    const bucket = visibility === 'public' ? PUBLIC_ASSETS_BUCKET : DOCUMENTS_BUCKET
    const isPublic = visibility === 'public'

    await ensureBucket(bucket, isPublic)

    const cleanFileName = fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\.+/g, '.')

    const timestamp = Date.now()
    const filePath = `${folder}/${timestamp}-${cleanFileName}`

    const { error } = await supabase.storage.from(bucket).upload(filePath, buffer, {
      contentType: mimeType,
      upsert: false,
    })

    if (error) {
      return null
    }

    if (isPublic) {
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filePath)
      return {
        url: publicUrl,
        path: filePath,
      }
    }

    return {
      url: filePath,
      path: filePath,
    }
  } catch {
    return null
  }
}

export async function deleteFromSupabase(
  path: string,
  bucket: string = DOCUMENTS_BUCKET
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase.storage.from(bucket).remove([path])

    if (error) {
      return false
    }

    return true
  } catch {
    return false
  }
}

export async function getSignedUrlSupabase(
  path: string,
  expiresIn: number = 3600,
  bucket: string = DOCUMENTS_BUCKET
): Promise<string | null> {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn)

    if (error) {
      return null
    }

    return data.signedUrl
  } catch {
    return null
  }
}

/** Path del objeto dentro del bucket `documentos` a partir de una URL pública legacy o path guardado. */
export function extractDocumentsObjectPath(stored: string): { bucket: string; path: string } | null {
  if (!stored) return null
  if (stored.includes('supabase.co/storage')) {
    const m = stored.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/)
    if (!m) return null
    const bucketName = m[1]
    const objectPath = decodeURIComponent(m[2].replace(/\+/g, ' '))
    return { bucket: bucketName, path: objectPath }
  }
  if (!stored.startsWith('http')) {
    return { bucket: DOCUMENTS_BUCKET, path: stored }
  }
  return null
}
