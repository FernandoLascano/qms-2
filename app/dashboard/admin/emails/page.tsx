'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Mail, Inbox, Send, Search, Archive, Paperclip, Circle, RefreshCw, Plus, ChevronLeft, ChevronRight } from 'lucide-react'

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
  attachments: { id: string; fileName: string; mimeType: string; size: number }[]
  tramite: { id: string; denominacionSocial1: string } | null
  createdAt: string
}

type TabType = 'all' | 'INBOUND' | 'OUTBOUND'

export default function EmailsPage() {
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabType>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [unreadCount, setUnreadCount] = useState(0)
  const [total, setTotal] = useState(0)

  const fetchEmails = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (tab !== 'all') params.set('direction', tab)
      if (search) params.set('search', search)
      params.set('page', page.toString())
      params.set('limit', '20')

      const res = await fetch(`/api/admin/emails?${params}`)
      const data = await res.json()
      setEmails(data.emails || [])
      setTotalPages(data.pages || 1)
      setUnreadCount(data.unreadCount || 0)
      setTotal(data.total || 0)
    } catch {
      setEmails([])
    } finally {
      setLoading(false)
    }
  }, [tab, search, page])

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

  const tabs: { key: TabType; label: string; icon: any }[] = [
    { key: 'all', label: 'Todos', icon: Mail },
    { key: 'INBOUND', label: 'Recibidos', icon: Inbox },
    { key: 'OUTBOUND', label: 'Enviados', icon: Send },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-sm font-semibold text-brand-700 uppercase tracking-wider">Correo Electrónico</span>
          <h1 className="text-2xl font-black text-gray-900 mt-1">Bandeja de Email</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchEmails}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
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

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por asunto, remitente..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

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
              <Link
                key={email.id}
                href={`/dashboard/admin/emails/${email.id}`}
                className={`flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition group ${
                  email.status === 'UNREAD' ? 'bg-brand-50/30' : ''
                }`}
              >
                {/* Status indicator */}
                <div className="flex-shrink-0">
                  {email.status === 'UNREAD' ? (
                    <Circle className="w-3 h-3 text-brand-600 fill-brand-600" />
                  ) : (
                    <div className="w-3 h-3" />
                  )}
                </div>

                {/* Direction icon */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                  email.direction === 'INBOUND' ? 'bg-green-100' : 'bg-purple-100'
                }`}>
                  {email.direction === 'INBOUND' ? (
                    <Inbox className="w-4 h-4 text-green-600" />
                  ) : (
                    <Send className="w-4 h-4 text-purple-600" />
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
                      <span className="flex-shrink-0 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        {email.tramite.denominacionSocial1}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm truncate ${
                    email.status === 'UNREAD' ? 'font-semibold text-gray-800' : 'text-gray-600'
                  }`}>
                    {email.subject}
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {getPreview(email.bodyText)}
                  </p>
                </div>

                {/* Meta */}
                <div className="flex-shrink-0 flex items-center gap-3">
                  {email.attachments.length > 0 && (
                    <Paperclip className="w-4 h-4 text-gray-400" />
                  )}
                  {email.status === 'REPLIED' && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      Respondido
                    </span>
                  )}
                  {email.status === 'ARCHIVED' && (
                    <Archive className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {formatDate(email.createdAt)}
                  </span>
                </div>
              </Link>
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
