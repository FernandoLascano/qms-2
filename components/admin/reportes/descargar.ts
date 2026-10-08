/** Pide un PDF a la API y lo descarga con el nombre que manda el servidor. */
export async function descargarPdf(url: string, init?: RequestInit, nombrePorDefecto = 'reporte.pdf') {
  const res = await fetch(url, init)
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'No se pudo generar el PDF')
  const disp = res.headers.get('Content-Disposition') ?? ''
  const m = disp.match(/filename\*=UTF-8''([^;]+)/)
  const nombre = m ? decodeURIComponent(m[1]) : nombrePorDefecto
  const href = URL.createObjectURL(await res.blob())
  const a = document.createElement('a')
  a.href = href
  a.download = nombre
  a.click()
  URL.revokeObjectURL(href)
}
