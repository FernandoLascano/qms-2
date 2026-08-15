'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { LogOut, Menu, X, ExternalLink, Plus } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { CountBadge } from '@/components/ui/badge'
import { navPara, esActivo, type NavItem } from '@/lib/dashboard/navigation'

/**
 * Sidebar claro, con el mismo idioma de navegación que el Navbar del sitio:
 * reposo neutro, hover y activo en brand-50 con texto brand-700.
 *
 * (Una versión anterior lo hizo oscuro. Se veía bien por sí sola, pero la
 * portada es blanca y luminosa: el panel parecía otro producto.)
 */
export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = session?.user?.rol === 'ADMIN'
  const [mobileOpen, setMobileOpen] = useState(false)
  const [emailsSinLeer, setEmailsSinLeer] = useState(0)

  const grupos = navPara(isAdmin)

  /* Contador de emails sin leer (sólo admin) */
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

  const contadorDe = (item: NavItem) => (item.badge === 'emails' ? emailsSinLeer : 0)

  const iniciales = (session?.user?.name ?? 'U')
    .split(' ')
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('')

  const contenido = (
    <>
      {/* Logo: mismo alto y tratamiento que en el Navbar del sitio */}
      <div className="flex h-[72px] shrink-0 items-center border-b border-line px-5">
        <Link
          href="/"
          className="group flex items-center rounded-control"
          onClick={() => setMobileOpen(false)}
        >
          <img
            src="/assets/img/qms-logo-reg.png"
            alt="QuieroMiSAS — ir al sitio"
            className="h-11 w-auto transition-transform group-hover:scale-105"
          />
        </Link>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Menú principal">
        {grupos.map((grupo, gi) => (
          <div key={grupo.title ?? `grupo-${gi}`} className={gi > 0 ? 'mt-6' : undefined}>
            {grupo.title && (
              <p className="overline px-3 pb-2 text-ink-3">{grupo.title}</p>
            )}
            <ul className="space-y-1">
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
                        'group flex h-10 items-center gap-3 rounded-control px-3 text-body-sm font-medium',
                        'transition-all duration-200',
                        activo
                          ? 'bg-nav-active-bg text-nav-active'
                          : 'text-nav-item hover:bg-nav-item-bg hover:text-nav-item-hover',
                      )}
                    >
                      <item.icon
                        className={cn(
                          'h-[18px] w-[18px] shrink-0 transition-colors',
                          activo ? 'text-primary' : 'text-ink-3 group-hover:text-primary',
                        )}
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
            className="mb-2 flex h-10 items-center gap-3 rounded-control px-3 text-body-sm font-medium text-nav-item transition-all hover:bg-nav-item-bg hover:text-nav-item-hover"
          >
            <ExternalLink className="h-[18px] w-[18px] shrink-0 text-ink-3" aria-hidden />
            Ver como cliente
          </Link>
        ) : (
          <Link
            href="/tramite/nuevo"
            onClick={() => setMobileOpen(false)}
            className="mb-2 flex h-11 items-center justify-center gap-2 rounded-control bg-primary px-3 text-body font-semibold text-on-primary shadow-raise transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-pop"
          >
            <Plus className="h-4.5 w-4.5 shrink-0" aria-hidden />
            Nuevo trámite
          </Link>
        )}

        <div className="flex items-center gap-3 rounded-control px-2 py-2">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-body-sm font-semibold text-primary"
            aria-hidden
          >
            {iniciales}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-body-sm font-semibold text-ink">
              {session?.user?.name}
            </span>
            <span className="block truncate text-label text-ink-2">
              {isAdmin ? 'Administrador' : 'Cliente'}
            </span>
          </span>
          <button
            type="button"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            onClick={() => {
              setMobileOpen(false)
              signOut({ callbackUrl: '/' })
            }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-ink-3 transition-colors hover:bg-nav-item-bg hover:text-primary"
          >
            <LogOut className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Disparador móvil */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menú"
        aria-expanded={mobileOpen}
        className="md:hidden fixed left-3 top-4 z-30 flex h-11 w-11 items-center justify-center rounded-control border border-line bg-surface text-ink-2 shadow-raise"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>

      {/* Fondo del panel móvil */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-n-950/40 backdrop-blur-[2px]"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar de escritorio */}
      <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-line bg-nav-bg md:flex">
        {contenido}
      </aside>

      {/* Sidebar móvil.
          Usa `inert` y no aria-hidden: con aria-hidden los enlaces del panel
          cerrado seguían siendo alcanzables con Tab, mandando el foco fuera
          de la pantalla. */}
      <aside
        className={cn(
          'md:hidden fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-line bg-nav-bg',
          'transition-transform duration-200 ease-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        inert={!mobileOpen}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Cerrar menú"
          className="absolute right-3 top-4 flex h-9 w-9 items-center justify-center rounded-control text-ink-2 hover:bg-nav-item-bg hover:text-primary"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
        {contenido}
      </aside>
    </>
  )
}
