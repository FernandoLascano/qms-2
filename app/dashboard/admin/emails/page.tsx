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
          <span className="text-body-sm font-semibold text-primary uppercase tracking-wider">Correo Electrónico</span>
          <h1 className="text-title font-semibold text-ink mt-1">Bandeja de Email</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={fetchEmails}
            className="flex items-center gap-2 px-4 py-2 border border-line rounded-control text-body-sm font-medium text-ink-2 hover:bg-surface-2 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
          <Link
            href="/emails/preview"
            className="flex items-center gap-2 px-4 py-2 border border-line rounded-control text-body-sm font-medium text-ink-2 hover:bg-surface-2 transition"
          >
            Previsualizar mails
          </Link>
          <Link
            href="/dashboard/admin/emails/plantillas"
            className="flex items-center gap-2 px-4 py-2 border border-line rounded-control text-body-sm font-medium text-ink-2 hover:bg-surface-2 transition"
          >
            Plantillas
          </Link>
          <Link
            href="/dashboard/admin/emails/compose"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-control text-body-sm font-semibold hover:bg-primary-hover transition"
          >
            <Plus className="w-4 h-4" />
            Redactar
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface rounded-card border border-line p-4 shadow-raise">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-info-soft rounded-control flex items-center justify-center">
              <Mail className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-title font-semibold text-ink">{total}</p>
              <p className="text-label text-ink-2">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-card border border-line p-4 shadow-raise">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-danger-soft rounded-control flex items-center justify-center">
              <Circle className="w-5 h-5 text-danger fill-red-600" />
            </div>
            <div>
              <p className="text-title font-semibold text-ink">{unreadCount}</p>
              <p className="text-label text-ink-2">No leídos</p>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-card border border-line p-4 shadow-raise">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success-soft rounded-control flex items-center justify-center">
              <Inbox className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-title font-semibold text-ink">
                {emails.filter(e => e.direction === 'INBOUND').length}
              </p>
              <p className="text-label text-ink-2">Recibidos</p>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-card border border-line p-4 shadow-raise">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-info-soft rounded-control flex items-center justify-center">
              <Send className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-title font-semibold text-ink">
                {emails.filter(e => e.direction === 'OUTBOUND').length}
              </p>
              <p className="text-label text-ink-2">Enviados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface rounded-card border border-line shadow-raise p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Tabs */}
          <div className="flex gap-1 bg-surface-3 rounded-control p-1">
            {tabs.map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => { setTab(t.key); setPage(1) }}
                className={`flex items-center gap-2 px-4 py-2 rounded-control text-body-sm font-medium transition cursor-pointer ${
                  tab === t.key
                    ? 'bg-surface text-ink shadow-raise'
                    : 'text-ink-2 hover:text-ink-2'
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-label text-ink-2 font-medium mr-1">Estado:</span>
            {statusChips.map(s => (
              <button
                key={s.key}
                type="button"
                onClick={() => { setStatusFilter(s.key); setPage(1) }}
                className={`px-3 py-1 rounded-control text-label font-semibold transition cursor-pointer ${
                  statusFilter === s.key
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-3 text-ink-2 hover:bg-n-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3" />
            <input
              type="text"
              placeholder="Buscar en asunto, remitente y cuerpo..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-10 pr-4 py-2 border border-line rounded-control text-body-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-primary-soft border border-primary-line rounded-control text-body-sm">
          <span className="font-semibold text-primary">{selectedIds.size} seleccionados</span>
          <button
            type="button"
            disabled={batchLoading}
            onClick={() => runBatch('READ')}
            className="px-3 py-1 rounded-control bg-surface border border-primary-line text-primary font-medium hover:bg-primary-soft cursor-pointer disabled:opacity-50"
          >
            Marcar leído
          </button>
          <button
            type="button"
            disabled={batchLoading}
            onClick={() => runBatch('UNREAD')}
            className="px-3 py-1 rounded-control bg-surface border border-primary-line text-primary font-medium hover:bg-primary-soft cursor-pointer disabled:opacity-50"
          >
            No leído
          </button>
          <button
            type="button"
            disabled={batchLoading}
            onClick={() => runBatch('ARCHIVED')}
            className="px-3 py-1 rounded-control bg-surface border border-primary-line text-primary font-medium hover:bg-primary-soft cursor-pointer disabled:opacity-50"
          >
            Archivar
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-primary font-medium hover:underline cursor-pointer"
          >
            Quitar selección
          </button>
        </div>
      )}

      {/* Email List */}
      <div className="bg-surface rounded-card border border-line shadow-raise overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-line" />
          </div>
        ) : emails.length === 0 ? (
          <div className="text-center py-20">
            <Mail className="w-12 h-12 text-ink-3 mx-auto mb-4" />
            <p className="text-ink-2 font-medium">No hay emails</p>
            <p className="text-ink-3 text-body-sm mt-1">Los emails que recibas aparecerán acá</p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {emails.map((email) => (
              <div
                key={email.id}
                className={`flex items-stretch gap-0 border-b border-line last:border-0 ${
                  email.status === 'UNREAD' ? 'bg-primary-soft/30' : ''
                }`}
              >
                <label className="flex items-center px-3 sm:px-4 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    className="rounded border-line-strong text-primary focus:ring-ring"
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
                  className="flex items-center gap-3 flex-1 min-w-0 px-2 sm:px-4 py-3 sm:py-4 hover:bg-surface-2/80 transition group"
                >
                {/* Status + Direction (combined on mobile) */}
                <div className="flex-shrink-0 relative">
                  <div className={`w-8 h-8 rounded-control flex items-center justify-center ${
                    email.direction === 'INBOUND' ? 'bg-success-soft' : 'bg-info-soft'
                  }`}>
                    {email.direction === 'INBOUND' ? (
                      <Inbox className="w-4 h-4 text-success" />
                    ) : (
                      <Send className="w-4 h-4 text-info" />
                    )}
                  </div>
                  {email.status === 'UNREAD' && (
                    <Circle className="w-2.5 h-2.5 text-primary fill-brand-600 absolute -top-0.5 -right-0.5" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`text-body-sm truncate ${
                      email.status === 'UNREAD' ? 'font-semibold text-ink' : 'font-medium text-ink-2'
                    }`}>
                      {email.direction === 'INBOUND'
                        ? (email.fromName || email.from)
                        : `Para: ${email.to[0]}`
                      }
                    </p>
                    {email.tramite && (
                      <span className="hidden sm:inline-flex flex-shrink-0 text-label bg-info-soft text-info px-2 py-0.5 rounded-full font-medium">
                        {email.tramite.denominacionSocial1}
                      </span>
                    )}
                    {(email.parentEmailId || (email._count && email._count.replies > 0)) && (
                      <span className="inline-flex items-center gap-0.5 text-label text-ink-2" title="Conversación">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {email._count && email._count.replies > 0 ? email._count.replies : ''}
                      </span>
                    )}
                  </div>
                  <p className={`text-body-sm truncate ${
                    email.status === 'UNREAD' ? 'font-semibold text-ink' : 'text-ink-2'
                  }`}>
                    {email.subject}
                  </p>
                  <p className="hidden sm:block text-label text-ink-3 truncate mt-0.5">
                    {getPreview(email.bodyText)}
                  </p>
                </div>

                {/* Meta */}
                <div className="flex-shrink-0 flex items-center gap-2 sm:gap-3">
                  {(email.status === 'UNREAD' || email.status === 'READ') && (
                    <button
                      type="button"
                      onClick={(e) => toggleRead(e, email.id, email.status)}
                      className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-control border border-line text-label font-semibold text-ink-2 hover:bg-surface hover:border-line-strong transition cursor-pointer"
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
                    <Paperclip className="w-4 h-4 text-ink-3 hidden sm:block" />
                  )}
                  {email.status === 'REPLIED' && (
                    <span className="hidden sm:inline-flex text-label bg-success-soft text-success px-2 py-0.5 rounded-full font-medium">
                      Respondido
                    </span>
                  )}
                  <span className="text-label text-ink-3 whitespace-nowrap">
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
          <div className="flex items-center justify-between px-6 py-4 border-t border-line">
            <p className="text-body-sm text-ink-2">
              Página {page} de {totalPages}
            </p>
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
