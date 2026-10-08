// Algunas notificaciones llevan datos para la app al principio del mensaje,
// en un bloque "__METADATA__{…json…}__END__" (por ejemplo, la cuenta para el
// depósito del capital, que arma api/admin/tramites/[id]/cuenta-capital).
// Ese bloque no es para leer: esta función devuelve sólo el texto visible.
export function mensajeVisible(mensaje: string | null | undefined): string {
  return String(mensaje ?? '')
    .replace(/__METADATA__[\s\S]*?__END(__)?\s*/g, '')
    .trim()
}
