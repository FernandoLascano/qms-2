'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Archive, ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Eye, FileText, Inbox,
  MailOpen, Mail, Paperclip, Plus, Reply, Search,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge, CountBadge } from '@/components/ui/badge'
import { EmptyState, InlineLoading } from '@/components/ui/states'
import { cn } from '@/lib/utils'
import type { ContactoEmail } from '@/lib/emails/contactos'

interface Email {
  id: string
  from: string
  fromName: string | null
  to: string[]
  subject: string
  bodyText: string | null
  direction: 'INBOUND' | 'OUTBOUND'
  status: 'UNREAD' | 'READ' | 'REPLIED' | 'ARCHIVED'
  parentEmailId: string | null
  attachments: { id: string }[]
  tramite: { id: string; denominacionSocial1: string } | null
  contacto: ContactoEmail | null
  createdAt: string
  _count?: { replies: number }
}

/*
 * La bandeja se lee por vistas. «Todos» mezclaba lo que escriben las personas
 * con los mails automáticos del sistema, que son la mayoría. Ahora lo que hay
 * que responder está en «Recibidos», y lo automático, aparte.
 */
type Vista = 'recibidos' | 'enviados' | 'automaticos' | 'archivados'
const VISTAS: { id: Vista; texto: string; icono: typeof Mail }[] = [
  { id: 'recibidos', texto: 'Recibidos', icono: Inbox },
  { id: 'enviados', texto: 'Enviados', icono: ArrowUpRight },
  { id: 'automaticos', texto: 'Automáticos', icono: Mail },
  { id: 'archivados', texto: 'Archivados', icono: Archive },
]

export default function EmailsPage() {
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [vista, setVista] = useState<Vista>('recibidos')
  const [soloSinLeer, setSoloSinLeer] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [conteos, setConteos] = useState<Partial<Record<Vista, number>>>({})
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchLoading, setBatchLoading] = useState(false)

  // La vista vive en la URL: se comparte y sobrevive a volver desde un mail.
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get('vista')
    if (v && VISTAS.some((x) => x.id === v)) setVista(v as Vista)
  }, [])

  function irA(v: Vista) {
    setVista(v)
    setPage(1)
    setSoloSinLeer(false)
    const url = new URL(window.location.href)
    if (v === 'recibidos') url.searchParams.delete('vista')
    else url.searchParams.set('vista', v)
    window.history.replaceState(null, '', url)
  }

  // Antes buscaba en cada tecla: una consulta por letra.
  useEffect(() => {
    const t = setTimeout(() => { setSearch(busqueda.trim()); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [busqueda])

  const fetchEmails = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ vista, page: String(page), limit: '25' })
      if (soloSinLeer) params.set('status', 'UNREAD')
      if (search) params.set('search', search)
      const res = await fetch(`/api/admin/emails?${params}`)
      const data = await res.json()
      setEmails(data.emails || [])
      setTotalPages(data.pages || 1)
      setTotal(data.total || 0)
      setUnreadCount(data.unreadCount || 0)
      setConteos(data.conteos || {})
      setSelectedIds(new Set())
    } catch {
      setEmails([])
    } finally {
      setLoading(false)
      window.dispatchEvent(new CustomEvent('admin-email-unread-refresh'))
    }
  }, [vista, soloSinLeer, search, page])

  useEffect(() => { fetchEmails() }, [fetchEmails])

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    const hoy = new Date()
    if (d.toDateString() === hoy.toDateString()) return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', ...(d.getFullYear() !== hoy.getFullYear() ? { year: '2-digit' } : {}) })
  }

  async function runBatch(status: 'READ' | 'UNREAD' | 'ARCHIVED') {
    if (selectedIds.size === 0) return
    setBatchLoading(true)
    try {
      const res = await fetch('/api/admin/emails/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds), status }),
      })
      if (res.ok) fetchEmails()
    } finally {
      setBatchLoading(false)
    }
  }

  async function toggleRead(e: React.MouseEvent, email: Email) {
    e.preventDefault()
    e.stopPropagation()
    if (email.status !== 'UNREAD' && email.status !== 'READ') return
    const next = email.status === 'UNREAD' ? 'READ' : 'UNREAD'
    setEmails((prev) => prev.map((m) => (m.id === email.id ? { ...m, status: next } : m)))
    const res = await fetch(`/api/admin/emails/${email.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    }).catch(() => null)
    if (!res?.ok) setEmails((prev) => prev.map((m) => (m.id === email.id ? { ...m, status: email.status } : m)))
    else fetchEmails()
  }

  const todosSeleccionados = emails.length > 0 && selectedIds.size === emails.length

  return (
    <div className="space-y-section">
      <PageHeader
        title="Emails"
        description={
          unreadCount > 0
            ? `${unreadCount} ${unreadCount === 1 ? 'mail sin leer' : 'mails sin leer'} en la bandeja.`
            : 'La bandeja de contacto@quieromisas.com.'
        }
        breadcrumbs={[{ label: 'Hoy', href: '/dashboard/admin' }, { label: 'Emails' }]}
        actions={
          <>
            <Button variant="ghost" asChild>
              <Link href="/dashboard/admin/emails/preview" title="Los mails que salen solos al avanzar un trámite">
                <Eye className="h-4 w-4" aria-hidden />
                Mails automáticos
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/dashboard/admin/emails/plantillas">
                <FileText className="h-4 w-4" aria-hidden />
                Plantillas
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/admin/emails/compose">
                <Plus className="h-4 w-4" aria-hidden />
                Redactar
              </Link>
            </Button>
          </>
        }
      />

      <div className="space-y-3">
        <nav aria-label="Vistas" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <ul className="flex min-w-max items-center gap-1 border-b border-line">
            {VISTAS.map((v) => (
              <li key={v.id}>
                <button
                  type="button"
                  onClick={() => irA(v.id)}
                  aria-current={vista === v.id ? 'page' : undefined}
                  className={cn(
                    'relative flex h-11 items-center gap-2 rounded-t-control px-3 text-body-sm transition-colors',
                    vista === v.id ? 'font-medium text-primary' : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
                  )}
                >
                  <v.icono className="h-4 w-4" aria-hidden />
                  {v.texto}
                  {v.id === 'recibidos' && unreadCount > 0 ? (
                    <CountBadge count={unreadCount} tone="primary" />
                  ) : (
                    conteos[v.id] !== undefined && <span className="text-ink-3 tnum">{conteos[v.id]}</span>
                  )}
                  {vista === v.id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" aria-hidden />}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative sm:w-96">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" aria-hidden />
            <Input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por asunto, remitente o texto"
              aria-label="Buscar emails"
              className="pl-9"
            />
          </div>
          {vista === 'recibidos' && (
            <label className="flex cursor-pointer items-center gap-2 text-body-sm text-ink-2">
              <input
                type="checkbox"
                checked={soloSinLeer}
                onChange={(e) => { setSoloSinLeer(e.target.checked); setPage(1) }}
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
              Sólo sin leer
            </label>
          )}
        </div>
      </div>

      <Card className="overflow-hidden">
        {/* Barra de selección */}
        <div className="flex min-h-12 flex-wrap items-center gap-3 border-b border-line bg-surface-2 px-card-sm py-2">
          <input
            type="checkbox"
            aria-label="Seleccionar todos"
            checked={todosSeleccionados}
            onChange={() => setSelectedIds(todosSeleccionados ? new Set() : new Set(emails.map((e) => e.id)))}
            className="h-4 w-4 accent-[var(--color-primary)]"
          />
          {selectedIds.size > 0 ? (
            <>
              <span className="text-body-sm text-ink-2">{selectedIds.size} seleccionados</span>
              <div className="flex flex-wrap gap-1">
                <Button variant="ghost" size="sm" onClick={() => runBatch('READ')} disabled={batchLoading}>
                  <MailOpen className="h-4 w-4" aria-hidden /> Leídos
                </Button>
                <Button variant="ghost" size="sm" onClick={() => runBatch('UNREAD')} disabled={batchLoading}>
                  <Mail className="h-4 w-4" aria-hidden /> No leídos
                </Button>
                {vista !== 'archivados' && (
                  <Button variant="ghost" size="sm" onClick={() => runBatch('ARCHIVED')} disabled={batchLoading}>
                    <Archive className="h-4 w-4" aria-hidden /> Archivar
                  </Button>
                )}
              </div>
            </>
          ) : (
            <span className="text-body-sm text-ink-2">
              {search ? `Resultados para «${search}»` : VISTAS.find((v) => v.id === vista)!.texto}
              <span className="ml-1 text-ink-3 tnum">· {total}</span>
            </span>
          )}
        </div>

        {loading ? (
          <InlineLoading label="Cargando mails…" />
        ) : emails.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={search ? 'Sin resultados' : soloSinLeer ? 'No hay mails sin leer' : 'No hay mails acá'}
            description={search ? `Nada coincide con «${search}».` : undefined}
          />
        ) : (
          <ul className="divide-y divide-line">
            {emails.map((email) => {
              const sinLeer = email.status === 'UNREAD'
              const entrante = email.direction === 'INBOUND'
              const nombre = entrante ? email.fromName || email.from : `Para: ${email.contacto?.nombre ?? email.to[0]}`
              const respuestas = email._count?.replies ?? 0
              return (
                <li key={email.id} className={cn('group relative', sinLeer && 'bg-primary-soft/40')}>
                  <div className="flex items-start gap-3 px-card-sm py-3">
                    <input
                      type="checkbox"
                      aria-label={`Seleccionar mail de ${nombre}`}
                      checked={selectedIds.has(email.id)}
                      onChange={() => {
                        setSelectedIds((prev) => {
                          const n = new Set(prev)
                          if (n.has(email.id)) n.delete(email.id)
                          else n.add(email.id)
                          return n
                        })
                      }}
                      className="relative z-10 mt-1 h-4 w-4 accent-[var(--color-primary)]"
                    />
                    <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full', entrante ? 'bg-success-soft text-success' : 'bg-info-soft text-info')} aria-hidden>
                      {entrante ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                    </span>
                    <Link href={`/dashboard/admin/emails/${email.id}`} className="min-w-0 flex-1 after:absolute after:inset-0">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className={cn('truncate text-body', sinLeer ? 'font-semibold text-ink' : 'font-medium text-ink')}>{nombre}</span>
                          <EtiquetaContacto contacto={email.contacto} />
                        </span>
                        <span className={cn('shrink-0 text-label tnum', sinLeer ? 'font-semibold text-primary' : 'text-ink-3')}>
                          {formatDate(email.createdAt)}
                        </span>
                      </span>
                      <span className={cn('block truncate text-body-sm', sinLeer ? 'font-semibold text-ink' : 'text-ink')}>
                        {email.subject || '(Sin asunto)'}
                      </span>
                      <span className="mt-0.5 flex items-center gap-2 text-label text-ink-3">
                        <span className="truncate">{email.bodyText?.replace(/\s+/g, ' ').trim() || 'Sin texto'}</span>
                        {email.attachments.length > 0 && <Paperclip className="h-3 w-3 shrink-0" aria-label="Con adjuntos" />}
                        {(email.status === 'REPLIED' || respuestas > 0) && (
                          <span className="flex shrink-0 items-center gap-0.5 text-success">
                            <Reply className="h-3 w-3" aria-hidden /> Respondido
                          </span>
                        )}
                      </span>
                    </Link>
                    {(email.status === 'UNREAD' || email.status === 'READ') && (
                      <button
                        onClick={(e) => toggleRead(e, email)}
                        className="relative z-10 rounded-chip p-1.5 text-ink-3 opacity-0 transition hover:bg-surface-3 hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
                        title={sinLeer ? 'Marcar como leído' : 'Marcar como no leído'}
                        aria-label={sinLeer ? 'Marcar como leído' : 'Marcar como no leído'}
                      >
                        {sinLeer ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-line px-card-sm py-2">
            <span className="text-body-sm text-ink-2 tnum">Página {page} de {totalPages}</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon-sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} aria-label="Página anterior">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} aria-label="Página siguiente">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

/** Quién es: cliente (con su sociedad) o lead. Sin etiqueta = desconocido. */
function EtiquetaContacto({ contacto }: { contacto: ContactoEmail | null }) {
  if (!contacto) return null
  if (contacto.tipo === 'CLIENTE') {
    return (
      <Badge size="sm" tone={contacto.tramite.inscripta ? 'success' : 'info'} className="max-w-48 truncate">
        {contacto.tramite.denominacion}
      </Badge>
    )
  }
  return <Badge size="sm" tone="warning">Lead</Badge>
}
