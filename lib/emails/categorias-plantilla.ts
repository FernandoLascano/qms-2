// Categorías de las plantillas de email. Módulo puro (lo usan la lista, el
// alta y la edición de plantillas).
//
// Las plantillas del sistema (los mails automáticos) se guardaron con la
// categoría «transaccional», que no estaba en la lista del selector: la
// pantalla de edición mostraba «general» y, al guardar, la pisaba.

export const CATEGORIAS_PLANTILLA = [
  { valor: 'general', label: 'General' },
  { valor: 'tramite', label: 'Trámite' },
  { valor: 'pago', label: 'Pago' },
  { valor: 'notificacion', label: 'Notificación' },
] as const

/** Categoría de las plantillas de los mails automáticos (isSystem). */
export const CATEGORIA_SISTEMA = 'transaccional'

/** Etiqueta para mostrar. Una plantilla del sistema dice «Sistema (automático)». */
export function etiquetaCategoria(categoria: string | null | undefined, isSystem = false): string {
  if (isSystem || categoria === CATEGORIA_SISTEMA) return 'Sistema (automático)'
  const conocida = CATEGORIAS_PLANTILLA.find((c) => c.valor === categoria)
  if (conocida) return conocida.label
  return categoria ? categoria[0].toUpperCase() + categoria.slice(1) : 'General'
}
