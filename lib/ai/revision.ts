/**
 * Revisión del formulario de un trámite: la hace la IA cuando el cliente lo
 * envía y queda guardada, para que el admin encuentre la recomendación hecha
 * al entrar a validarlo.
 */
import { prisma } from '@/lib/prisma'
import { ErrorIA } from './anthropic'
import { revisarFormulario, type RevisionFormulario } from './tramite'

export interface RevisionGuardada extends RevisionFormulario {
  /** Cuándo se revisó (ISO). */
  revisadoEn: string
}

/** Revisa el formulario y deja el resultado guardado. No valida ni pide nada. */
export async function revisarYGuardarFormulario(tramiteId: string): Promise<RevisionGuardada> {
  const tramite = await prisma.tramite.findUnique({ where: { id: tramiteId } })
  if (!tramite) throw new ErrorIA('Trámite no encontrado', 404)

  const revision: RevisionGuardada = {
    ...(await revisarFormulario(tramite)),
    revisadoEn: new Date().toISOString(),
  }
  await prisma.tramite.update({
    where: { id: tramiteId },
    data: { revisionIA: JSON.parse(JSON.stringify(revision)) },
  })
  return revision
}

/** Para correr en segundo plano cuando llega un formulario. Sin clave no hace nada. */
export async function revisarFormularioAlEnviar(tramiteId: string): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) return
  await revisarYGuardarFormulario(tramiteId)
}
