'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, Search, Filter } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Post {
  id: string
  titulo: string
  slug: string
  categoria: string
  publicado: boolean
  destacado: boolean
  vistas: number
  fechaPublicacion: string
  createdAt: string
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'todos' | 'publicados' | 'borradores'>('todos')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/blog')
      const data = await res.json()
      setPosts(data)
    } catch (error) {
      console.error('Error al cargar posts:', error)
      toast.error('Error al cargar posts')
    } finally {
      setLoading(false)
    }
  }

  const deletePost = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este post?')) return

    try {
      const res = await fetch(`/api/blog/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Post eliminado exitosamente')
        fetchPosts()
      } else {
        toast.error('Error al eliminar post')
      }
    } catch (error) {
      console.error('Error al eliminar post:', error)
      toast.error('Error al eliminar post')
    }
  }

  const togglePublicado = async (id: string, publicado: boolean) => {
    try {
      const res = await fetch(`/api/blog/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicado: !publicado })
      })

      if (res.ok) {
        toast.success(publicado ? 'Post despublicado' : 'Post publicado')
        fetchPosts()
      } else {
        toast.error('Error al cambiar estado')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cambiar estado')
    }
  }

  const filteredPosts = posts.filter(post => {
    const matchesFilter =
      filter === 'todos' ||
      (filter === 'publicados' && post.publicado) ||
      (filter === 'borradores' && !post.publicado)

    const matchesSearch =
      post.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.categoria.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesFilter && matchesSearch
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <span className="inline-block text-red-700 font-semibold text-sm tracking-wider uppercase mb-2">
            Contenido
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900">
            Gestión de <span className="text-red-700">Blog</span>
          </h1>
          <p className="text-gray-500 mt-2 text-lg">
            Administra las notas y artículos del sitio
          </p>
        </div>
        <Link
          href="/dashboard/admin/blog/nuevo"
          className="flex items-center gap-2 bg-red-700 text-white px-6 py-3 rounded-xl hover:bg-red-800 transition-all shadow-lg shadow-red-200 font-semibold"
        >
          <Plus className="w-5 h-5" />
          Crear Nota
        </Link>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por título o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-300"
            />
          </div>

          {/* Filtros */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('todos')}
              className={`px-4 py-2 rounded-xl font-medium transition cursor-pointer ${
                filter === 'todos'
                  ? 'bg-red-700 text-white shadow-lg shadow-red-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos ({posts.length})
            </button>
            <button
              onClick={() => setFilter('publicados')}
              className={`px-4 py-2 rounded-xl font-medium transition cursor-pointer ${
                filter === 'publicados'
                  ? 'bg-green-600 text-white shadow-lg shadow-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Publicados ({posts.filter(p => p.publicado).length})
            </button>
            <button
              onClick={() => setFilter('borradores')}
              className={`px-4 py-2 rounded-xl font-medium transition cursor-pointer ${
                filter === 'borradores'
                  ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Borradores ({posts.filter(p => !p.publicado).length})
            </button>
          </div>
        </div>
      </div>

      {/* Lista de posts */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700 mx-auto"></div>
            <p className="text-gray-500 mt-4">Cargando posts...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-20 w-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <Filter className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No hay posts que mostrar</h3>
            <p className="text-gray-500">Intenta con otros criterios de búsqueda</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="p-6 hover:bg-gray-50/50 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-xl font-bold text-gray-900">{post.titulo}</h3>
                      {post.destacado && (
                        <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-lg">
                          Destacado
                        </span>
                      )}
                      {post.publicado ? (
                        <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">
                          Publicado
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-lg">
                          Borrador
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3 flex-wrap">
                      <span className="font-semibold text-red-700">{post.categoria}</span>
                      <span className="text-gray-300">·</span>
                      <span>Slug: /{post.slug}</span>
                      <span className="text-gray-300">·</span>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{post.vistas} vistas</span>
                      </div>
                    </div>

                    <p className="text-gray-500 text-sm">
                      Publicado: {new Date(post.fechaPublicacion).toLocaleDateString('es-AR')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => togglePublicado(post.id, post.publicado)}
                      className={`px-4 py-2 rounded-xl font-medium transition cursor-pointer ${
                        post.publicado
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {post.publicado ? 'Despublicar' : 'Publicar'}
                    </button>

                    <Link
                      href={`/dashboard/admin/blog/editar/${post.id}`}
                      className="p-2.5 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition cursor-pointer"
                    >
                      <Edit className="w-5 h-5" />
                    </Link>

                    <button
                      onClick={() => deletePost(post.id)}
                      className="p-2.5 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition cursor-pointer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
