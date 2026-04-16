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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Imagen principal
        </label>
        <p className="text-sm text-gray-500 mb-3">
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
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-brand-200 bg-brand-50 text-brand-900 font-medium hover:bg-brand-100 transition disabled:opacity-60 cursor-pointer"
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
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="relative w-full max-h-64 overflow-hidden rounded-lg bg-white">
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
          <p className="mt-2 text-xs text-gray-500 break-all">{imagenHero}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-12 text-gray-500">
          <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
          <span className="text-sm">Sin imagen todavía</span>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          URL de la imagen <span className="text-gray-500 font-normal">(opcional si subís un archivo)</span>
        </label>
        <input
          type="url"
          name="imagenHero"
          value={imagenHero}
          onChange={(e) => onImagenHeroChange(e.target.value)}
          placeholder="https://…"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Alt text (SEO)</label>
        <input
          type="text"
          name="imagenAlt"
          value={imagenAlt}
          onChange={(e) => onImagenAltChange(e.target.value)}
          placeholder="Descripción de la imagen para SEO"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
      </div>
    </div>
  )
}
