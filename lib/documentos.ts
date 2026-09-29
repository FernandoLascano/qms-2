import type { Prisma, TipoDocumento } from '@prisma/client'

// Documentos que QMS le manda al cliente (el borrador y los papeles para firmar).
// Los revisa el CLIENTE, no el admin: nunca tienen que caer en la bandeja de
// "documentos por aprobar" ni contarse como pendientes del lado nuestro.
export const TIPOS_DOCUMENTO_DE_QMS: TipoDocumento[] = [
  'BORRADOR',
  'ESTATUTO_PARA_FIRMAR',
  'ACTA_PARA_FIRMAR',
  'DOCUMENTO_PARA_FIRMAR',
]

export function esDocumentoDeQMS(tipo: string | null | undefined): boolean {
  return TIPOS_DOCUMENTO_DE_QMS.includes(tipo as TipoDocumento)
}

// Filtro Prisma de los documentos que el admin realmente tiene que aprobar.
// El OR con `tipo: null` es necesario porque `notIn` deja afuera los NULL.
export const WHERE_DOCUMENTOS_POR_APROBAR: Prisma.DocumentoWhereInput = {
  estado: 'PENDIENTE',
  OR: [{ tipo: null }, { tipo: { notIn: TIPOS_DOCUMENTO_DE_QMS } }],
}
