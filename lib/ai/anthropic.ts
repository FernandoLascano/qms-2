import Anthropic from '@anthropic-ai/sdk'

export function getAnthropicModel(): string {
  // claude-sonnet-4-20250514 fue retirado (jun 2026) → 404. Usamos el reemplazo actual.
  return process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-5'
}

export function createAnthropicClient(apiKey: string) {
  return new Anthropic({ apiKey })
}

/** Extrae el primer bloque de texto de la respuesta de Messages API. */
export function textFromMessage(msg: Anthropic.Message): string {
  for (const block of msg.content) {
    if (block.type === 'text') return block.text.trim()
  }
  return ''
}

export async function completeWithClaude(params: {
  apiKey: string
  system: string
  user: string
  maxTokens: number
}): Promise<string> {
  const client = createAnthropicClient(params.apiKey)
  // Nota: los modelos actuales (Sonnet 5 / Opus 4.x) rechazan `temperature`; no se envía.
  const msg = await client.messages.create({
    model: getAnthropicModel(),
    max_tokens: params.maxTokens,
    system: params.system,
    messages: [{ role: 'user', content: params.user }],
  })
  return textFromMessage(msg) || 'No se pudo generar una respuesta.'
}
