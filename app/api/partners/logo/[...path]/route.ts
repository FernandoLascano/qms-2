import { NextResponse } from 'next/server'
import { DOCUMENTS_BUCKET, downloadFromSupabase } from '@/lib/supabase-storage'
import { PARTNER_LOGOS_PREFIX } from '@/lib/partner-logo'

/**
 * Sirve públicamente los logos de partners que quedaron en el bucket privado.
 * Solo responde objetos bajo `partners/logos/` y solo si son imágenes: el resto
 * del bucket (documentos de clientes) sigue inaccesible.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const segmentos = (path ?? []).map((s) => decodeURIComponent(s))

  if (
    segmentos.length === 0 ||
    segmentos.some((s) => !s || s === '.' || s === '..' || s.includes('/') || s.includes('\\'))
  ) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  const objectPath = `${PARTNER_LOGOS_PREFIX}${segmentos.join('/')}`
  const archivo = await downloadFromSupabase(objectPath, DOCUMENTS_BUCKET)
  if (!archivo || !archivo.contentType.startsWith('image/')) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  return new NextResponse(new Uint8Array(archivo.buffer), {
    headers: {
      'Content-Type': archivo.contentType,
      // El nombre lleva timestamp: un logo nuevo es otro path, así que se puede cachear largo.
      'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    },
  })
}
