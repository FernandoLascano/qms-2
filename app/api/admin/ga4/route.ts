import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createGa4DataClient, getGa4PropertyResource } from '@/lib/ga4/client'
import { ga4DateRange } from '@/lib/ga4/date-range'
import { fetchGa4Dashboard, type Ga4DashboardPayload } from '@/lib/ga4/fetch-dashboard'
import type { BetaAnalyticsDataClient } from '@google-analytics/data'

/**
 * El cliente de GA4 se reutiliza entre requests de la misma instancia: así
 * conserva el access token (dura ~1 h) y no repite en cada visita el canje
 * OIDC → STS → impersonación. El token OIDC de Vercel se pide recién al
 * renovar, dentro del request que lo dispara.
 */
let clienteGa4: BetaAnalyticsDataClient | null = null

/**
 * GA4 tarda varios segundos y sus números no cambian minuto a minuto: se
 * guarda cada período 5 minutos. Se guarda la promesa, así dos pedidos
 * simultáneos comparten la misma consulta. Los errores no se guardan.
 */
const CACHE_MS = 5 * 60 * 1000
const cacheGa4 = new Map<string, { expira: number; datos: Promise<Ga4DashboardPayload> }>()

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
    // El rango va en la clave: «mes» cambia de fechas al cambiar el mes.
    const clave = `${periodo}|${startDate}|${endDate}`

    let entrada = cacheGa4.get(clave)
    if (!entrada || entrada.expira < Date.now()) {
      if (!clienteGa4) {
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
        clienteGa4 = ga4Client.client
      }
      entrada = {
        expira: Date.now() + CACHE_MS,
        datos: fetchGa4Dashboard(clienteGa4, prop.property, startDate, endDate, periodo, propertyIdNumeric),
      }
      cacheGa4.set(clave, entrada)
    }

    let data: Ga4DashboardPayload
    try {
      data = await entrada.datos
    } catch (e) {
      // No se guarda el error, y se arma un cliente nuevo la próxima vez por
      // si el problema era la credencial.
      if (cacheGa4.get(clave) === entrada) cacheGa4.delete(clave)
      clienteGa4 = null
      throw e
    }

    return NextResponse.json(data, { headers: { 'Cache-Control': 'private, max-age=300' } })
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
