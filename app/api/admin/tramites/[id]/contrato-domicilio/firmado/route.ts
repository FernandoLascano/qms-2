import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteFromSupabase, uploadToSupabase } from '@/lib/supabase-storage'
import {
  estadoContrato,
  MAX_BYTES_CONTRATO_FIRMADO,
  serializarFirmado,
  type ResumenContrato,
} from '@/lib/contrato-domicilio-firmado'

interface RouteParams {
  params: Promise<{ id: string }>
}

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  return session?.user?.id && session.user.rol === 'ADMIN' ? session : null
}

/** "AAAA-MM-DD" → mediodía UTC, para que la fecha no se corra de día al mostrarla en Argentina. */
function fechaDeInput(valor: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null
  const d = new Date(`${valor}T12:00:00Z`)
  return Number.isNaN(d.getTime()) ? null : d
}

// GET - Estado del contrato firmado del trámite: el vigente, el historial
// (reemplazados) y las versiones generadas, para elegir a cuál corresponde.
export async function GET(_request: Request, { params }: RouteParams) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const { id } = await params
  try {
    const [firmados, versiones, domicilio] = await Promise.all([
      prisma.contratoDomicilioFirmado.findMany({
        where: { tramiteId: id },
        include: { contratoVersion: { select: { version: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.contratoDomicilioVersion.findMany({
        where: { tramiteId: id },
        select: { id: true, version: true, createdAt: true, generadoPor: true },
        orderBy: { version: 'desc' },
      }),
      prisma.domicilioSede.findUnique({ where: { tramiteId: id }, select: { estado: true } }),
    ])
    const [vigente, ...anteriores] = firmados
    const resumen: ResumenContrato = {
      estado: estadoContrato(vigente, versiones[0]),
      firmado: vigente ? serializarFirmado(vigente) : null,
      ultimaVersion: versiones[0] ? { version: versiones[0].version, fecha: versiones[0].createdAt.toISOString() } : null,
    }
    return NextResponse.json({
      ...resumen,
      /** Estado del servicio de domicilio (null si el trámite no lo tiene). */
      domicilio: domicilio?.estado ?? null,
      historial: anteriores.map(serializarFirmado),
      versiones: versiones.map((v) => ({
        id: v.id,
        version: v.version,
        fecha: v.createdAt.toISOString(),
        generadoPor: v.generadoPor,
      })),
    })
  } catch (e) {
    console.error('Error al leer el contrato de domicilio firmado:', e)
    return NextResponse.json({ error: 'No se pudo leer el contrato firmado' }, { status: 500 })
  }
}

// POST - Sube el contrato firmado (PDF). Si ya había uno, el nuevo pasa a ser
// el vigente y el anterior queda en el historial.
// FormData: file (PDF), fechaFirma (AAAA-MM-DD), contratoVersionId (opcional).
export async function POST(request: Request, { params }: RouteParams) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const { id } = await params

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'No se recibió el archivo' }, { status: 400 })
  }
  const file = formData.get('file')
  const fechaFirma = fechaDeInput(String(formData.get('fechaFirma') || ''))
  const contratoVersionId = String(formData.get('contratoVersionId') || '') || null

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Elegí el PDF del contrato firmado' }, { status: 400 })
  }
  if (file.size <= 0 || file.size > MAX_BYTES_CONTRATO_FIRMADO) {
    return NextResponse.json({ error: 'El archivo supera el tamaño máximo permitido (15 MB).' }, { status: 400 })
  }
  const buffer = Buffer.from(await file.arrayBuffer())
  // El tipo que manda el navegador no alcanza: se mira la firma del archivo.
  const esPdf = buffer.subarray(0, 5).toString('latin1') === '%PDF-'
  if (!esPdf || (file.type && file.type !== 'application/pdf')) {
    return NextResponse.json({ error: 'El contrato firmado tiene que ser un PDF.' }, { status: 400 })
  }
  if (!fechaFirma) {
    return NextResponse.json({ error: 'Indicá la fecha de firma' }, { status: 400 })
  }
  if (fechaFirma.getTime() > Date.now() + 86_400_000) {
    return NextResponse.json({ error: 'La fecha de firma no puede ser futura' }, { status: 400 })
  }

  const tramite = await prisma.tramite.findUnique({ where: { id }, select: { id: true } })
  if (!tramite) {
    return NextResponse.json({ error: 'Trámite no encontrado' }, { status: 404 })
  }
  if (contratoVersionId) {
    const version = await prisma.contratoDomicilioVersion.findFirst({
      where: { id: contratoVersionId, tramiteId: id },
      select: { id: true },
    })
    if (!version) {
      return NextResponse.json({ error: 'La versión elegida no es de este trámite' }, { status: 400 })
    }
  }

  const subido = await uploadToSupabase(buffer, `contratos-domicilio/${id}`, file.name || 'contrato-firmado.pdf', 'application/pdf')
  if (!subido) {
    return NextResponse.json({ error: 'No se pudo subir el archivo. Intentá de nuevo.' }, { status: 500 })
  }

  try {
    const creado = await prisma.contratoDomicilioFirmado.create({
      data: {
        tramiteId: id,
        archivoPath: subido.path,
        nombreArchivo: (file.name || 'contrato-firmado.pdf').slice(0, 255),
        tamanio: buffer.length,
        fechaFirma,
        cargadoPor: session.user.name ?? null,
        contratoVersionId,
      },
      include: { contratoVersion: { select: { version: true } } },
    })
    return NextResponse.json(serializarFirmado(creado), { status: 201 })
  } catch (e) {
    console.error('Error al guardar el contrato de domicilio firmado:', e)
    // Sin la fila, el archivo queda huérfano: se borra.
    await deleteFromSupabase(subido.path)
    return NextResponse.json({ error: 'No se pudo guardar el contrato firmado' }, { status: 500 })
  }
}
