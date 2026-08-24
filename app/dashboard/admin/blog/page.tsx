'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, Search, Filter } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

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

  const [postAEliminar, setPostAEliminar] = useState<{ id: string; titulo: string } | null>(null)
  const [eliminando, setEliminando] = useState(false)

  const deletePost = async () => {
    const id = postAEliminar?.id
    if (!id) return
    setEliminando(true)

    try {
      const res = await fetch(`/api/blog/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Post eliminado')
        setPostAEliminar(null)
        fetchPosts()
      } else {
        toast.error('Error al eliminar post')
      }
    } catch (error) {
      console.error('Error al eliminar post:', error)
      toast.error('Error al eliminar post')
    } finally {
      setEliminando(false)
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
          <h1 className="text-display text-ink">
            Gestión de Blog
          </h1>
          <p className="mt-1 text-body text-ink-2">
            Administra las notas y artículos del sitio
          </p>
        </div>
        <Link
          href="/dashboard/admin/blog/nuevo"
          className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-control hover:bg-primary-hover transition-all shadow-raise font-semibold"
        >
          <Plus className="w-5 h-5" />
          Crear Nota
        </Link>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-surface rounded-card shadow-raise border border-line p-6">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-3 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por título o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-line rounded-control focus:ring-2 focus:ring-ring focus:border-primary-line"
            />
          </div>

          {/* Filtros */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('todos')}
              className={`px-4 py-2 rounded-control font-medium transition cursor-pointer ${
                filter === 'todos'
                  ? 'bg-primary text-on-primary shadow-raise'
                  : 'bg-surface-3 text-ink-2 hover:bg-n-200'
              }`}
            >
              Todos ({posts.length})
            </button>
            <button
              onClick={() => setFilter('publicados')}
              className={`px-4 py-2 rounded-control font-medium transition cursor-pointer ${
                filter === 'publicados'
                  ? 'bg-success-solid text-on-primary shadow-raise'
                  : 'bg-surface-3 text-ink-2 hover:bg-n-200'
              }`}
            >
              Publicados ({posts.filter(p => p.publicado).length})
            </button>
            <button
              onClick={() => setFilter('borradores')}
              className={`px-4 py-2 rounded-control font-medium transition cursor-pointer ${
                filter === 'borradores'
                  ? 'bg-warning-solid text-on-primary shadow-raise'
                  : 'bg-surface-3 text-ink-2 hover:bg-n-200'
              }`}
            >
              Borradores ({posts.filter(p => !p.publicado).length})
            </button>
          </div>
        </div>
      </div>

      {/* Lista de posts */}
      <div className="bg-surface rounded-card shadow-raise border border-line overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-line mx-auto"></div>
            <p className="text-ink-2 mt-4">Cargando posts...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-20 w-20 rounded-card bg-surface-3 flex items-center justify-center mx-auto mb-6">
              <Filter className="h-10 w-10 text-ink-3" />
            </div>
            <h3 className="text-title font-semibold text-ink mb-2">No hay posts que mostrar</h3>
            <p className="text-ink-2">Intenta con otros criterios de búsqueda</p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="p-6 hover:bg-surface-2/50 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-title font-semibold text-ink">{post.titulo}</h3>
                      {post.destacado && (
                        <span className="px-3 py-1 bg-info-soft text-info text-label font-semibold rounded-control">
                          Destacado
                        </span>
                      )}
                      {post.publicado ? (
                        <span className="px-3 py-1 bg-success-soft text-success text-label font-semibold rounded-control">
                          Publicado
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-warning-soft text-warning text-label font-semibold rounded-control">
                          Borrador
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-body-sm text-ink-2 mb-3 flex-wrap">
                      <span className="font-semibold text-primary">{post.categoria}</span>
                      <span className="text-ink-3">·</span>
                      <span>Slug: /{post.slug}</span>
                      <span className="text-ink-3">·</span>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{post.vistas} vistas</span>
                      </div>
                    </div>

                    <p className="text-ink-2 text-body-sm">
                      Publicado: {new Date(post.fechaPublicacion).toLocaleDateString('es-AR')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => togglePublicado(post.id, post.publicado)}
                      className={`px-4 py-2 rounded-control font-medium transition cursor-pointer ${
                        post.publicado
                          ? 'bg-warning-soft text-warning hover:bg-warning-solid'
                          : 'bg-success-soft text-success hover:bg-success-solid'
                      }`}
                    >
                      {post.publicado ? 'Despublicar' : 'Publicar'}
                    </button>

                    <Link
                      href={`/dashboard/admin/blog/editar/${post.id}`}
                      className="p-2 bg-info-soft text-info rounded-control hover:bg-info-solid transition cursor-pointer"
                    >
                      <Edit className="w-5 h-5" />
                    </Link>

                    <button
                      aria-label={`Eliminar «${post.titulo}»`}
                      onClick={() => setPostAEliminar({ id: post.id, titulo: post.titulo })}
                      className="p-2 bg-primary-soft text-primary rounded-control hover:bg-brand-200 transition cursor-pointer"
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

      <ConfirmDialog
        open={!!postAEliminar}
        onOpenChange={(abierto) => !abierto && setPostAEliminar(null)}
        title="¿Eliminar este artículo?"
        description={
          postAEliminar
            ? `Se va a borrar «${postAEliminar.titulo}» del blog. No se puede deshacer.`
            : undefined
        }
        confirmLabel="Eliminar artículo"
        loading={eliminando}
        onConfirm={deletePost}
      />
    </div>
  )
}
