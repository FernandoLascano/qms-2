import { waitUntil } from '@vercel/functions'

/**
 * Corre tareas no críticas (sobre todo emails) después de responder el request.
 * Mandar emails dentro del request demoraba varios segundos la respuesta
 * (subir un documento tardaba ~9 s). waitUntil mantiene viva la función en
 * Vercel hasta que terminen; en local la promesa sigue corriendo en el server.
 *
 * Recibe funciones (no promesas) para que un error síncrono al armar el email
 * tampoco rompa el request. Los fallos solo quedan en el log.
 */
export function enSegundoPlano(etiqueta: string, ...tareas: Array<() => Promise<unknown>>) {
  if (tareas.length === 0) return
  waitUntil(
    Promise.allSettled(tareas.map(t => Promise.resolve().then(t))).then(resultados => {
      resultados.forEach(r => {
        if (r.status === 'rejected') console.error(`[${etiqueta}] tarea en segundo plano falló:`, r.reason)
      })
    })
  )
}
