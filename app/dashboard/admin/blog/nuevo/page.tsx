'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Save, Eye, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Section {
  type: 'h2' | 'p' | 'list' | 'quote'
  text?: string
  items?: string[]
}

export default function NuevoPostPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    titulo: '',
    slug: '',
    descripcion: '',
    categoria: 'Emprendimiento',
    tags: [] as string[],
    autor: '',
    lectura: '5 min',
    imagenHero: '',
    imagenAlt: '',
    metaTitle: '',
    metaDescription: '',
    keywords: [] as string[],
    publicado: false,
    destacado: false
  })

  const [sections, setSections] = useState<Section[]>([
    { type: 'h2', text: '' }
  ])

  const [newTag, setNewTag] = useState('')
  const [newKeyword, setNewKeyword] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))

      // Auto-generar slug del título
      if (name === 'titulo') {
        const slug = value
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-')
        setFormData(prev => ({ ...prev, slug }))
      }
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }))
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))
  }

  const addKeyword = () => {
    if (newKeyword.trim() && !formData.keywords.includes(newKeyword.trim())) {
      setFormData(prev => ({ ...prev, keywords: [...prev.keywords, newKeyword.trim()] }))
      setNewKeyword('')
    }
  }

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({ ...prev, keywords: prev.keywords.filter(k => k !== keyword) }))
  }

  const addSection = (type: Section['type']) => {
    setSections(prev => [...prev, { type, text: '', items: type === 'list' ? [''] : undefined }])
  }

  const updateSection = (index: number, updates: Partial<Section>) => {
    setSections(prev => prev.map((section, i) =>
      i === index ? { ...section, ...updates } : section
    ))
  }

  const removeSection = (index: number) => {
    setSections(prev => prev.filter((_, i) => i !== index))
  }

  const addListItem = (sectionIndex: number) => {
    setSections(prev => prev.map((section, i) => {
      if (i === sectionIndex && section.type === 'list') {
        return { ...section, items: [...(section.items || []), ''] }
      }
      return section
    }))
  }

  const updateListItem = (sectionIndex: number, itemIndex: number, value: string) => {
    setSections(prev => prev.map((section, i) => {
      if (i === sectionIndex && section.type === 'list' && section.items) {
        const newItems = [...section.items]
        newItems[itemIndex] = value
        return { ...section, items: newItems }
      }
      return section
    }))
  }

  const removeListItem = (sectionIndex: number, itemIndex: number) => {
    setSections(prev => prev.map((section, i) => {
      if (i === sectionIndex && section.type === 'list' && section.items) {
        return { ...section, items: section.items.filter((_, idx) => idx !== itemIndex) }
      }
      return section
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.titulo || !formData.slug || !formData.descripcion) {
      toast.error('Completa los campos obligatorios')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          contenido: sections
        })
      })

      if (res.ok) {
        toast.success('Post creado exitosamente')
        router.push('/dashboard/admin/blog')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Error al crear post')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al crear post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/admin/blog"
            className="p-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-red-900">Crear Nueva Nota</h1>
            <p className="text-gray-600 mt-1">Completa todos los campos para optimizar el SEO</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Información Básica</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título * <span className="text-gray-500 font-normal">(se auto-genera el slug)</span>
              </label>
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug (URL) *
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
              <p className="text-sm text-gray-500 mt-1">URL: /blog/{formData.slug}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción/Resumen *
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="Emprendimiento">Emprendimiento</option>
                  <option value="Guías">Guías</option>
                  <option value="Costos">Costos</option>
                  <option value="Comparativas">Comparativas</option>
                  <option value="Legal">Legal</option>
                  <option value="Noticias">Noticias</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Autor</label>
                <input
                  type="text"
                  name="autor"
                  value={formData.autor}
                  onChange={handleInputChange}
                  placeholder="QuieroMiSAS"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo de lectura</label>
                <input
                  type="text"
                  name="lectura"
                  value={formData.lectura}
                  onChange={handleInputChange}
                  placeholder="5 min"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Imágenes */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Imágenes</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL Imagen Principal</label>
              <input
                type="text"
                name="imagenHero"
                value={formData.imagenHero}
                onChange={handleInputChange}
                placeholder="/assets/img/nota.png"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alt Text (SEO)</label>
              <input
                type="text"
                name="imagenAlt"
                value={formData.imagenAlt}
                onChange={handleInputChange}
                placeholder="Descripción de la imagen para SEO"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Tags y Etiquetas</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Agregar tag..."
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm flex items-center gap-2"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-900 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SEO Avanzado */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">SEO Avanzado</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Title <span className="text-gray-500 font-normal">(si es diferente del título)</span>
              </label>
              <input
                type="text"
                name="metaTitle"
                value={formData.metaTitle}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
              <textarea
                name="metaDescription"
                value={formData.metaDescription}
                onChange={handleInputChange}
                rows={2}
                placeholder="Descripción para Google (150-160 caracteres)"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.metaDescription.length}/160 caracteres
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Keywords SEO</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  placeholder="Agregar keyword..."
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addKeyword}
                  className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeKeyword(keyword)}
                      className="hover:text-blue-900 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Contenido (Secciones) */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Contenido del Artículo</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => addSection('h2')}
                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition text-sm cursor-pointer"
              >
                + Título
              </button>
              <button
                type="button"
                onClick={() => addSection('p')}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm cursor-pointer"
              >
                + Párrafo
              </button>
              <button
                type="button"
                onClick={() => addSection('list')}
                className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-sm cursor-pointer"
              >
                + Lista
              </button>
              <button
                type="button"
                onClick={() => addSection('quote')}
                className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition text-sm cursor-pointer"
              >
                + Cita
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {sections.map((section, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    {section.type === 'h2' && 'Subtítulo'}
                    {section.type === 'p' && 'Párrafo'}
                    {section.type === 'list' && 'Lista'}
                    {section.type === 'quote' && 'Cita'}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSection(index)}
                    className="text-red-600 hover:text-red-800 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {section.type === 'list' ? (
                  <div className="space-y-2">
                    {section.items?.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex gap-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => updateListItem(index, itemIndex, e.target.value)}
                          placeholder={`Item ${itemIndex + 1}`}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => removeListItem(index, itemIndex)}
                          className="px-2 text-red-600 hover:text-red-800 cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addListItem(index)}
                      className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      + Agregar item
                    </button>
                  </div>
                ) : (
                  <textarea
                    value={section.text || ''}
                    onChange={(e) => updateSection(index, { text: e.target.value })}
                    rows={section.type === 'h2' ? 1 : 3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Opciones de Publicación */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Opciones de Publicación</h2>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="publicado"
                checked={formData.publicado}
                onChange={handleInputChange}
                className="w-5 h-5 text-red-700 border-gray-300 rounded focus:ring-red-500"
              />
              <span className="text-gray-700">Publicar inmediatamente</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="destacado"
                checked={formData.destacado}
                onChange={handleInputChange}
                className="w-5 h-5 text-purple-700 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-gray-700">Marcar como destacado (aparece en home)</span>
            </label>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center justify-end gap-4 sticky bottom-0 bg-white p-4 rounded-xl shadow-lg border border-gray-200">
          <Link
            href="/dashboard/admin/blog"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition cursor-pointer"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-red-700 text-white rounded-lg hover:bg-red-800 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Guardando...' : 'Guardar Nota'}
          </button>
        </div>
      </form>
    </div>
  )
}
