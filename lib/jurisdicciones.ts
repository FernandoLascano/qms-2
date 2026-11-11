/**
 * Jurisdicciones que se ven pero no se pueden elegir online (habilitada = false
 * en el panel). Se constituyen sólo después de hablar con nosotros.
 */
export const ETIQUETA_A_CONSULTA = 'Sujeto a consulta'

/** Por qué cada jurisdicción va a consulta. Sin entrada, se usa el texto genérico. */
const MOTIVOS: Record<string, string> = {
  CABA: 'En CABA los plazos no son los de Córdoba: la IGJ puede tardar hasta 30 días en dar turno para la firma, y la firma es presencial (no se puede firmar digitalmente).',
}

export function motivoConsulta(jurisdiccion: string): string {
  return MOTIVOS[jurisdiccion] ?? 'Por ahora no la ofrecemos online.'
}

export function whatsappConsulta(nombre: string): string {
  const texto = `Hola! Quiero consultar por constituir una SAS en ${nombre}.`
  return `https://wa.me/5493512136212?text=${encodeURIComponent(texto)}`
}
