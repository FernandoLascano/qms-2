import { NextResponse } from 'next/server'
import { adminConIA, respuestaErrorIA } from '@/lib/ai/rutas'
import { leerYGuardarComprobante } from '@/lib/ai/comprobante'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

interface RouteParams {
  params: Promise<{ id: string }>
}

// Vuelve a leer un comprobante con IA y lo compara con el pago esperado. No
// aprueba nada. La primera lectura corre sola cuando el cliente lo sube.
export async function POST(request: Request, { params }: RouteParams) {
  const acceso = await adminConIA(request)
  if (acceso.error) return acceso.error

  const { id } = await params

  try {
    return NextResponse.json(await leerYGuardarComprobante(id))
  } catch (error) {
    return respuestaErrorIA(error, `documentos/${id}/leer-comprobante`)
  }
}
