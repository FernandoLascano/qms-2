import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Listar consultas del chat con paginación
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '30')
    const search = searchParams.get('search') || ''
    const skip = (page - 1) * limit

    const where: any = {}
    if (search) {
      where.OR = [
        { pregunta: { contains: search, mode: 'insensitive' } },
        { respuesta: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [consultas, total] = await Promise.all([
      prisma.consultaChat.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.consultaChat.count({ where }),
    ])

    return NextResponse.json({
      consultas,
      total,
      pages: Math.ceil(total / limit),
      page,
    })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// POST - Analizar consultas con IA
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'IA no configurada' }, { status: 503 })
    }

    // Obtener las últimas 200 consultas para analizar
    const consultas = await prisma.consultaChat.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: { pregunta: true },
    })

    if (consultas.length === 0) {
      return NextResponse.json({ error: 'No hay consultas para analizar' }, { status: 400 })
    }

    const preguntas = consultas.map(c => c.pregunta).join('\n- ')

    const { completeWithClaude } = await import('@/lib/ai/anthropic')

    const analysis = await completeWithClaude({
      apiKey,
      system: `Sos un analista de preguntas frecuentes para QuieroMiSAS, un servicio de constitución de S.A.S. (Sociedad por Acciones Simplificada) en Argentina.

Analizá las siguientes preguntas que hicieron los visitantes del sitio web y:

1. Agrupá las preguntas por temas/categorías
2. Identificá las 10 preguntas más frecuentes o recurrentes
3. Para cada pregunta frecuente, redactá una versión optimizada para FAQ con su respuesta profesional
4. Sugerí 3-5 preguntas que deberían agregarse al FAQ del sitio basándote en patrones

Contexto del servicio:
- Constituyen S.A.S. en Córdoba (IPJ) y CABA (IGJ), aunque CABA está temporalmente deshabilitada
- Planes: Básico ($285.000), Emprendedor ($320.000), Premium ($390.000)
- Plazo: 5 días hábiles
- 100% online
- Válida en todo el país

Respondé en español argentino, formato markdown.`,
      user: `Estas son las últimas ${consultas.length} preguntas que hicieron los visitantes:\n\n- ${preguntas}`,
      temperature: 0.3,
      maxTokens: 3000,
    })

    return NextResponse.json({ analysis, totalConsultas: consultas.length })
  } catch {
    return NextResponse.json({ error: 'Error al analizar consultas' }, { status: 500 })
  }
}
