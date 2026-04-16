/**
 * El blog público renderiza `text` o `content` por sección.
 * El editor admin solo usaba `text`, por eso notas guardadas con `content` (p. ej. IA) se veían vacías al editar.
 */

export type BlogSectionType = 'h2' | 'p' | 'list' | 'quote'

export interface BlogSection {
  type: BlogSectionType
  text?: string
  items?: string[]
}

const VALID_TYPES = new Set<string>(['h2', 'p', 'list', 'quote'])

function mergeTextContent(rec: Record<string, unknown>): string {
  const t = typeof rec.text === 'string' ? rec.text : ''
  const c = typeof rec.content === 'string' ? rec.content : ''
  return t.length > 0 ? t : c
}

function extractSectionArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  if (raw && typeof raw === 'object' && 'sections' in raw) {
    const sec = (raw as { sections: unknown }).sections
    if (Array.isArray(sec)) return sec
  }
  return []
}

/** Devuelve secciones listas para el editor: siempre `text` en h2/p/quote; `items` en list. */
export function normalizeBlogSectionsForEditor(raw: unknown): BlogSection[] {
  const rawArr = extractSectionArray(raw)
  if (rawArr.length === 0) {
    return [{ type: 'h2', text: '' }]
  }

  return rawArr.map((item): BlogSection => {
    const rec = item as Record<string, unknown>
    const rawType = typeof rec.type === 'string' ? rec.type : 'p'
    const type: BlogSectionType = VALID_TYPES.has(rawType)
      ? (rawType as BlogSectionType)
      : 'p'

    if (type === 'list') {
      const rawItems = rec.items
      const items = Array.isArray(rawItems)
        ? rawItems.map((x) => (typeof x === 'string' ? x : String(x ?? '')))
        : []
      return { type: 'list', items: items.length > 0 ? items : [''] }
    }

    return { type, text: mergeTextContent(rec) }
  })
}

/** Texto mostrado en el editor (por si queda `content` sin normalizar). */
export function sectionEditorText(section: {
  text?: string
  content?: string
}): string {
  const t = section.text ?? ''
  const c = section.content ?? ''
  return t.length > 0 ? t : c
}
