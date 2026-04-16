'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Mail, Inbox, Send, Search, Archive, Paperclip, Circle, RefreshCw, Plus, ChevronLeft, ChevronRight, Eye, EyeOff, MessageSquare } from 'lucide-react'

interface Email {
  id: string
  from: string
  fromName: string | null
  to: string[]
  subject: string
  bodyText: string | null
  direction: 'INBOUND' | 'OUTBOUND'
  status: 'UNREAD' | 'READ' | 'REPLIED' | 'ARCHIVED'
  spamVerdict: string | null
  isForwarded: boolean
  parentEmailId: string | null
  attachments: { id: string; fileName: string; mimeType: string; size: number }[]
  tramite: { id: string; denominacionSocial1: string } | null
  createdAt: string
  _count?: { replies: number }
}

type TabType = 'all' | 'INBOUND' | 'OUTBOUND'
type StatusFilterType = 'all' | 'UNREAD' | 'ARCHIVED' | 'REPLIED'

export default function EmailsPage() {
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabType>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [unreadCount, setUnreadCount] = useState(0)
  const [total, setTotal] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchLoading, setBatchLoading] = useState(false)

  const fetchEmails = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (tab !== 'all') params.set('direction', tab)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (search) params.set('search', search)
      params.set('page', page.toString())
      params.set('limit', '20')

      const res = await fetch(`/api/admin/emails?${params}`)
      const data = await res.json()
      setEmails(data.emails || [])
      setTotalPages(data.pages || 1)
      setUnreadCount(data.unreadCount || 0)
      setTotal(data.total || 0)
      setSelectedIds(new Set())
    } catch {
      setEmails([])
    } finally {
      setLoading(false)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('admin-email-unread-refresh'))
      }
    }
  }, [tab, statusFilter, search, page])

  useEffect(() => {
    fetchEmails()
  }, [fetchEmails])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    if (isToday) {
      return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
  }

  const getPreview = (text: string | null) => {
    if (!text) return 'Sin contenido'
    return text.substring(0, 100).replace(/\s+/g, ' ').trim() + (text.length > 100 ? '...' : '')
  }

  const tabs: { key: TabType; label: string; icon: typeof Mail }[] = [
    { key: 'all', label: 'Todos', icon: Mail },
    { key: 'INBOUND', label: 'Recibidos', icon: Inbox },
    { key: 'OUTBOUND', label: 'Enviados', icon: Send },
  ]

  const statusChips: { key: StatusFilterType; label: string }[] = [
    { key: 'all', label: 'Todos los estados' },
    { key: 'UNREAD', label: 'No leídos' },
    { key: 'REPLIED', label: 'Respondidos' },
    { key: 'ARCHIVED', label: 'Archivados' },
  ]

  const runBatch = async (status: 'READ' | 'UNREAD' | 'ARCHIVED') => {
    if (selectedIds.size === 0) return
    setBatchLoading(true)
    try {
      const res = await fetch('/api/admin/emails/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds), status }),
      })
      if (res.ok) {
        setSelectedIds(new Set())
        fetchEmails()
      }
    } finally {
      setBatchLoading(false)
    }
  }

  const toggleRead = async (e: React.MouseEvent, emailId: string, currentStatus: Email['status']) => {
    e.preventDefault()
    e.stopPropagation()

    if (currentStatus !== 'UNREAD' && currentStatus !== 'READ') return

    const nextStatus: Email['status'] = currentStatus === 'UNREAD' ? 'READ' : 'UNREAD'

    // Optimistic update
    setEmails(prev => prev.map(em => (em.id === emailId ? { ...em, status: nextStatus } : em)))

    try {
      const res = await fetch(`/api/admin/emails/${emailId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (!res.ok) {
        // rollback
        setEmails(prev => prev.map(em => (em.id === emailId ? { ...em, status: currentStatus } : em)))
      } else {
        // refrescar contadores (unreadCount) y paginación si aplica
        fetchEmails()
      }
    } catch {
      setEmails(prev => prev.map(em => (em.id === emailId ? { ...em, status: currentStatus } : em)))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-sm font-semibold text-brand-700 uppercase tracking-wider">Correo Electrónico</span>
          <h1 className="text-2xl font-black text-gray-900 mt-1">Bandeja de Email</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={fetchEmails}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
          <Link
            href="/dashboard/admin/emails/plantillas"
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Plantillas
          </Link>
          <Link
            href="/dashboard/admin/emails/compose"
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-700 text-white rounded-xl text-sm font-semibold hover:bg-brand-800 transition"
          >
            <Plus className="w-4 h-4" />
            Redactar
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <Circle className="w-5 h-5 text-red-600 fill-red-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{unreadCount}</p>
              <p className="text-xs text-gray-500">No leídos</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Inbox className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">
                {emails.filter(e => e.direction === 'INBOUND').length}
              </p>
              <p className="text-xs text-gray-500">Recibidos</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Send className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">
                {emails.filter(e => e.direction === 'OUTBOUND').length}
              </p>
              <p className="text-xs text-gray-500">Enviados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {tabs.map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => { setTab(t.key); setPage(1) }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                  tab === t.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-gray-500 font-medium mr-1">Estado:</span>
            {statusChips.map(s => (
              <button
                key={s.key}
                type="button"
                onClick={() => { setStatusFilter(s.key); setPage(1) }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  statusFilter === s.key
                    ? 'bg-brand-700 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar en asunto, remitente y cuerpo..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-brand-50 border border-brand-200 rounded-xl text-sm">
          <span className="font-semibold text-brand-900">{selectedIds.size} seleccionados</span>
          <button
            type="button"
            disabled={batchLoading}
            onClick={() => runBatch('READ')}
            className="px-3 py-1.5 rounded-lg bg-white border border-brand-300 text-brand-800 font-medium hover:bg-brand-100 cursor-pointer disabled:opacity-50"
          >
            Marcar leído
          </button>
          <button
            type="button"
            disabled={batchLoading}
            onClick={() => runBatch('UNREAD')}
            className="px-3 py-1.5 rounded-lg bg-white border border-brand-300 text-brand-800 font-medium hover:bg-brand-100 cursor-pointer disabled:opacity-50"
          >
            No leído
          </button>
          <button
            type="button"
            disabled={batchLoading}
            onClick={() => runBatch('ARCHIVED')}
            className="px-3 py-1.5 rounded-lg bg-white border border-brand-300 text-brand-800 font-medium hover:bg-brand-100 cursor-pointer disabled:opacity-50"
          >
            Archivar
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-brand-700 font-medium hover:underline cursor-pointer"
          >
            Quitar selección
          </button>
        </div>
      )}

      {/* Email List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-700" />
          </div>
        ) : emails.length === 0 ? (
          <div className="text-center py-20">
            <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No hay emails</p>
            <p className="text-gray-400 text-sm mt-1">Los emails que recibas aparecerán acá</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {emails.map((email) => (
              <div
                key={email.id}
                className={`flex items-stretch gap-0 border-b border-gray-50 last:border-0 ${
                  email.status === 'UNREAD' ? 'bg-brand-50/30' : ''
                }`}
              >
                <label className="flex items-center px-3 sm:px-4 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-brand-700 focus:ring-brand-500"
                    checked={selectedIds.has(email.id)}
                    onChange={() => {
                      setSelectedIds(prev => {
                        const next = new Set(prev)
                        if (next.has(email.id)) next.delete(email.id)
                        else next.add(email.id)
                        return next
                      })
                    }}
                  />
                </label>
                <Link
                  href={`/dashboard/admin/emails/${email.id}`}
                  className="flex items-center gap-3 flex-1 min-w-0 px-2 sm:px-4 py-3 sm:py-4 hover:bg-gray-50/80 transition group"
                >
                {/* Status + Direction (combined on mobile) */}
                <div className="flex-shrink-0 relative">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    email.direction === 'INBOUND' ? 'bg-green-100' : 'bg-purple-100'
                  }`}>
                    {email.direction === 'INBOUND' ? (
                      <Inbox className="w-4 h-4 text-green-600" />
                    ) : (
                      <Send className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                  {email.status === 'UNREAD' && (
                    <Circle className="w-2.5 h-2.5 text-brand-600 fill-brand-600 absolute -top-0.5 -right-0.5" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`text-sm truncate ${
                      email.status === 'UNREAD' ? 'font-bold text-gray-900' : 'font-medium text-gray-700'
                    }`}>
                      {email.direction === 'INBOUND'
                        ? (email.fromName || email.from)
                        : `Para: ${email.to[0]}`
                      }
                    </p>
                    {email.tramite && (
                      <span className="hidden sm:inline-flex flex-shrink-0 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        {email.tramite.denominacionSocial1}
                      </span>
                    )}
                    {(email.parentEmailId || (email._count && email._count.replies > 0)) && (
                      <span className="inline-flex items-center gap-0.5 text-xs text-gray-500" title="Conversación">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {email._count && email._count.replies > 0 ? email._count.replies : ''}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm truncate ${
                    email.status === 'UNREAD' ? 'font-semibold text-gray-800' : 'text-gray-600'
                  }`}>
                    {email.subject}
                  </p>
                  <p className="hidden sm:block text-xs text-gray-400 truncate mt-0.5">
                    {getPreview(email.bodyText)}
                  </p>
                </div>

                {/* Meta */}
                <div className="flex-shrink-0 flex items-center gap-2 sm:gap-3">
                  {(email.status === 'UNREAD' || email.status === 'READ') && (
                    <button
                      type="button"
                      onClick={(e) => toggleRead(e, email.id, email.status)}
                      className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-white hover:border-gray-300 transition cursor-pointer"
                      title={email.status === 'UNREAD' ? 'Marcar como leído' : 'Marcar como no leído'}
                    >
                      {email.status === 'UNREAD' ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          Leído
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          No leído
                        </>
                      )}
                    </button>
                  )}
                  {email.attachments.length > 0 && (
                    <Paperclip className="w-4 h-4 text-gray-400 hidden sm:block" />
                  )}
                  {email.status === 'REPLIED' && (
                    <span className="hidden sm:inline-flex text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      Respondido
                    </span>
                  )}
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {formatDate(email.createdAt)}
                  </span>
                </div>
              </Link>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Página {page} de {totalPages}
            </p>
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
