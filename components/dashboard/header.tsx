'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import NotificationBell from './NotificationBell'
import { itemPorRuta } from '@/lib/dashboard/navigation'

/**
 * Header delgado.
 *
 * Ya no muestra el título de la página: eso lo hace <PageHeader> dentro de
 * cada pantalla. Antes el título aparecía dos veces (acá como h1 y en la
 * página como h1/h2 en text-4xl font-black), lo que además rompía la
 * jerarquía semántica.
 *
 * El CTA "Nuevo trámite" es sólo para clientes: los admin no inician trámites
 * (app/dashboard/page.tsx los redirige), así que el botón no tenía sentido.
 */
export function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const isAdmin = session?.user?.rol === 'ADMIN'
  const actual = itemPorRuta(pathname)

  const iniciales = (session?.user?.name ?? 'U')
    .split(' ')
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('')

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-3 px-4 pl-16 md:px-6 md:pl-6">
        {/* Ubicación actual: contexto discreto, no título */}
        <p className="min-w-0 truncate text-body-sm text-ink-2">
          <span className="text-ink-3">{isAdmin ? 'Administración' : 'Mi cuenta'}</span>
          {actual && (
            <>
              <span className="mx-1.5 text-ink-3" aria-hidden>
                /
              </span>
              <span className="text-ink">{actual.name}</span>
            </>
          )}
        </p>

        <div className="flex shrink-0 items-center gap-2">
          {!isAdmin && (
            <Link
              href="/tramite/nuevo"
              className="hidden h-9 items-center gap-1.5 rounded-control bg-primary px-3 text-body-sm font-medium text-on-primary transition-colors hover:bg-primary-hover lg:inline-flex"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Nuevo trámite
            </Link>
          )}

          <NotificationBell />

          <div className="flex items-center gap-2.5 border-l border-line pl-2 md:pl-3">
            <div className="hidden text-right md:block">
              <p className="max-w-40 truncate text-body-sm font-medium text-ink">
                {session?.user?.name}
              </p>
              <p className="max-w-40 truncate text-label text-ink-2">
                {session?.user?.email}
              </p>
            </div>
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-body-sm font-medium text-primary"
              aria-hidden
            >
              {iniciales}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
