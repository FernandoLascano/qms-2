import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadToSupabase } from '@/lib/supabase-storage'

const MAX_BYTES = 8 * 1024 * 1024 // 8 MB

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Archivo no enviado' }, { status: 400 })
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'La imagen supera 8 MB' }, { status: 400 })
    }

    const isImage = file.type
      ? file.type.startsWith('image/')
      : /\.(png|jpe?g|webp|gif|svg)$/i.test(file.name)

    if (!isImage) {
      return NextResponse.json({ error: 'Solo se permiten imágenes' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const uploaded = await uploadToSupabase(buffer, 'blog/hero', file.name, file.type || 'image/jpeg')

    if (!uploaded?.url) {
      return NextResponse.json({ error: 'No se pudo subir la imagen' }, { status: 500 })
    }

    return NextResponse.json({ url: uploaded.url, path: uploaded.path })
  } catch {
    return NextResponse.json({ error: 'Error al subir imagen' }, { status: 500 })
  }
}
