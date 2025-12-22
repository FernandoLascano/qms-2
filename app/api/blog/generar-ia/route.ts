import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar que la API key esté configurada
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'API de OpenAI no configurada. Agregá OPENAI_API_KEY en las variables de entorno.' },
        { status: 503 }
      )
    }

    // Importar OpenAI dinámicamente para evitar error en build
    const OpenAI = (await import('openai')).default
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    const { prompt, tipo } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Debes proporcionar un prompt' },
        { status: 400 }
      )
    }

    // Construir el prompt según el tipo
    let systemPrompt = ''
    let userPrompt = prompt

    switch (tipo) {
      case 'articulo-completo':
        systemPrompt = `Eres un experto en derecho societario argentino y comunicación para emprendedores.
Genera un artículo de blog completo, bien estructurado y optimizado para SEO sobre S.A.S. (Sociedades por Acciones Simplificadas) en Argentina.

El artículo debe:
- Tener un título atractivo y claro
- Incluir una descripción/resumen de 2-3 líneas
- Estar estructurado en secciones con subtítulos (h2)
- Incluir párrafos informativos y bien redactados
- Tener listas cuando sea apropiado
- Incluir 5-7 tags relevantes
- Sugerir 8-10 keywords SEO
- Tener entre 800-1200 palabras
- Ser profesional pero accesible
- Incluir información práctica y útil

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta:
{
  "titulo": "string",
  "descripcion": "string",
  "categoria": "Guías" | "Emprendimiento" | "Legal" | "Costos" | "Comparativas" | "Noticias",
  "tags": ["string"],
  "keywords": ["string"],
  "imagenAlt": "string",
  "metaDescription": "string (max 160 caracteres)",
  "lectura": "X min",
  "contenido": [
    { "type": "h2", "text": "string" },
    { "type": "p", "text": "string" },
    { "type": "list", "items": ["string"] },
    { "type": "quote", "text": "string" }
  ]
}`
        break

      case 'mejorar-texto':
        systemPrompt = `Eres un editor experto en contenido para blogs sobre temas legales y empresariales en Argentina.
Mejora el siguiente texto manteniendo el mismo mensaje pero haciéndolo más claro, profesional y atractivo.
Responde ÚNICAMENTE con el texto mejorado, sin explicaciones adicionales.`
        break

      case 'generar-descripcion':
        systemPrompt = `Basándote en el título y contenido proporcionado, genera:
1. Una descripción/resumen atractivo de 2-3 líneas
2. Una meta description optimizada para SEO (máximo 160 caracteres)
3. 5-7 tags relevantes
4. 8-10 keywords SEO

Responde ÚNICAMENTE con un JSON válido:
{
  "descripcion": "string",
  "metaDescription": "string",
  "tags": ["string"],
  "keywords": ["string"],
  "imagenAlt": "string"
}`
        break

      default:
        systemPrompt = 'Eres un asistente experto en crear contenido para blogs sobre S.A.S. y temas empresariales en Argentina.'
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // GPT-4 Turbo optimizado
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    })

    let responseText = completion.choices[0]?.message?.content?.trim()

    if (!responseText) {
      throw new Error('No se recibió respuesta de la IA')
    }

    // Si es un JSON, parsearlo
    if (tipo === 'articulo-completo' || tipo === 'generar-descripcion') {
      // Limpiar markdown code blocks si existen
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

      try {
        const jsonResponse = JSON.parse(responseText)
        return NextResponse.json(jsonResponse)
      } catch (parseError) {
        console.error('Error parsing JSON:', responseText)
        return NextResponse.json(
          { error: 'Error al parsear respuesta de IA', raw: responseText },
          { status: 500 }
        )
      }
    }

    // Para mejorar texto, devolver directamente
    return NextResponse.json({ texto: responseText })

  } catch (error: any) {
    console.error('Error generando contenido con IA:', error)
    return NextResponse.json(
      {
        error: 'Error al generar contenido',
        detalles: error.message,
        stack: error.stack
      },
      { status: 500 }
    )
  }
}
