'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { ImageIcon, Loader2, Upload } from 'lucide-react'

interface BlogHeroImageFieldProps {
  imagenHero: string
  imagenAlt: string
  onImagenHeroChange: (url: string) => void
  onImagenAltChange: (alt: string) => void
}

export function BlogHeroImageField({
  imagenHero,
  imagenAlt,
  onImagenHeroChange,
  onImagenAltChange,
}: BlogHeroImageFieldProps) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/blog/upload-hero', {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error al subir la imagen')
      }
      onImagenHeroChange(data.url)
      toast.success('Imagen subida correctamente')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al subir la imagen')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-body-sm font-medium text-ink-2 mb-2">
          Imagen principal
        </label>
        <p className="text-body-sm text-ink-2 mb-3">
          Subí un archivo desde tu equipo o pegá una URL pública. La vista previa usa la URL guardada.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              void handleFile(f)
              e.target.value = ''
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-control border border-primary-line bg-primary-soft text-primary font-medium hover:bg-primary-soft transition disabled:opacity-60 cursor-pointer"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {uploading ? 'Subiendo…' : 'Subir imagen'}
          </button>
        </div>
      </div>

      {imagenHero ? (
        <div className="rounded-control border border-line bg-surface-2 p-4">
          <div className="relative w-full max-h-64 overflow-hidden rounded-control bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagenHero}
              alt={imagenAlt || 'Vista previa'}
              className="w-full max-h-64 object-contain"
              onError={() => {
                toast.error('No se pudo cargar la imagen. Revisá la URL o subí el archivo de nuevo.')
              }}
            />
          </div>
          <p className="mt-2 text-label text-ink-2 break-all">{imagenHero}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-control border-2 border-dashed border-line bg-surface-2 py-12 text-ink-2">
          <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
          <span className="text-body-sm">Sin imagen todavía</span>
        </div>
      )}

      <div>
        <label className="block text-body-sm font-medium text-ink-2 mb-1">
          URL de la imagen <span className="text-ink-2 font-normal">(opcional si subís un archivo)</span>
        </label>
        <input
          type="url"
          name="imagenHero"
          value={imagenHero}
          onChange={(e) => onImagenHeroChange(e.target.value)}
          placeholder="https://…"
          className="w-full border border-line-strong rounded-control px-4 py-2 text-ink placeholder:text-ink-3 focus:ring-2 focus:ring-ring focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-body-sm font-medium text-ink-2 mb-1">Alt text (SEO)</label>
        <input
          type="text"
          name="imagenAlt"
          value={imagenAlt}
          onChange={(e) => onImagenAltChange(e.target.value)}
          placeholder="Descripción de la imagen para SEO"
          className="w-full border border-line-strong rounded-control px-4 py-2 text-ink placeholder:text-ink-3 focus:ring-2 focus:ring-ring focus:border-transparent"
        />
      </div>
    </div>
  )
}
