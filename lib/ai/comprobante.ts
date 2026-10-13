/**
 * Lectura de un comprobante de pago ya subido: abre el archivo, lo lee con IA,
 * lo compara con el pago que se esperaba y guarda el resultado en el documento
 * para que el admin lo encuentre hecho al entrar.
 */
import { prisma } from '@/lib/prisma'
import { downloadFromSupabase, extractDocumentsObjectPath } from '@/lib/supabase-storage'
import { NOMBRES_CONCEPTO } from '@/lib/etiquetas'
import { esComprobanteDePago } from '@/lib/documentos'
import { ErrorIA } from './anthropic'
import {
  comprobanteLegiblePorIA,
  controlarComprobante,
  leerComprobante,
  type ControlComprobante,
  type LecturaComprobante,
  type PagoEsperado,
} from './tramite'

export interface LecturaGuardada {
  lectura: LecturaComprobante
  esperado: PagoEsperado | null
  control: ControlComprobante
  /** Cuándo se leyó (ISO). */
  leidoEn: string
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

/** Lee el comprobante, lo controla y deja el resultado guardado. No aprueba nada. */
export async function leerYGuardarComprobante(documentoId: string): Promise<LecturaGuardada> {
  const documento = await prisma.documento.findUnique({
    where: { id: documentoId },
    select: { id: true, tramiteId: true, nombre: true, url: true, mimeType: true },
  })
  if (!documento) throw new ErrorIA('Documento no encontrado', 404)

  if (!comprobanteLegiblePorIA(documento.mimeType)) {
    throw new ErrorIA('La IA sólo lee PDF, JPG, PNG y WEBP. Este archivo hay que revisarlo a mano.', 415)
  }

  const ubicacion = extractDocumentsObjectPath(documento.url)
  const archivo = ubicacion ? await downloadFromSupabase(ubicacion.path, ubicacion.bucket) : null
  if (!archivo) throw new ErrorIA('No se pudo abrir el archivo del comprobante.')

  const [lectura, esperado] = await Promise.all([
    leerComprobante({ buffer: archivo.buffer, mimeType: documento.mimeType }),
    pagoEsperado(documento),
  ])

  const resultado: LecturaGuardada = {
    lectura,
    esperado,
    control: controlarComprobante(lectura, esperado),
    leidoEn: new Date().toISOString(),
  }
  await prisma.documento.update({
    where: { id: documento.id },
    data: { lecturaIA: JSON.parse(JSON.stringify(resultado)) },
  })
  return resultado
}

/**
 * Para correr en segundo plano cuando el cliente sube un comprobante. Si el
 * archivo no es legible o falta la clave, no hace nada: el admin lo revisa a
 * mano como siempre.
 */
export async function leerComprobanteAlSubir(doc: {
  id: string
  tipo?: string | null
  nombre?: string | null
  mimeType: string
}): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) return
  if (!esComprobanteDePago(doc) || !comprobanteLegiblePorIA(doc.mimeType)) return
  await leerYGuardarComprobante(doc.id)
}
