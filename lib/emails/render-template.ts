// Reemplaza {{variable}} por su valor en un string. Las variables faltantes
// se reemplazan por vacío (nunca deja "{{algo}}" a la vista del cliente).
export function interpolar(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    const value = data[key]
    if (value === undefined || value === null) return ''
    return String(value)
  })
}
