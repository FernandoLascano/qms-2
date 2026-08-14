'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { LogOut, Menu, X, ExternalLink, Plus } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { CountBadge } from '@/components/ui/badge'
import { navPara, esActivo, type NavItem } from '@/lib/dashboard/navigation'

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = session?.user?.rol === 'ADMIN'
  const [mobileOpen, setMobileOpen] = useState(false)
  const [emailsSinLeer, setEmailsSinLeer] = useState(0)

  const grupos = navPara(isAdmin)

  /* ── Contador de emails sin leer (sólo admin) ─────────────────────── */
  const refrescarEmails = useCallback(() => {
    if (!isAdmin) return
    fetch('/api/admin/emails/unread-count')
      .then((r) => r.json())
      .then((d: { unreadCount?: number }) =>
        setEmailsSinLeer(typeof d.unreadCount === 'number' ? d.unreadCount : 0),
      )
      .catch(() => {})
  }, [isAdmin])

  // Polling suave: 2 min, sólo con la pestaña visible.
  useEffect(() => {
    if (!isAdmin) return
    const POLL_MS = 120_000
    let interval: ReturnType<typeof setInterval> | null = null

    const stop = () => {
      if (interval) {
        clearInterval(interval)
        interval = null
      }
    }
    const start = () => {
      stop()
      interval = setInterval(() => void refrescarEmails(), POLL_MS)
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refrescarEmails()
        start()
      } else {
        stop()
      }
    }

    void refrescarEmails()
    if (document.visibilityState === 'visible') start()

    document.addEventListener('visibilitychange', onVisibility)
    const onRefresh = () => void refrescarEmails()
    window.addEventListener('admin-email-unread-refresh', onRefresh)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('admin-email-unread-refresh', onRefresh)
    }
  }, [isAdmin, refrescarEmails])

  useEffect(() => {
    if (!isAdmin || !pathname?.startsWith('/dashboard/admin/emails')) return
    refrescarEmails()
  }, [pathname, isAdmin, refrescarEmails])

  // Cerrar el menú móvil con Escape.
  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  const contadorDe = (item: NavItem) =>
    item.badge === 'emails' ? emailsSinLeer : 0

  const contenido = (
    <>
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center border-b border-line px-4">
        <Link
          href="/"
          className="flex items-center rounded-control"
          onClick={() => setMobileOpen(false)}
        >
          <img
            src="/assets/img/qms-logo-reg.png"
            alt="QuieroMiSAS — ir al sitio"
            className="h-9 w-auto"
          />
        </Link>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Menú principal">
        {grupos.map((grupo, gi) => (
          <div key={grupo.title ?? `grupo-${gi}`} className={gi > 0 ? 'mt-5' : undefined}>
            {grupo.title && (
              <p className="px-2 pb-1.5 text-label uppercase tracking-wide text-ink-3">
                {grupo.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {grupo.items.map((item) => {
                const activo = esActivo(item, pathname)
                const contador = contadorDe(item)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={activo ? 'page' : undefined}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex h-10 items-center gap-2.5 rounded-control px-2.5 text-body-sm transition-colors duration-150',
                        activo
                          ? 'bg-primary-soft font-medium text-primary'
                          : 'text-ink-2 hover:bg-surface-3 hover:text-ink',
                      )}
                    >
                      <item.icon
                        className={cn('h-4 w-4 shrink-0', activo ? 'text-primary' : 'text-ink-3')}
                        aria-hidden
                      />
                      <span className="flex-1 truncate">{item.name}</span>
                      {contador > 0 && <CountBadge count={contador} />}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Pie */}
      <div className="shrink-0 border-t border-line p-3">
        {isAdmin ? (
          <Link
            href="/dashboard/tramites"
            onClick={() => setMobileOpen(false)}
            className="mb-1 flex h-10 items-center gap-2.5 rounded-control px-2.5 text-body-sm text-ink-2 transition-colors hover:bg-surface-3 hover:text-ink"
          >
            <ExternalLink className="h-4 w-4 shrink-0 text-ink-3" aria-hidden />
            Ver como cliente
          </Link>
        ) : (
          <Link
            href="/tramite/nuevo"
            onClick={() => setMobileOpen(false)}
            className="mb-1 flex h-10 items-center gap-2.5 rounded-control bg-primary px-2.5 text-body-sm font-medium text-on-primary transition-colors hover:bg-primary-hover"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            Nuevo trámite
          </Link>
        )}

        <button
          type="button"
          onClick={() => {
            setMobileOpen(false)
            signOut({ callbackUrl: '/' })
          }}
          className="flex h-10 w-full items-center gap-2.5 rounded-control px-2.5 text-body-sm text-ink-2 transition-colors hover:bg-surface-3 hover:text-ink"
        >
          <LogOut className="h-4 w-4 shrink-0 text-ink-3" aria-hidden />
          Cerrar sesión
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Disparador móvil: vive dentro del flujo del header, no flotando encima */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menú"
        aria-expanded={mobileOpen}
        className="md:hidden fixed left-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-control border border-line bg-surface text-ink-2 shadow-raise"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>

      {/* Fondo del panel móvil */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-n-950/40"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar de escritorio */}
      <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-line bg-surface md:flex">
        {contenido}
      </aside>

      {/* Sidebar móvil */}
      <aside
        className={cn(
          'md:hidden fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-line bg-surface',
          'transition-transform duration-200 ease-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Cerrar menú"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-control text-ink-2 hover:bg-surface-3"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
        {contenido}
      </aside>
    </>
  )
}
