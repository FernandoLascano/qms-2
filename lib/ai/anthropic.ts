import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import type { z } from 'zod'

/**
 * Dos usos, dos modelos:
 * - `analisis`: lo que le ahorra trabajo al equipo (revisar el formulario, leer
 *   un comprobante, redactar una respuesta). Importa acertar.
 * - `chat`: conversaciones con visitantes y clientes. Importa responder rápido.
 *
 * Los dos se pueden cambiar desde las variables de entorno sin tocar código
 * (ver CONFIGURACION_IA.md).
 */
export type TareaIA = 'analisis' | 'chat'

const MODELO_POR_DEFECTO: Record<TareaIA, string> = {
  analisis: 'claude-opus-5-5',
  chat: 'claude-haiku-5-5',
}

export function getAnthropicModel(tarea: TareaIA = 'analisis'): string {
  if (tarea === 'chat') {
    return process.env.ANTHROPIC_MODEL_CHAT ?? MODELO_POR_DEFECTO.chat
  }
  return process.env.ANTHROPIC_MODEL ?? MODELO_POR_DEFECTO.analisis
}

export function createAnthropicClient(apiKey: string) {
  return new Anthropic({ apiKey })
}

/** Error de IA con un mensaje que se le puede mostrar tal cual a quien la usó. */
export class ErrorIA extends Error {
  constructor(
    message: string,
    readonly status: number = 502,
  ) {
    super(message)
    this.name = 'ErrorIA'
  }
}

function clienteIA() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new ErrorIA('La IA no está configurada.', 503)
  return createAnthropicClient(apiKey)
}

/** Extrae el primer bloque de texto de la respuesta de Messages API. */
export function textFromMessage(msg: { content: Array<{ type: string; text?: string }> }): string {
  for (const block of msg.content) {
    if (block.type === 'text' && block.text) return block.text.trim()
  }
  return ''
}

type Esfuerzo = 'low' | 'medium' | 'high'
type BloqueSistema = Anthropic.Beta.BetaTextBlockParam

// Modelos donde Anthropic puede reintentar solo, en otro modelo, un pedido que
// el primero declinó. El resto no acepta el parámetro.
const CON_RESPALDO = /^claude-(opus-5|sonnet-5-5|fable-5)/

function respaldo(modelo: string) {
  return CON_RESPALDO.test(modelo)
    ? { betas: ['server-side-fallback-2026-07-01' as const], fallbacks: 'default' as const }
    : {}
}

/**
 * El texto fijo del sistema va primero y se guarda en caché; lo que cambia en
 * cada pedido (`variable`) va después para no invalidarla.
 */
function sistema(fijo: string, variable?: string): BloqueSistema[] {
  const bloques: BloqueSistema[] = [
    { type: 'text', text: fijo, cache_control: { type: 'ephemeral' } },
  ]
  if (variable) bloques.push({ type: 'text', text: variable })
  return bloques
}

function traducirError(error: unknown): never {
  if (error instanceof ErrorIA) throw error
  if (error instanceof Anthropic.AuthenticationError) {
    throw new ErrorIA('La clave de la IA no es válida. Revisá ANTHROPIC_API_KEY.', 503)
  }
  if (error instanceof Anthropic.RateLimitError) {
    throw new ErrorIA('La IA está recibiendo muchos pedidos. Probá de nuevo en un minuto.', 429)
  }
  if (error instanceof Anthropic.APIError) {
    console.error('[ia]', error.status, error.message)
    throw new ErrorIA('La IA no respondió. Probá de nuevo en un momento.')
  }
  throw error
}

function controlarCorte(msg: { stop_reason: string | null }) {
  if (msg.stop_reason === 'refusal') {
    throw new ErrorIA('La IA no pudo analizar este contenido. Revisalo a mano.', 422)
  }
  if (msg.stop_reason === 'max_tokens') {
    throw new ErrorIA('La respuesta de la IA quedó incompleta. Probá de nuevo.')
  }
}

export type ContenidoIA = string | Anthropic.Beta.BetaContentBlockParam[]

/** Pide una respuesta con forma fija (validada contra `schema`). */
export async function generarEstructurado<S extends z.ZodType>(params: {
  system: string
  /** Contexto que cambia en cada pedido; va después del texto fijo. */
  contexto?: string
  contenido: ContenidoIA
  schema: S
  maxTokens?: number
  effort?: Esfuerzo
}): Promise<z.infer<S>> {
  const client = clienteIA()
  const model = getAnthropicModel('analisis')
  try {
    const msg = await client.beta.messages.parse({
      model,
      max_tokens: params.maxTokens ?? 8000,
      system: sistema(params.system, params.contexto),
      messages: [{ role: 'user', content: params.contenido }],
      output_config: {
        effort: params.effort ?? 'medium',
        format: betaZodOutputFormat(params.schema),
      },
      ...respaldo(model),
    })
    controlarCorte(msg)
    if (!msg.parsed_output) throw new ErrorIA('La IA devolvió una respuesta que no se pudo leer.')
    return msg.parsed_output
  } catch (error) {
    traducirError(error)
  }
}

/** Pide texto libre. `tarea` elige el modelo. */
export async function generarTexto(params: {
  system: string
  contexto?: string
  messages: { role: 'user' | 'assistant'; content: string }[]
  tarea?: TareaIA
  maxTokens?: number
  effort?: Esfuerzo
}): Promise<string> {
  const client = clienteIA()
  const model = getAnthropicModel(params.tarea ?? 'analisis')
  try {
    const msg = await client.beta.messages.create({
      model,
      max_tokens: params.maxTokens ?? 4000,
      system: sistema(params.system, params.contexto),
      messages: params.messages,
      output_config: { effort: params.effort ?? 'low' },
      ...respaldo(model),
    })
    controlarCorte(msg)
    const texto = textFromMessage(msg)
    if (!texto) throw new ErrorIA('La IA no devolvió una respuesta.')
    return texto
  } catch (error) {
    traducirError(error)
  }
}

export async function completeWithClaude(params: {
  apiKey: string
  system: string
  user: string
  maxTokens: number
}): Promise<string> {
  const client = createAnthropicClient(params.apiKey)
  const model = getAnthropicModel('analisis')
  // Nota: los modelos actuales rechazan `temperature`; no se envía. El modelo
  // piensa antes de escribir y eso cuenta dentro de max_tokens: se deja margen.
  const msg = await client.beta.messages.create({
    model,
    max_tokens: params.maxTokens + 4000,
    system: params.system,
    messages: [{ role: 'user', content: params.user }],
    ...respaldo(model),
  })
  return textFromMessage(msg) || 'No se pudo generar una respuesta.'
}
