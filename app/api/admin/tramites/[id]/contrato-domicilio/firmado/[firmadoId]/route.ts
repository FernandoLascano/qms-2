import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteFromSupabase, getSignedUrlSupabase } from '@/lib/supabase-storage'

interface RouteParams {
  params: Promise<{ id: string; firmadoId: string }>
}

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  return session?.user?.id && session.user.rol === 'ADMIN' ? session : null
}

function buscar(tramiteId: string, firmadoId: string) {
  return prisma.contratoDomicilioFirmado.findFirst({ where: { id: firmadoId, tramiteId } })
}

// GET - Abre el PDF firmado: redirige a una URL firmada de 5 minutos.
// ?download=1 fuerza la descarga en vez de abrirlo en el navegador.
export async function GET(req: NextRequest, { params }: RouteParams) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const { id, firmadoId } = await params
  const firmado = await buscar(id, firmadoId)
  if (!firmado) {
    return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 })
  }
  const descargar = req.nextUrl.searchParams.get('download') === '1'
  const url = await getSignedUrlSupabase(firmado.archivoPath, 300, undefined, descargar)
  if (!url) {
    return NextResponse.json({ error: 'No se pudo abrir el archivo' }, { status: 500 })
  }
  return NextResponse.redirect(url)
}

// DELETE - Quita un contrato firmado (p. ej. se subió el archivo equivocado).
// Si era el vigente y había uno anterior, el anterior vuelve a ser el vigente.
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const { id, firmadoId } = await params
  const firmado = await buscar(id, firmadoId)
  if (!firmado) {
    return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 })
  }
  await prisma.contratoDomicilioFirmado.delete({ where: { id: firmado.id } })
  // Si el archivo no se puede borrar, la fila ya no existe: queda huérfano en
  // Storage pero no se muestra. Se avisa en el log.
  if (!(await deleteFromSupabase(firmado.archivoPath))) {
    console.error('No se pudo borrar de Storage el contrato firmado:', firmado.archivoPath)
  }
  return NextResponse.json({ success: true })
}
