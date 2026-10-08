import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createGa4DataClient, getGa4PropertyResource } from '@/lib/ga4/client'
import { ga4DateRange } from '@/lib/ga4/date-range'
import { fetchGa4Dashboard } from '@/lib/ga4/fetch-dashboard'

/**
 * Lo que ve el admin cuando Google Analytics falla. El error crudo de Google
 * («invalid_grant», «Getting metadata from plugin failed…») va al log, no a la
 * pantalla.
 */
function mensajeAmigable(crudo: string): string {
  if (/invalid_grant|invalid_client|unauthorized_client|refresh token/i.test(crudo)) {
    return 'No pudimos conectar con Google Analytics: venció la autorización de la cuenta y hay que volver a autorizarla.'
  }
  if (/PERMISSION_DENIED|permission/i.test(crudo)) {
    return 'No pudimos conectar con Google Analytics: la cuenta conectada no tiene acceso a la propiedad del sitio.'
  }
  return 'Google Analytics no respondió. Probá de nuevo en unos minutos.'
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const periodo = searchParams.get('periodo') || 'semana'

    const ga4Client = createGa4DataClient()
    if (!ga4Client.ok) {
      console.error('[ga4] Sin configurar:', ga4Client.error)
      return NextResponse.json(
        {
          error: 'GA4 no configurado',
          mensaje: 'Google Analytics todavía no está conectado al panel.',
        },
        { status: 503 }
      )
    }

    const prop = getGa4PropertyResource()
    if (!prop.ok) {
      console.error('[ga4] Propiedad mal configurada:', prop.error)
      return NextResponse.json(
        { error: 'GA4 no configurado', mensaje: 'Google Analytics todavía no está conectado al panel.' },
        { status: 500 }
      )
    }

    const { startDate, endDate } = ga4DateRange(periodo)
    const propertyIdNumeric = process.env.GA4_PROPERTY_ID || '516402270'

    const data = await fetchGa4Dashboard(
      ga4Client.client,
      prop.property,
      startDate,
      endDate,
      periodo,
      propertyIdNumeric
    )

    return NextResponse.json(data)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error desconocido'
    console.error('[ga4] Google Analytics no respondió:', message)
    return NextResponse.json(
      {
        error: 'Error al consultar Google Analytics',
        mensaje: mensajeAmigable(message),
      },
      { status: 502 }
    )
  }
}
