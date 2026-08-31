'use client'

/**
 * Atribución de la primera visita, guardada en el navegador.
 *
 * Se resuelve del lado del cliente y no en el middleware a propósito: el
 * middleware del proyecto corre `withAuth` y sólo matchea /dashboard. Ampliarlo
 * a todo el sitio para leer un par de parámetros metería la autenticación en
 * rutas públicas — un riesgo desproporcionado para lo que se gana.
 *
 * Se guarda en `sessionStorage` la PRIMERA vez y no se pisa: interesa por dónde
 * entró la persona, no la última página que tocó antes de escribir.
 */

const CLAVE = 'qms_atribucion'

export interface AtribucionCliente {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  referrer?: string
  landingPath?: string
}

/** Llamar una vez al montar la portada. Es idempotente. */
export function registrarAtribucion(): void {
  if (typeof window === 'undefined') return
  try {
    if (window.sessionStorage.getItem(CLAVE)) return

    const params = new URLSearchParams(window.location.search)
    const externo =
      document.referrer && !document.referrer.includes(window.location.host)
        ? document.referrer
        : ''

    const datos: AtribucionCliente = {
      utmSource: params.get('utm_source') || undefined,
      utmMedium: params.get('utm_medium') || undefined,
      utmCampaign: params.get('utm_campaign') || undefined,
      referrer: externo || undefined,
      landingPath: window.location.pathname || undefined,
    }

    // Si no hay ninguna señal, igual se guarda el landing: sirve para saber por
    // qué página entró la gente que después consulta.
    window.sessionStorage.setItem(CLAVE, JSON.stringify(datos))
  } catch {
    // sessionStorage puede fallar en modo privado o con cookies bloqueadas.
    // La atribución es un extra: nunca puede romper la página.
  }
}

export function leerAtribucion(): AtribucionCliente {
  if (typeof window === 'undefined') return {}
  try {
    const crudo = window.sessionStorage.getItem(CLAVE)
    return crudo ? (JSON.parse(crudo) as AtribucionCliente) : {}
  } catch {
    return {}
  }
}
