'use client'

import { useState, useEffect, useCallback } from 'react'
import { MessageCircle, Search, Sparkles, Loader2, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react'

interface Consulta {
  id: string
  pregunta: string
  respuesta: string
  createdAt: string
}

export default function ConsultasChatPage() {
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Análisis IA
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [showAnalysis, setShowAnalysis] = useState(false)

  // Detalle
  const [selected, setSelected] = useState<Consulta | null>(null)

  const fetchConsultas = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' })
      if (search) params.set('search', search)
      const res = await fetch(`/api/admin/consultas-chat?${params}`)
      const data = await res.json()
      setConsultas(data.consultas || [])
      setTotalPages(data.pages || 1)
      setTotal(data.total || 0)
    } catch {
      setConsultas([])
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchConsultas()
  }, [fetchConsultas])

  const handleAnalyze = async () => {
    setAnalyzing(true)
    setShowAnalysis(true)
    setAnalysis(null)
    try {
      const res = await fetch('/api/admin/consultas-chat', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setAnalysis(data.analysis)
      } else {
        setAnalysis(`Error: ${data.error}`)
      }
    } catch {
      setAnalysis('Error de conexión al analizar.')
    } finally {
      setAnalyzing(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-body-sm font-semibold text-primary">Analytics</span>
          <h1 className="text-title font-semibold text-ink mt-1">Consultas del Asistente</h1>
          <p className="text-ink-2 mt-1">Preguntas que hacen los visitantes en el chat del sitio</p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={analyzing || total === 0}
          className="flex items-center gap-2 px-5 py-2 bg-primary text-on-primary rounded-control text-body-sm font-semibold hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50 cursor-pointer shadow-raise"
        >
          {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Analizar con IA
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-surface rounded-card border border-line p-4 shadow-raise">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-info-soft rounded-control flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-title font-semibold text-ink">{total}</p>
              <p className="text-label text-ink-2">Total consultas</p>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-card border border-line p-4 shadow-raise">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success-soft rounded-control flex items-center justify-center">
              <Clock className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-title font-semibold text-ink">
                {consultas.length > 0 ? formatDate(consultas[0].createdAt).split(',')[0] : '-'}
              </p>
              <p className="text-label text-ink-2">Última consulta</p>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-card border border-line p-4 shadow-raise col-span-2 md:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-info-soft rounded-control flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-body-sm font-semibold text-ink">Análisis IA</p>
              <p className="text-label text-ink-2">Detecta patrones y sugiere FAQs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Panel de análisis IA */}
      {showAnalysis && (
        <div className="bg-surface rounded-card border-2 border-info-line shadow-raise overflow-hidden">
          <div className="bg-primary px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-on-primary">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">Análisis de Consultas con IA</span>
            </div>
            <button
              onClick={() => setShowAnalysis(false)}
              className="p-1 hover:bg-surface/10 rounded-control transition cursor-pointer text-on-primary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6">
            {analyzing ? (
              <div className="flex items-center justify-center py-12 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-info" />
                <span className="text-ink-2 font-medium">Analizando {total} consultas...</span>
              </div>
            ) : analysis ? (
              <div
                className="prose prose-sm max-w-none prose-headings:text-ink prose-p:text-ink-2 prose-li:text-ink-2 prose-strong:text-ink"
                dangerouslySetInnerHTML={{
                  __html: analysis
                    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/^- (.*$)/gim, '<li>$1</li>')
                    .replace(/(<li>[\s\S]*<\/li>)/, '<ul>$1</ul>')
                    .replace(/\n{2,}/g, '</p><p>')
                    .replace(/\n/g, '<br/>')
                }}
              />
            ) : null}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-surface rounded-card border border-line shadow-raise p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3" />
          <input
            type="text"
            placeholder="Buscar en preguntas..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-10 pr-4 py-2 border border-line rounded-control text-body-sm text-ink focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>
      </div>

      {/* Lista de consultas */}
      <div className="bg-surface rounded-card border border-line shadow-raise overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-line" />
          </div>
        ) : consultas.length === 0 ? (
          <div className="text-center py-20">
            <MessageCircle className="w-12 h-12 text-ink-3 mx-auto mb-4" />
            <p className="text-ink-2 font-medium">No hay consultas todavía</p>
            <p className="text-ink-3 text-body-sm mt-1">Las preguntas del asistente aparecerán acá</p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {consultas.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelected(selected?.id === c.id ? null : c)}
                className="px-5 py-4 hover:bg-surface-2 transition cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-semibold text-ink mb-1">
                      {c.pregunta.length > 120 ? c.pregunta.substring(0, 120) + '...' : c.pregunta}
                    </p>
                    {selected?.id === c.id ? (
                      <div className="mt-3 p-3 bg-surface-2 rounded-control border border-line">
                        <p className="text-label font-semibold text-ink-2 mb-2">Respuesta del asistente:</p>
                        <p className="text-body-sm text-ink-2 leading-relaxed whitespace-pre-line">{c.respuesta}</p>
                      </div>
                    ) : (
                      <p className="text-label text-ink-3 truncate">
                        {c.respuesta.substring(0, 80)}...
                      </p>
                    )}
                  </div>
                  <span className="text-label text-ink-3 whitespace-nowrap flex-shrink-0">
                    {formatDate(c.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-line">
            <p className="text-body-sm text-ink-2">Página {page} de {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-control border border-line hover:bg-surface-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-control border border-line hover:bg-surface-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
