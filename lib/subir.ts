/**
 * POST de un FormData con progreso de subida. `fetch` no informa cuánto se
 * subió; XMLHttpRequest sí. Devuelve lo mismo que se usaba de `fetch`:
 * `ok`, `status` y `json()`.
 *
 * `alProgreso` recibe 0–100 mientras sube el archivo. Al llegar a 100 el
 * servidor todavía procesa (guarda el archivo, avisa por email), así que la
 * pantalla tiene que seguir mostrando que falta un poco.
 */
export type RespuestaSubida = { success?: boolean; error?: string; [clave: string]: unknown }

export function subirConProgreso(
  url: string,
  datos: FormData,
  alProgreso: (porcentaje: number) => void,
  metodo: 'POST' | 'PATCH' = 'POST',
): Promise<{ ok: boolean; status: number; json: () => Promise<RespuestaSubida> }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(metodo, url)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) alProgreso(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () =>
      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        json: async () => JSON.parse(xhr.responseText || '{}'),
      })
    xhr.onerror = () => reject(new Error('Error de red al subir el archivo'))
    xhr.send(datos)
  })
}
