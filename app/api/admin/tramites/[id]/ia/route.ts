import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminConIA, cargarTramiteParaIA, respuestaErrorIA } from '@/lib/ai/rutas'
import { explicarObservacion, sugerirRespuesta } from '@/lib/ai/tramite'
import { revisarYGuardarFormulario } from '@/lib/ai/revision'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

interface RouteParams {
  params: Promise<{ id: string }>
}

// Ayudas de IA sobre un trámite: devuelven un borrador o una lectura que el
// admin revisa. Nada se envía desde acá; sólo se guarda la revisión del
// formulario, para no repetirla cada vez que se abre el trámite.
export async function POST(request: Request, { params }: RouteParams) {
  const acceso = await adminConIA(request)
  if (acceso.error) return acceso.error

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const accion = String(body?.accion ?? '')

  try {
    const datos = await cargarTramiteParaIA({ id })
    if (!datos) return NextResponse.json({ error: 'Trámite no encontrado' }, { status: 404 })

    if (accion === 'revisar-formulario') {
      return NextResponse.json(await revisarYGuardarFormulario(id))
    }

    if (accion === 'explicar-observacion') {
      const observacion = String(body?.observacion ?? '').trim()
      if (!observacion) {
        return NextResponse.json({ error: 'Pegá primero la observación del organismo.' }, { status: 400 })
      }
      return NextResponse.json(await explicarObservacion(datos.tramite, observacion.slice(0, 8000)))
    }

    if (accion === 'sugerir-chat') {
      const mensajes = await prisma.mensaje.findMany({
        where: { tramiteId: id },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { contenido: true, esAdmin: true },
      })
      if (!mensajes.some((m) => !m.esAdmin)) {
        return NextResponse.json({ error: 'El cliente todavía no escribió en el chat.' }, { status: 400 })
      }
      const conversacion = mensajes
        .reverse()
        .map((m) => `${m.esAdmin ? 'QMS' : 'Cliente'}: ${m.contenido}`)
        .join('\n')
      const texto = await sugerirRespuesta({ canal: 'chat', datos, conversacion })
      return NextResponse.json({ texto })
    }

    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
  } catch (error) {
    return respuestaErrorIA(error, `tramites/${id}/${accion}`)
  }
}
