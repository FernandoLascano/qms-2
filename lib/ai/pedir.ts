/** Llama a una ruta de IA desde el navegador. Si falla, tira el mensaje que devolvió el servidor. */
export async function pedirIA<T>(url: string, body: unknown = {}): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || 'La IA no respondió. Probá de nuevo.')
  return data as T
}

export const mensajeDeError = (error: unknown) =>
  error instanceof Error ? error.message : 'La IA no respondió. Probá de nuevo.'
