import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

function parseVariables(input: unknown): string[] | undefined {
  if (input === undefined) return undefined
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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const template = await prisma.emailTemplate.findUnique({ where: { id } })
    if (!template) {
      return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
    }
    return NextResponse.json(template)
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const existing = await prisma.emailTemplate.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
    }

    const body = await request.json()
    const data: Prisma.EmailTemplateUpdateInput = {}

    if (typeof body.displayName === 'string') data.displayName = body.displayName.trim()
    if (typeof body.subject === 'string') data.subject = body.subject.trim()
    if (typeof body.bodyHtml === 'string') data.bodyHtml = body.bodyHtml
    if (typeof body.category === 'string') data.category = body.category.trim() || 'general'
    if (typeof body.isActive === 'boolean') data.isActive = body.isActive
    if (body.variables !== undefined) {
      const v = parseVariables(body.variables)
      if (v !== undefined) data.variables = v
    }

    if (!existing.isSystem && typeof body.name === 'string') {
      const name = body.name.trim().toLowerCase().replace(/\s+/g, '_')
      if (!/^[a-z][a-z0-9_-]{0,62}$/.test(name)) {
        return NextResponse.json({ error: 'Clave interna inválida' }, { status: 400 })
      }
      data.name = name
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Sin cambios' }, { status: 400 })
    }

    const updated = await prisma.emailTemplate.update({
      where: { id },
      data,
    })

    return NextResponse.json(updated)
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Clave interna duplicada' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const existing = await prisma.emailTemplate.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
    }
    if (existing.isSystem) {
      return NextResponse.json({ error: 'No se pueden eliminar plantillas del sistema' }, { status: 403 })
    }

    await prisma.emailTemplate.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
