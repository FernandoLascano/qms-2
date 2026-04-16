import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadToSupabase } from '@/lib/supabase-storage'

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

    const isImage = file.type ? file.type.startsWith('image/') : /\.(png|jpe?g|webp|svg)$/i.test(file.name)
    if (!isImage) {
      return NextResponse.json({ error: 'Formato no permitido' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const uploaded = await uploadToSupabase(buffer, 'partners/logos', file.name, file.type)

    if (!uploaded?.url) {
      return NextResponse.json({ error: 'No se pudo subir el logo' }, { status: 500 })
    }

    return NextResponse.json({ url: uploaded.url, path: uploaded.path })
  } catch {
    return NextResponse.json({ error: 'Error al subir logo' }, { status: 500 })
  }
}
