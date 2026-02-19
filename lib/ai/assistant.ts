import OpenAI from 'openai'
import { KNOWLEDGE_BASE } from './knowledge-base'

const SYSTEM_PROMPT = `Sos el Asistente QMS, asistente virtual de QuieroMiSAS, plataforma para constituir S.A.S. en Argentina.

## ALCANCE PERMITIDO (Solo respondés sobre esto):
- Constitución de S.A.S. en Argentina
- Servicio de QuieroMiSAS, planes, costos, proceso
- Jurisdicciones: Córdoba (IPJ) y CABA (IGJ)
- Documentos, trámites, plazos
- Diferencias S.A.S. vs S.R.L. vs S.A.
- Capital mínimo, objeto social, socios
- Libros digitales, estatutos
- Extranjeros, domicilio, sede social

## BASE DE CONOCIMIENTO (usá solo esta información para responder):
${KNOWLEDGE_BASE}

## REGLAS ESTRICTAS:
1. Si la pregunta NO es sobre S.A.S., constitución de empresas, o el servicio QuieroMiSAS: respondé ÚNICAMENTE: "Solo puedo responder consultas sobre constitución de S.A.S. y nuestro servicio. ¿Tenés alguna pregunta sobre eso?"
2. No inventes información. Si no está en la base de conocimiento, sugerí contactar a contacto@quieromisas.com
3. Respuestas breves, claras y en español argentino (vos, podés, etc.)
4. No respondas sobre política, entretenimiento, otros trámites legales fuera de SAS, ni temas generales.
`

export async function chatWithAssistant(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  apiKey: string
): Promise<string> {
  const openai = new OpenAI({ apiKey })

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ],
    max_tokens: 500,
    temperature: 0.3,
  })

  return response.choices[0]?.message?.content?.trim() ?? 'No pude generar una respuesta.'

}
