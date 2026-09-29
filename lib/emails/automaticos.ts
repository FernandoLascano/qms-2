/**
 * ¿Este mail entrante lo escribió una persona o una máquina?
 *
 * Existe por un bucle real: el 6 y el 8 de julio entraron 150 mails «Fuera de
 * oficina Re: [FWD] Fuera de oficina Re: [FWD]…». Cada mail que llega se
 * reenvía a la casilla de trabajo; esa casilla tenía la respuesta automática
 * de vacaciones, que volvía a la bandeja, que la volvía a reenviar. El único
 * freno que había era para los avisos de rebote (DSN).
 *
 * `seguro` = la señal alcanza para archivarlo sin que nadie lo mire.
 *
 * Señales, de la más confiable a la menos:
 *  1. Encabezados estándar de respuesta automática (RFC 3834 y los de
 *     Exchange/Gmail).
 *  2. El asunto trae nuestro propio «[FWD]»: es un reenvío nuestro que volvió.
 *  3. Asuntos típicos de respuesta automática, en español e inglés.
 */

type Encabezados = Map<string, unknown> | undefined

// Anclado al principio del asunto: una consulta real puede mencionar
// «vacaciones» o «ausente» en el medio, una respuesta automática empieza así.
const ASUNTO_AUTOMATICO =
  /^\s*((re|rv|fw|fwd)\s*:\s*)*(fuera de (la )?oficina|respuesta autom[aá]tica|out of (the )?office|automatic reply|auto[- ]?reply)\b/i

export function esCorreoAutomatico({
  encabezados,
  asunto,
  remitente,
  casillaDeReenvio,
}: {
  encabezados: Encabezados
  asunto: string
  remitente: string
  casillaDeReenvio?: string | null
}): { automatico: boolean; seguro: boolean; motivo?: string } {
  const h = (nombre: string) => {
    const v = encabezados?.get(nombre)
    return typeof v === 'string' ? v.toLowerCase() : v == null ? '' : String(v).toLowerCase()
  }

  const autoSubmitted = h('auto-submitted')
  if (autoSubmitted && autoSubmitted !== 'no') return { automatico: true, seguro: true, motivo: 'auto-submitted' }
  if (h('x-autoreply') || h('x-autorespond') || h('x-autoresponse')) return { automatico: true, seguro: true, motivo: 'x-autoreply' }
  if (/auto_reply|bulk|junk/.test(h('precedence'))) return { automatico: true, seguro: true, motivo: 'precedence' }
  if (/\b(oof|autoreply|all)\b/.test(h('x-auto-response-suppress')) && ASUNTO_AUTOMATICO.test(asunto)) {
    return { automatico: true, seguro: true, motivo: 'exchange-oof' }
  }

  if (/\[FWD\]/.test(asunto)) return { automatico: true, seguro: true, motivo: 'reenvio-propio' }
  if (casillaDeReenvio && remitente.toLowerCase() === casillaDeReenvio.toLowerCase() && ASUNTO_AUTOMATICO.test(asunto)) {
    return { automatico: true, seguro: true, motivo: 'casilla-de-reenvio' }
  }
  // Sólo por el asunto: no se reenvía (eso corta el bucle), pero tampoco se
  // archiva, por si era una persona.
  if (ASUNTO_AUTOMATICO.test(asunto)) return { automatico: true, seguro: false, motivo: 'asunto' }

  return { automatico: false, seguro: false }
}
