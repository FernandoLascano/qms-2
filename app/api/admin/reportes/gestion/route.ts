import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { etiquetaPeriodo } from '@/lib/comisiones'
import { conversorPdfConfigurado } from '@/lib/pdf'
import { datosGestion, informeGestionHtml } from '@/lib/reportes/gestion'
import { reportePdf } from '@/lib/reportes/pdf'

// El conversor a PDF se apaga cuando no se usa: el primer pedido puede tardar.
export const maxDuration = 60

// GET ?periodo=AAAA-MM - Informe de gestión mensual en PDF
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const periodo = new URL(request.url).searchParams.get('periodo') ?? ''
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(periodo)) {
    return NextResponse.json({ error: 'Período inválido' }, { status: 400 })
  }
  if (!conversorPdfConfigurado()) {
    return NextResponse.json({ error: 'El conversor a PDF no está disponible en este entorno' }, { status: 501 })
  }

  try {
    const doc = await informeGestionHtml(await datosGestion(periodo), session.user.name || 'QuieroMiSAS')
    const pdf = await reportePdf(doc, `Informe de gestión · ${etiquetaPeriodo(periodo)}`)
    const nombre = `Informe de gestión QMS - ${etiquetaPeriodo(periodo)}.pdf`
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(nombre)}`,
      },
    })
  } catch (e) {
    console.error('Error al generar el informe de gestión:', e)
    return NextResponse.json({ error: 'No se pudo generar el informe' }, { status: 500 })
  }
}
