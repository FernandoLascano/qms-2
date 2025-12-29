import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Extraer el project ID de la URL de la base de datos
// DATABASE_URL: postgresql://postgres:xxx@db.PROJECT_ID.supabase.co:5432/postgres
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
      throw new Error('SUPABASE_SERVICE_KEY no está configurado. Obtenerlo de: https://supabase.com/dashboard/project/' + getProjectId() + '/settings/api')
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
      console.error('Error listando buckets:', listError)
      return false
    }

    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME)

    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true, // Archivos públicos para poder visualizarlos
        fileSizeLimit: 52428800 // 50MB
      })

      if (createError) {
        console.error('Error creando bucket:', createError)
        return false
      }
      console.log(`Bucket "${BUCKET_NAME}" creado exitosamente`)
    }

    return true
  } catch (error) {
    console.error('Error en ensureBucketExists:', error)
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
      .replace(/\.+/g, '.') // Evitar múltiples puntos consecutivos

    // Generar path único
    const timestamp = Date.now()
    const filePath = `${folder}/${timestamp}-${cleanFileName}`

    console.log(`📤 Subiendo archivo a Supabase: ${filePath}`)

    // Subir el archivo
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: false
      })

    if (error) {
      console.error('Error al subir a Supabase Storage:', error)
      return null
    }

    // Obtener la URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    console.log(`✅ Archivo subido exitosamente: ${publicUrl}`)

    return {
      url: publicUrl,
      path: filePath
    }
  } catch (error) {
    console.error('Error en uploadToSupabase:', error)
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
      console.error('Error al eliminar de Supabase Storage:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error en deleteFromSupabase:', error)
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
      console.error('Error generando signed URL:', error)
      return null
    }

    return data.signedUrl
  } catch (error) {
    console.error('Error en getSignedUrlSupabase:', error)
    return null
  }
}
