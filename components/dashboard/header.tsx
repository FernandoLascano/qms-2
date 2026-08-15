'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import NotificationBell from './NotificationBell'
import { itemPorRuta } from '@/lib/dashboard/navigation'

/**
 * Barra superior, con el mismo tratamiento que el Navbar del sitio:
 * fondo blanco, borde inferior y el CTA de marca a la derecha.
 *
 * No repite el título de la pantalla (eso lo hace <PageHeader>) ni la
 * identidad del usuario (vive en el pie del sidebar).
 */
export function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const isAdmin = session?.user?.rol === 'ADMIN'
  const actual = itemPorRuta(pathname)

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="flex h-[72px] items-center justify-between gap-3 px-4 pl-16 md:px-6 md:pl-6">
        <nav aria-label="Ubicación" className="min-w-0">
          <ol className="flex items-center gap-1.5 text-body-sm">
            <li className="text-ink-3">{isAdmin ? 'Administración' : 'Mi cuenta'}</li>
            {actual && (
              <>
                <li aria-hidden>
                  <ChevronRight className="h-3.5 w-3.5 text-ink-3" />
                </li>
                <li className="truncate font-semibold text-ink">{actual.name}</li>
              </>
            )}
          </ol>
        </nav>

        <div className="flex shrink-0 items-center gap-3">

          <NotificationBell />
        </div>
      </div>
    </header>
  )
}
