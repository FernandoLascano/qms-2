import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { etiquetaPeriodo } from '@/lib/comisiones'
import { conversorPdfConfigurado } from '@/lib/pdf'
import { datosPartes, reportePartesHtml } from '@/lib/reportes/partes'
import { reportePdf } from '@/lib/reportes/pdf'

// El conversor a PDF se apaga cuando no se usa: el primer pedido puede tardar.
export const maxDuration = 60

// POST { periodo, costosMw, evolucion } - Reporte mensual a las partes (cláusula 5.3) en PDF
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const body = (await request.json().catch(() => ({}))) as { periodo?: string; costosMw?: string; evolucion?: string }
  const periodo = body.periodo ?? ''
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(periodo)) {
    return NextResponse.json({ error: 'Período inválido' }, { status: 400 })
  }
  if (!conversorPdfConfigurado()) {
    return NextResponse.json({ error: 'El conversor a PDF no está disponible en este entorno' }, { status: 501 })
  }

  try {
    const doc = await reportePartesHtml(
      await datosPartes(periodo),
      { costosMw: String(body.costosMw ?? ''), evolucion: String(body.evolucion ?? '') },
      session.user.name || 'QuieroMiSAS',
    )
    const pdf = await reportePdf(doc, `Reporte a las partes · ${etiquetaPeriodo(periodo)}`)
    const nombre = `Reporte a las partes QMS - ${etiquetaPeriodo(periodo)}.pdf`
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(nombre)}`,
      },
    })
  } catch (e) {
    console.error('Error al generar el reporte a las partes:', e)
    return NextResponse.json({ error: 'No se pudo generar el reporte' }, { status: 500 })
  }
}
