/**
 * Conversión de Word a PDF con Gotenberg (LibreOffice en un contenedor propio:
 * https://gotenberg.dev). Vercel no puede correr LibreOffice, así que el
 * servicio vive aparte y se configura con:
 *  · GOTENBERG_URL: la dirección del servicio (ej. https://gotenberg-xxx.run.app)
 *  · GOTENBERG_USER / GOTENBERG_PASSWORD: opcionales, si el servicio pide usuario.
 */
export function conversorPdfConfigurado(): boolean {
  return !!process.env.GOTENBERG_URL
}

export async function docxAPdf(docx: Buffer, nombre = 'documento.docx'): Promise<Buffer> {
  const base = process.env.GOTENBERG_URL
  if (!base) throw new Error('Falta configurar GOTENBERG_URL')

  const form = new FormData()
  form.append(
    'files',
    new Blob([new Uint8Array(docx)], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
    nombre,
  )

  const headers: Record<string, string> = {}
  if (process.env.GOTENBERG_USER) {
    const cred = `${process.env.GOTENBERG_USER}:${process.env.GOTENBERG_PASSWORD ?? ''}`
    headers.Authorization = `Basic ${Buffer.from(cred).toString('base64')}`
  }

  const res = await fetch(`${base.replace(/\/$/, '')}/forms/libreoffice/convert`, {
    method: 'POST',
    body: form,
    headers,
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) {
    throw new Error(`Gotenberg respondió ${res.status}: ${(await res.text()).slice(0, 200)}`)
  }
  return Buffer.from(await res.arrayBuffer())
}
