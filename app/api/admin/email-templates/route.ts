import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const NAME_RE = /^[a-z][a-z0-9_-]{0,62}$/

function parseVariables(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.map((v) => String(v).trim()).filter(Boolean)
  }
  if (typeof input === 'string') {
    return input
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

/** scope=compose: solo activas (selector al redactar). Sin scope: todas (admin). */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const scope = request.nextUrl.searchParams.get('scope')
    const where = scope === 'compose' ? { isActive: true } : {}

    const templates = await prisma.emailTemplate.findMany({
      where,
      orderBy: [{ category: 'asc' }, { displayName: 'asc' }],
      select: {
        id: true,
        name: true,
        displayName: true,
        subject: true,
        bodyHtml: true,
        variables: true,
        category: true,
        isActive: true,
        isSystem: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ templates })
  } catch {
    return NextResponse.json({ error: 'Error al listar plantillas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const name = String(body.name || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
    const displayName = String(body.displayName || '').trim()
    const subject = String(body.subject || '').trim()
    const bodyHtml = String(body.bodyHtml || '').trim()
    const category = String(body.category || 'general').trim() || 'general'
    const variables = parseVariables(body.variables)
    const isActive = body.isActive !== false

    if (!NAME_RE.test(name)) {
      return NextResponse.json(
        {
          error:
            'Clave interna inválida: usar solo minúsculas, números, guiones y underscore, empezar con letra (ej. recordatorio_docs)',
        },
        { status: 400 }
      )
    }
    if (!displayName || !subject || !bodyHtml) {
      return NextResponse.json(
        { error: 'Nombre visible, asunto y cuerpo HTML son obligatorios' },
        { status: 400 }
      )
    }

    const created = await prisma.emailTemplate.create({
      data: {
        name,
        displayName,
        subject,
        bodyHtml,
        variables,
        category,
        isActive,
        isSystem: false,
      },
    })

    return NextResponse.json(created)
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe una plantilla con esa clave interna' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error al crear plantilla' }, { status: 500 })
  }
}
