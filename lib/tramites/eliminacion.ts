/**
 * Cuándo se puede borrar un trámite. Regla única: la usan la API
 * (`DELETE /api/admin/tramites/[id]/eliminar`) y la interfaz para decidir si
 * muestra el tacho, así no vuelven a divergir.
 *
 * Antes la protección era una lista de tres nombres escritos a mano, distinta
 * en el cliente y en el servidor («DRIX SAS» contra «Drixs SAS»), y cualquier
 * otra sociedad inscripta se borraba con un clic, con documentos y pagos.
 *
 * No se puede borrar:
 *   - una sociedad inscripta o un trámite marcado como completado: es un
 *     cliente real, con su documentación y su cartera de servicios;
 *   - un trámite con plata cobrada (pagos aprobados o enlaces pagados): esos
 *     cobros son la base de la liquidación de comisiones y borrarlos cambia
 *     números ya informados.
 * Lo demás (borradores, pruebas, trámites sin cobros) se sigue pudiendo borrar.
 *
 * Módulo puro, sin Prisma: sirve en el servidor y en componentes de cliente.
 */

export interface DatosEliminacion {
  sociedadInscripta?: boolean | null
  estadoGeneral?: string | null
  /** Pagos con estado APROBADO. */
  pagosAprobados?: number
  /** Enlaces de pago con estado PAGADO. */
  enlacesPagados?: number
}

/** Filtros de Prisma para contar los cobros que bloquean el borrado. */
export const WHERE_PAGOS_APROBADOS = { estado: 'APROBADO' } as const
export const WHERE_ENLACES_PAGADOS = { estado: 'PAGADO' } as const

/** Motivo por el que el trámite no se puede borrar, o null si se puede. */
export function motivoNoEliminable(t: DatosEliminacion): string | null {
  if (t.sociedadInscripta || t.estadoGeneral === 'COMPLETADO') {
    return 'La sociedad ya está inscripta: no se puede eliminar.'
  }
  if ((t.pagosAprobados ?? 0) > 0 || (t.enlacesPagados ?? 0) > 0) {
    return 'El trámite tiene pagos cobrados: no se puede eliminar.'
  }
  return null
}

export const puedeEliminarse = (t: DatosEliminacion) => motivoNoEliminable(t) === null

export interface TramiteDeUsuario {
  denominacionAprobada?: string | null
  denominacionSocial1?: string | null
  sociedadInscripta?: boolean | null
  estadoGeneral?: string | null
  _count: { pagos: number; enlacesPago: number }
}

/**
 * Motivo por el que un usuario no se puede borrar (borrarlo borra sus
 * trámites), o null si se puede. La usan el DELETE de usuarios y el listado,
 * para deshabilitar el botón con el mismo texto que devolvería el servidor.
 */
export function motivoUsuarioNoEliminable(tramites: TramiteDeUsuario[]): string | null {
  const bloqueados = tramites.filter((t) =>
    motivoNoEliminable({
      sociedadInscripta: t.sociedadInscripta,
      estadoGeneral: t.estadoGeneral,
      pagosAprobados: t._count.pagos,
      enlacesPagados: t._count.enlacesPago,
    }),
  )
  if (bloqueados.length === 0) return null
  const nombres = bloqueados
    .map((t) => t.denominacionAprobada || t.denominacionSocial1 || 'sin nombre')
    .join(', ')
  return `No se puede eliminar: tiene trámites inscriptos o con pagos cobrados (${nombres}).`
}
