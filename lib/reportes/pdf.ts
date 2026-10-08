import { htmlAPdf, unirPdfs } from '@/lib/pdf'
import { pieReporte, type DocumentoReporte } from './diseno'

/** Convierte portada y cuerpo por separado (en paralelo) y los une en un PDF. */
export async function reportePdf(doc: DocumentoReporte, textoPie: string): Promise<Buffer> {
  const [portada, cuerpo] = await Promise.all([htmlAPdf(doc.portada), htmlAPdf(doc.cuerpo, pieReporte(textoPie))])
  return unirPdfs([portada, cuerpo])
}
