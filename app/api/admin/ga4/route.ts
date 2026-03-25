import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createGa4DataClient, getGa4PropertyResource } from '@/lib/ga4/client'
import { ga4DateRange } from '@/lib/ga4/date-range'
import { fetchGa4Dashboard } from '@/lib/ga4/fetch-dashboard'

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
      return NextResponse.json(
        {
          error: 'GA4 no configurado',
          mensaje: ga4Client.error,
        },
        { status: 503 }
      )
    }

    const prop = getGa4PropertyResource()
    if (!prop.ok) {
      return NextResponse.json({ error: prop.error }, { status: 500 })
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
    return NextResponse.json(
      {
        error: 'Error al consultar Google Analytics',
        mensaje: message,
      },
      { status: 502 }
    )
  }
}
