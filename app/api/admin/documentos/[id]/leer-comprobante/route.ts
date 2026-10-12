import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { downloadFromSupabase, extractDocumentsObjectPath } from '@/lib/supabase-storage'
import { NOMBRES_CONCEPTO } from '@/lib/etiquetas'
import { adminConIA, respuestaErrorIA } from '@/lib/ai/rutas'
import {
  comprobanteLegiblePorIA,
  controlarComprobante,
  leerComprobante,
  type PagoEsperado,
} from '@/lib/ai/tramite'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

interface RouteParams {
  params: Promise<{ id: string }>
}

/** Qué pago se esperaba cobrar con este comprobante, según cómo lo subió el cliente. */
async function pagoEsperado(documento: { id: string; tramiteId: string; nombre: string }): Promise<PagoEsperado | null> {
  // Honorarios por transferencia: el pago apunta al comprobante.
  const pago = await prisma.pago.findFirst({ where: { comprobanteTransferenciaId: documento.id } })
  if (pago) {
    const cuenta = (pago.datosBancarios ?? {}) as { cbu?: string; alias?: string; titular?: string }
    return {
      concepto: NOMBRES_CONCEPTO[pago.concepto] ?? pago.concepto,
      monto: pago.montoTransferencia ?? pago.monto,
      cbu: cuenta.cbu,
      alias: cuenta.alias,
      titular: cuenta.titular,
    }
  }

  // El resto se sube como «Comprobante - CONCEPTO».
  const concepto = documento.nombre.match(/Comprobante - (.+)$/)?.[1]?.trim()
  if (!concepto) return null

  if (concepto === 'DEPOSITO_CAPITAL') {
    const cuenta = await prisma.cuentaBancaria.findFirst({
      where: { tramiteId: documento.tramiteId, tipo: 'DEPOSITO_CAPITAL' },
    })
    if (!cuenta) return { concepto: NOMBRES_CONCEPTO.DEPOSITO_CAPITAL, monto: null }
    return {
      concepto: NOMBRES_CONCEPTO.DEPOSITO_CAPITAL,
      monto: cuenta.montoEsperado,
      cbu: cuenta.cbu,
      alias: cuenta.alias,
      titular: cuenta.titular,
    }
  }

  // Tasas: se pagan por un enlace externo, así que sólo se puede controlar el monto.
  const enlace = await prisma.enlacePago.findFirst({
    where: { tramiteId: documento.tramiteId, concepto },
    orderBy: { createdAt: 'desc' },
  })
  return enlace ? { concepto: NOMBRES_CONCEPTO[concepto] ?? concepto, monto: enlace.monto } : null
}

// Lee un comprobante con IA y lo compara con el pago esperado. No aprueba nada.
export async function POST(request: Request, { params }: RouteParams) {
  const acceso = await adminConIA(request)
  if (acceso.error) return acceso.error

  const { id } = await params

  try {
    const documento = await prisma.documento.findUnique({
      where: { id },
      select: { id: true, tramiteId: true, nombre: true, url: true, mimeType: true },
    })
    if (!documento) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })

    if (!comprobanteLegiblePorIA(documento.mimeType)) {
      return NextResponse.json(
        { error: 'La IA sólo lee PDF, JPG, PNG y WEBP. Este archivo hay que revisarlo a mano.' },
        { status: 415 },
      )
    }

    const ubicacion = extractDocumentsObjectPath(documento.url)
    const archivo = ubicacion ? await downloadFromSupabase(ubicacion.path, ubicacion.bucket) : null
    if (!archivo) {
      return NextResponse.json({ error: 'No se pudo abrir el archivo del comprobante.' }, { status: 502 })
    }

    const [lectura, esperado] = await Promise.all([
      leerComprobante({ buffer: archivo.buffer, mimeType: documento.mimeType }),
      pagoEsperado(documento),
    ])

    return NextResponse.json({ lectura, esperado, control: controlarComprobante(lectura, esperado) })
  } catch (error) {
    return respuestaErrorIA(error, `documentos/${id}/leer-comprobante`)
  }
}
