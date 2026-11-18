import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ipDesdeHeaders } from '@/lib/rate-limit'
import { downloadFromSupabase } from '@/lib/supabase-storage'
import { evento, listaEventos } from '@/lib/contrato-domicilio-firma'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - PDF del contrato de domicilio: el firmado si ya está, si no el que
// hay que firmar. ?download=1 lo baja en vez de abrirlo.
export async function GET(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const { id } = await params
  const s = await prisma.contratoDomicilioFirma.findFirst({
    where: { tramiteId: id, estado: { not: 'ANULADA' }, tramite: { userId: session.user.id } },
    orderBy: { createdAt: 'desc' },
    include: { firmado: { select: { archivoPath: true, nombreArchivo: true } } },
  })
  if (!s) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  const path = s.firmado?.archivoPath ?? s.pdfPath
  const archivo = await downloadFromSupabase(path)
  if (!archivo) {
    return NextResponse.json({ error: 'No se pudo abrir el contrato' }, { status: 502 })
  }

  // Queda registrado que el cliente abrió el contrato antes de firmarlo (una vez).
  const eventos = listaEventos(s.eventos)
  if (s.estado === 'PENDIENTE' && !eventos.some((e) => e.accion === 'Contrato abierto por el cliente')) {
    await prisma.contratoDomicilioFirma
      .update({
        where: { id: s.id },
        data: {
          eventos: [...eventos, evento('Contrato abierto por el cliente', { ip: ipDesdeHeaders(request.headers) })] as unknown as Prisma.InputJsonValue,
        },
      })
      .catch(() => {})
  }

  const nombre = s.firmado?.nombreArchivo ?? 'Contrato de domicilio para firmar.pdf'
  const descargar = new URL(request.url).searchParams.has('download')
  return new NextResponse(new Uint8Array(archivo.buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${descargar ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(nombre)}`,
      'Cache-Control': 'private, no-store',
    },
  })
}
