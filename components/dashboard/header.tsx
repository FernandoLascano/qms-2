'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Plus } from 'lucide-react'
import NotificationBell from './NotificationBell'
import { itemPorRuta } from '@/lib/dashboard/navigation'

/**
 * Header delgado.
 *
 * No muestra el título de la página (eso lo hace <PageHeader>) ni repite la
 * identidad del usuario: eso ahora vive en el pie del sidebar oscuro. Queda
 * como una barra de ubicación y acciones, con el mínimo peso visual posible.
 */
export function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const isAdmin = session?.user?.rol === 'ADMIN'
  const actual = itemPorRuta(pathname)

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/80 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between gap-3 px-4 pl-16 md:px-6 md:pl-6">
        <nav aria-label="Ubicación" className="min-w-0">
          <ol className="flex items-center gap-1 text-body-sm">
            <li className="text-ink-3">{isAdmin ? 'Administración' : 'Mi cuenta'}</li>
            {actual && (
              <>
                <li aria-hidden>
                  <ChevronRight className="h-3.5 w-3.5 text-ink-3" />
                </li>
                <li className="truncate font-medium text-ink">{actual.name}</li>
              </>
            )}
          </ol>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {!isAdmin && (
            <Link
              href="/tramite/nuevo"
              className="hidden h-9 items-center gap-1.5 rounded-control border border-line-strong bg-surface px-3 text-body-sm font-medium text-ink transition-colors hover:bg-surface-3 lg:inline-flex"
            >
              <Plus className="h-4 w-4 text-ink-2" aria-hidden />
              Nuevo trámite
            </Link>
          )}

          <NotificationBell />
        </div>
      </div>
    </header>
  )
}
