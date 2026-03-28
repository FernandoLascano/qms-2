import Anthropic from '@anthropic-ai/sdk'

export function getAnthropicModel(): string {
  return process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514'
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
  temperature: number
}): Promise<string> {
  const client = createAnthropicClient(params.apiKey)
  const msg = await client.messages.create({
    model: getAnthropicModel(),
    max_tokens: params.maxTokens,
    system: params.system,
    messages: [{ role: 'user', content: params.user }],
    temperature: params.temperature,
  })
  return textFromMessage(msg) || 'No se pudo generar una respuesta.'
}
