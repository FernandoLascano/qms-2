import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST - Carga a mano un lead que llegó por fuera de la web: un WhatsApp, una
 * llamada, un conocido. Hasta ahora el origen MANUAL existía pero no había
 * forma de usarlo, así que esos contactos no quedaban en ningún lado.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const limpiar = (v: unknown, max: number) =>
      typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null

    const nombre = limpiar(body.nombre, 200)
    const telefono = limpiar(body.telefono, 60)
    const email = limpiar(body.email, 200)?.toLowerCase() ?? null
    const mensaje = limpiar(body.mensaje, 5000)

    if (!nombre) return NextResponse.json({ error: 'Poné el nombre' }, { status: 400 })
    if (!telefono && !email) {
      return NextResponse.json({ error: 'Hace falta un teléfono o un email para poder contactarlo' }, { status: 400 })
    }
    if (email && !email.includes('@')) {
      return NextResponse.json({ error: 'El email no es válido' }, { status: 400 })
    }

    let proximoContacto: Date | null = null
    if (body.proximoContacto) {
      proximoContacto = new Date(body.proximoContacto)
      if (isNaN(proximoContacto.getTime())) {
        return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 })
      }
    }

    if (email) {
      const existe = await prisma.lead.findUnique({ where: { email }, select: { id: true } })
      if (existe) {
        return NextResponse.json({ error: 'Ya hay un lead con ese email', id: existe.id }, { status: 409 })
      }
    }

    const lead = await prisma.lead.create({
      data: { nombre, telefono, email, mensaje, origen: 'MANUAL', proximoContacto },
      select: { id: true },
    })
    return NextResponse.json(lead, { status: 201 })
  } catch (error) {
    console.error('Error al crear el lead:', error)
    return NextResponse.json({ error: 'No se pudo crear el lead' }, { status: 500 })
  }
}
