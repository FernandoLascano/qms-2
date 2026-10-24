import sharp from 'sharp'

/** Ancho máximo de una portada: el blog la muestra a 896 px (x2 en pantallas retina ≈ 1600). */
const ANCHO_PORTADA = 1600

/**
 * Achica y comprime una portada del blog a JPEG. Las portadas salían de Gemini
 * en PNG de ~2 MB: las páginas las optimiza next/image, pero el og:image se
 * comparte tal cual y WhatsApp no muestra previas de imágenes tan pesadas.
 *
 * GIF y SVG se devuelven sin tocar (animación / vectorial).
 */
export async function optimizarPortada(
  buffer: Buffer,
  nombre: string,
  tipo: string
): Promise<{ buffer: Buffer; nombre: string; tipo: string }> {
  if (/gif|svg/i.test(tipo) || /\.(gif|svg)$/i.test(nombre)) return { buffer, nombre, tipo }
  const salida = await sharp(buffer)
    .rotate() // respeta la orientación EXIF de fotos de celular
    .resize({ width: ANCHO_PORTADA, withoutEnlargement: true })
    .flatten({ background: '#ffffff' }) // JPEG no tiene transparencia
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer()
  return { buffer: salida, nombre: nombre.replace(/\.[^.]+$/, '') + '.jpg', tipo: 'image/jpeg' }
}
