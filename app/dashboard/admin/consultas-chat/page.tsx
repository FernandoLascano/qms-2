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
          <span className="text-sm font-semibold text-brand-700 uppercase tracking-wider">Analytics</span>
          <h1 className="text-2xl font-black text-gray-900 mt-1">Consultas del Asistente</h1>
          <p className="text-gray-500 mt-1">Preguntas que hacen los visitantes en el chat del sitio</p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={analyzing || total === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-purple-200"
        >
          {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Analizar con IA
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{total}</p>
              <p className="text-xs text-gray-500">Total consultas</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">
                {consultas.length > 0 ? formatDate(consultas[0].createdAt).split(',')[0] : '-'}
              </p>
              <p className="text-xs text-gray-500">Última consulta</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm col-span-2 md:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Análisis IA</p>
              <p className="text-xs text-gray-500">Detecta patrones y sugiere FAQs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Panel de análisis IA */}
      {showAnalysis && (
        <div className="bg-white rounded-2xl border-2 border-purple-200 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Sparkles className="w-5 h-5" />
              <span className="font-bold">Análisis de Consultas con IA</span>
            </div>
            <button
              onClick={() => setShowAnalysis(false)}
              className="p-1 hover:bg-white/10 rounded-lg transition cursor-pointer text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6">
            {analyzing ? (
              <div className="flex items-center justify-center py-12 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                <span className="text-gray-500 font-medium">Analizando {total} consultas...</span>
              </div>
            ) : analysis ? (
              <div
                className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900"
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
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar en preguntas..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Lista de consultas */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-700" />
          </div>
        ) : consultas.length === 0 ? (
          <div className="text-center py-20">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No hay consultas todavía</p>
            <p className="text-gray-400 text-sm mt-1">Las preguntas del asistente aparecerán acá</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {consultas.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelected(selected?.id === c.id ? null : c)}
                className="px-5 py-4 hover:bg-gray-50 transition cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                      {c.pregunta.length > 120 ? c.pregunta.substring(0, 120) + '...' : c.pregunta}
                    </p>
                    {selected?.id === c.id ? (
                      <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Respuesta del asistente:</p>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{c.respuesta}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 truncate">
                        {c.respuesta.substring(0, 80)}...
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                    {formatDate(c.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">Página {page} de {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
