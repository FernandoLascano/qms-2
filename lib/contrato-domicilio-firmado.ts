/**
 * Contrato de domicilio firmado: estado de cada domicilio respecto del
 * contrato (lo comparten la API, la pantalla de Domicilios y la ficha).
 *
 * - FIRMADO: hay un PDF firmado cargado (el vigente es el último subido).
 * - GENERADO: se generó al menos una versión (ContratoDomicilioVersion) pero
 *   todavía no se subió el firmado.
 * - SIN_CONTRATO: ni generado ni firmado.
 */

export type EstadoContrato = 'FIRMADO' | 'GENERADO' | 'SIN_CONTRATO'

export const ETIQUETA_ESTADO_CONTRATO: Record<EstadoContrato, string> = {
  FIRMADO: 'Firmado',
  GENERADO: 'Generado sin firmar',
  SIN_CONTRATO: 'Sin contrato',
}

/** Sólo PDF, hasta 15 MB (el mismo tope que el resto de los documentos). */
export const MAX_BYTES_CONTRATO_FIRMADO = 15 * 1024 * 1024

export type ContratoFirmadoInfo = {
  id: string
  fechaFirma: string
  nombreArchivo: string
  tamanio: number
  cargadoPor: string | null
  createdAt: string
  /** Número de la versión generada a la que corresponde, si se indicó. */
  version: number | null
}

export type ResumenContrato = {
  estado: EstadoContrato
  firmado: ContratoFirmadoInfo | null
  ultimaVersion: { version: number; fecha: string } | null
}

export function estadoContrato(firmado: unknown, ultimaVersion: unknown): EstadoContrato {
  if (firmado) return 'FIRMADO'
  if (ultimaVersion) return 'GENERADO'
  return 'SIN_CONTRATO'
}

type FilaFirmado = {
  id: string
  fechaFirma: Date
  nombreArchivo: string
  tamanio: number
  cargadoPor: string | null
  createdAt: Date
  contratoVersion?: { version: number } | null
}

/** Fila de la base → lo que viaja al cliente. */
export function serializarFirmado(f: FilaFirmado): ContratoFirmadoInfo {
  return {
    id: f.id,
    fechaFirma: f.fechaFirma.toISOString(),
    nombreArchivo: f.nombreArchivo,
    tamanio: f.tamanio,
    cargadoPor: f.cargadoPor,
    createdAt: f.createdAt.toISOString(),
    version: f.contratoVersion?.version ?? null,
  }
}

/** URL que redirige al PDF firmado (URL firmada temporal de Storage). */
export function urlContratoFirmado(tramiteId: string, firmadoId: string, descargar = false) {
  return `/api/admin/tramites/${tramiteId}/contrato-domicilio/firmado/${firmadoId}${descargar ? '?download=1' : ''}`
}
