import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import type { ModalidadServicio } from '@prisma/client'

/**
 * Catálogo de servicios post-venta.
 *
 * Los planes son tres y viven como columnas en Config; el catálogo crece, así
 * que es una tabla. Agregar un servicio es una fila desde el panel, no una
 * migración.
 */

const MODALIDADES = ['UNICO', 'MENSUAL', 'ANUAL', 'SIN_COSTO', 'A_CONSULTAR'] as const

async function esAdmin() {
  const session = await getServerSession(authOptions)
  return session?.user?.rol === 'ADMIN'
}

export async function GET() {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const servicios = await prisma.servicioCatalogo.findMany({
    orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
  })
  return NextResponse.json({ servicios })
}

/** Campos que el panel puede tocar, con su saneamiento. */
function leerCampos(body: Record<string, unknown>): Record<string, unknown> {
  const datos: Record<string, unknown> = {}

  for (const campo of ['nombre', 'descripcion', 'icono', 'precioTexto', 'notasInternas'] as const) {
    if (typeof body[campo] === 'string') {
      const v = (body[campo] as string).trim()
      // El texto de precio y las notas se borran mandando vacío; el nombre no.
      datos[campo] = v || (campo === 'nombre' || campo === 'descripcion' || campo === 'icono' ? undefined : null)
    }
  }

  if (typeof body.modalidad === 'string' && MODALIDADES.includes(body.modalidad as never)) {
    datos.modalidad = body.modalidad as ModalidadServicio
  }

  // Null borra el precio y devuelve la tarjeta a "Consultar".
  if (body.precioDesde === null || body.precioDesde === '') {
    datos.precioDesde = null
  } else if (body.precioDesde !== undefined) {
    const n = Number(body.precioDesde)
    if (Number.isFinite(n) && n >= 0) datos.precioDesde = n
  }

  if (typeof body.comisionReferido === 'boolean') datos.comisionReferido = body.comisionReferido
  if (typeof body.activo === 'boolean') datos.activo = body.activo

  if (body.orden !== undefined) {
    const n = Number(body.orden)
    if (Number.isInteger(n)) datos.orden = n
  }

  return datos
}

export async function POST(request: NextRequest) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })

  const datos = leerCampos(body)
  if (!datos.nombre || !datos.descripcion) {
    return NextResponse.json({ error: 'El nombre y la descripción son obligatorios' }, { status: 400 })
  }

  // El slug identifica al servicio de forma estable para poder enlazarlo desde
  // los vencimientos, así que se deriva del nombre y no cambia después.
  const slug =
    String(body.slug || datos.nombre)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 60) || `servicio-${Date.now()}`

  const yaExiste = await prisma.servicioCatalogo.findUnique({ where: { slug } })
  if (yaExiste) {
    return NextResponse.json({ error: `Ya hay un servicio con la clave "${slug}"` }, { status: 409 })
  }

  const servicio = await prisma.servicioCatalogo.create({
    data: { ...datos, slug } as never,
  })

  revalidatePath('/dashboard/servicios')
  return NextResponse.json({ servicio })
}

export async function PUT(request: NextRequest) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body?.id) return NextResponse.json({ error: 'Falta el id' }, { status: 400 })

  const datos = leerCampos(body)
  if (!Object.keys(datos).length) {
    return NextResponse.json({ error: 'No hay nada para actualizar' }, { status: 400 })
  }

  const servicio = await prisma.servicioCatalogo.update({
    where: { id: String(body.id) },
    data: datos as never,
  })

  revalidatePath('/dashboard/servicios')
  return NextResponse.json({ servicio })
}

export async function DELETE(request: NextRequest) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Falta el id' }, { status: 400 })

  // Se desactiva en vez de borrar: el servicio puede estar referenciado desde
  // un vencimiento o una conversación anterior.
  await prisma.servicioCatalogo.update({ where: { id }, data: { activo: false } })

  revalidatePath('/dashboard/servicios')
  return NextResponse.json({ ok: true })
}
