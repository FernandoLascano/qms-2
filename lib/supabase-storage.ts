import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Extraer el project ID de la URL de la base de datos
const getProjectId = () => {
  const dbUrl = process.env.DATABASE_URL || ''
  const match = dbUrl.match(/db\.([^.]+)\.supabase\.co/)
  return match ? match[1] : ''
}

// Lazy initialization para evitar errores en build
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
        persistSession: false
      }
    })
  }
  return supabaseClient
}

// Nombre del bucket para documentos
const BUCKET_NAME = 'documentos'

// Función para asegurar que el bucket existe
async function ensureBucketExists() {
  try {
    const supabase = getSupabaseClient()
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      return false
    }

    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME)

    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 52428800 // 50MB
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

// Función principal para subir archivos a Supabase Storage
export async function uploadToSupabase(
  buffer: Buffer,
  folder: string,
  fileName: string,
  mimeType: string
): Promise<{ url: string; path: string } | null> {
  try {
    const supabase = getSupabaseClient()

    // Asegurar que el bucket existe
    await ensureBucketExists()

    // Limpiar el nombre del archivo
    const cleanFileName = fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\.+/g, '.')

    // Generar path único
    const timestamp = Date.now()
    const filePath = `${folder}/${timestamp}-${cleanFileName}`

    // Subir el archivo
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: false
      })

    if (error) {
      return null
    }

    // Obtener la URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    return {
      url: publicUrl,
      path: filePath
    }
  } catch {
    return null
  }
}

// Función para eliminar un archivo
export async function deleteFromSupabase(path: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path])

    if (error) {
      return false
    }

    return true
  } catch {
    return false
  }
}

// Función para obtener URL firmada (para archivos privados si fuera necesario)
export async function getSignedUrlSupabase(path: string, expiresIn: number = 3600): Promise<string | null> {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, expiresIn)

    if (error) {
      return null
    }

    return data.signedUrl
  } catch {
    return null
  }
}
