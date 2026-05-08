import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'

function sanitizeText(s: string, maxLen: number): string {
  const clipped = s.slice(0, maxLen)
  return DOMPurify.sanitize(clipped, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a', 'h2', 'h3'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  })
}

const jsonContenido = z
  .unknown()
  .refine((v) => JSON.stringify(v ?? null).length < 600_000, 'contenido demasiado grande')

export const blogPostCreateSchema = z.object({
  titulo: z.string().min(1).max(500).transform((s) => sanitizeText(s, 500)),
  slug: z.string().min(1).max(200).transform((s) => s.trim()),
  descripcion: z.string().min(1).max(100_000).transform((s) => sanitizeText(s, 100_000)),
  contenido: jsonContenido,
  categoria: z.string().min(1).max(120).transform((s) => sanitizeText(s, 120)),
  tags: z.array(z.string().max(80)).max(40).optional().default([]),
  autor: z.string().max(200).optional().nullable(),
  lectura: z.string().max(40).optional().nullable(),
  imagenHero: z.string().max(2000).optional().nullable(),
  imagenAlt: z.string().max(500).optional().nullable(),
  metaTitle: z.string().max(500).optional().nullable(),
  metaDescription: z.string().max(20_000).optional().nullable(),
  keywords: z.array(z.string().max(80)).max(50).optional().default([]),
  canonical: z.string().max(2000).optional().nullable(),
  publicado: z.boolean().optional(),
  destacado: z.boolean().optional(),
  fechaPublicacion: z.coerce.date().optional(),
})

export const blogPostUpdateSchema = blogPostCreateSchema.partial()

