'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Save, Eye, Plus, Trash2, Sparkles, Wand2, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface Section {
  type: 'h2' | 'p' | 'list' | 'quote'
  text?: string
  items?: string[]
}

export default function EditarPostPage() {
  const router = useRouter()
  const params = useParams()
  const postId = params?.id as string

  const [loading, setLoading] = useState(false)
  const [loadingPost, setLoadingPost] = useState(true)
  const [generandoIA, setGenerandoIA] = useState(false)
  const [promptIA, setPromptIA] = useState('')
  const [mostrarModalIA, setMostrarModalIA] = useState(false)
  const [mostrarPreview, setMostrarPreview] = useState(false)

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

  // Cargar el post existente
  useEffect(() => {
    if (postId) {
      fetchPost()
    }
  }, [postId])

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/blog/${postId}`)
      if (!res.ok) throw new Error('Error al cargar post')

      const post = await res.json()

      setFormData({
        titulo: post.titulo || '',
        slug: post.slug || '',
        descripcion: post.descripcion || '',
        categoria: post.categoria || 'Emprendimiento',
        tags: post.tags || [],
        autor: post.autor || '',
        lectura: post.lectura || '5 min',
        imagenHero: post.imagenHero || '',
        imagenAlt: post.imagenAlt || '',
        metaTitle: post.metaTitle || '',
        metaDescription: post.metaDescription || '',
        keywords: post.keywords || [],
        publicado: post.publicado || false,
        destacado: post.destacado || false
      })

      // Cargar el contenido
      if (post.contenido) {
        if (Array.isArray(post.contenido)) {
          setSections(post.contenido)
        } else if (post.contenido.sections) {
          setSections(post.contenido.sections)
        }
      }

      setLoadingPost(false)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar el post')
      router.push('/dashboard/admin/blog')
    }
  }

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

  const generarArticuloCompleto = async () => {
    if (!promptIA.trim()) {
      toast.error('Escribe un tema o prompt para generar el artículo')
      return
    }

    setGenerandoIA(true)
    toast.loading('Generando artículo con IA... esto puede tardar 30-60 segundos')

    try {
      const res = await fetch('/api/blog/generar-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptIA,
          tipo: 'articulo-completo'
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al generar artículo')
      }

      // Rellenar el formulario con los datos generados
      setFormData(prev => ({
        ...prev,
        titulo: data.titulo || '',
        slug: data.titulo ? data.titulo
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-') : '',
        descripcion: data.descripcion || '',
        categoria: data.categoria || 'Guías',
        tags: data.tags || [],
        keywords: data.keywords || [],
        imagenAlt: data.imagenAlt || '',
        metaDescription: data.metaDescription || '',
        lectura: data.lectura || '5 min'
      }))

      // Rellenar el contenido
      if (data.contenido && Array.isArray(data.contenido)) {
        setSections(data.contenido)
      }

      toast.dismiss()
      toast.success('¡Artículo generado exitosamente!')
      setMostrarModalIA(false)
      setPromptIA('')
    } catch (error: any) {
      console.error('Error:', error)
      toast.dismiss()
      toast.error(error.message || 'Error al generar artículo con IA')
    } finally {
      setGenerandoIA(false)
    }
  }

  const generarDescripcionConIA = async () => {
    if (!formData.titulo) {
      toast.error('Primero escribe un título para generar la descripción')
      return
    }

    setGenerandoIA(true)
    toast.loading('Generando metadatos con IA...')

    try {
      const contenidoTexto = sections
        .map(s => s.text || s.items?.join(', ') || '')
        .join(' ')
        .substring(0, 500)

      const res = await fetch('/api/blog/generar-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Título: ${formData.titulo}\n\nContenido: ${contenidoTexto}`,
          tipo: 'generar-descripcion'
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al generar descripción')
      }

      setFormData(prev => ({
        ...prev,
        descripcion: data.descripcion || prev.descripcion,
        metaDescription: data.metaDescription || prev.metaDescription,
        tags: data.tags || prev.tags,
        keywords: data.keywords || prev.keywords,
        imagenAlt: data.imagenAlt || prev.imagenAlt
      }))

      toast.dismiss()
      toast.success('Metadatos generados con IA')
    } catch (error: any) {
      console.error('Error:', error)
      toast.dismiss()
      toast.error(error.message || 'Error al generar metadatos')
    } finally {
      setGenerandoIA(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.titulo || !formData.slug || !formData.descripcion) {
      toast.error('Completa los campos obligatorios')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/blog/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          contenido: sections
        })
      })

      if (res.ok) {
        toast.success('Post actualizado exitosamente')
        router.push('/dashboard/admin/blog')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Error al actualizar post')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar post')
    } finally {
      setLoading(false)
    }
  }

  if (loadingPost) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700 mx-auto"></div>
          <p className="text-gray-600 mt-4">Cargando post...</p>
        </div>
      </div>
    )
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
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-red-900">Editar Nota</h1>
            <p className="text-gray-600 mt-1">Modifica los campos que necesites</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMostrarModalIA(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition shadow-lg cursor-pointer"
        >
          <Sparkles className="w-5 h-5" />
          Generar con IA
        </button>
      </div>

      {/* Modal de IA */}
      {mostrarModalIA && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              Generar Artículo con IA
            </h2>
            <p className="text-gray-600 mb-6">
              Describe el tema sobre el que quieres escribir y la IA generará un artículo completo con contenido, metadatos y SEO optimizado.
            </p>
            <textarea
              value={promptIA}
              onChange={(e) => setPromptIA(e.target.value)}
              placeholder="Ejemplo: 'Escribe un artículo sobre las ventajas de constituir una S.A.S. versus una S.R.L. en Argentina, enfocado en emprendedores tecnológicos'"
              rows={6}
              className="w-full border-2 border-purple-200 rounded-lg px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              disabled={generandoIA}
            />
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setMostrarModalIA(false)
                  setPromptIA('')
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                disabled={generandoIA}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={generarArticuloCompleto}
                disabled={generandoIA || !promptIA.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {generandoIA ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generar Artículo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">SEO Avanzado</h2>
            <button
              type="button"
              onClick={generarDescripcionConIA}
              disabled={generandoIA || !formData.titulo}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
            >
              <Wand2 className="w-4 h-4" />
              Generar con IA
            </button>
          </div>

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
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
            type="button"
            onClick={() => setMostrarPreview(true)}
            className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition cursor-pointer"
          >
            <Eye className="w-5 h-5" />
            Previsualizar
          </button>
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

      {/* Modal de Previsualización */}
      {mostrarPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Previsualización del Artículo</h2>
              <button
                onClick={() => setMostrarPreview(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Contenido del Artículo */}
            <div className="p-8">
              {/* Imagen Hero */}
              {formData.imagenHero && (
                <img
                  src={formData.imagenHero}
                  alt={formData.imagenAlt || formData.titulo}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />
              )}

              {/* Categoría y Fecha */}
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full">
                  {formData.categoria}
                </span>
                <span>{formData.lectura}</span>
              </div>

              {/* Título */}
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {formData.titulo || 'Sin título'}
              </h1>

              {/* Descripción */}
              {formData.descripcion ? (
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  {formData.descripcion}
                </p>
              ) : (
                <p className="text-xl text-gray-400 italic mb-8 leading-relaxed">
                  [Agrega una descripción para que aparezca aquí]
                </p>
              )}

              {/* Autor */}
              {formData.autor && (
                <p className="text-sm text-gray-500 mb-8">
                  Por {formData.autor}
                </p>
              )}

              <hr className="my-8 border-gray-200" />

              {/* Contenido del Artículo */}
              <div className="prose prose-lg max-w-none">
                {sections.length > 0 ? (
                  sections.map((section, index) => {
                    if (section.type === 'h2') {
                      return (
                        <h2 key={index} className="text-2xl font-bold text-gray-900 mt-8 mb-4 first:mt-0">
                          {section.text || <span className="text-gray-400 italic">[Subtítulo vacío]</span>}
                        </h2>
                      )
                    }
                    if (section.type === 'p') {
                      return (
                        <p key={index} className="text-gray-700 mb-4 leading-relaxed">
                          {section.text || <span className="text-gray-400 italic">[Párrafo vacío]</span>}
                        </p>
                      )
                    }
                    if (section.type === 'list') {
                      return (
                        <ul key={index} className="list-disc list-inside mb-4 space-y-2">
                          {section.items && section.items.length > 0 ? (
                            section.items.map((item, i) => (
                              <li key={i} className="text-gray-700">{item || <span className="text-gray-400 italic">[Item vacío]</span>}</li>
                            ))
                          ) : (
                            <li className="text-gray-400 italic">[Lista vacía]</li>
                          )}
                        </ul>
                      )
                    }
                    if (section.type === 'quote') {
                      return (
                        <blockquote key={index} className="border-l-4 border-red-700 pl-4 italic text-gray-700 mb-4 my-6">
                          {section.text || <span className="text-gray-400">[Cita vacía]</span>}
                        </blockquote>
                      )
                    }
                    return null
                  })
                ) : (
                  <p className="text-gray-400 italic text-center py-8">
                    [No hay contenido agregado. Usa el editor para agregar secciones.]
                  </p>
                )}
              </div>

              {/* Tags */}
              {formData.tags.length > 0 && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Etiquetas:</h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end gap-4">
              <button
                onClick={() => setMostrarPreview(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
