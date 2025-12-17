'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Bell, User } from 'lucide-react'

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="border-b bg-white">
      <div className="flex h-16 items-center justify-end px-4 md:px-6">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Notificaciones */}
          <Link 
            href="/dashboard/notificaciones"
            className="relative rounded-full p-2 hover:bg-gray-100 transition"
          >
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
          </Link>

          {/* Usuario */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{session?.user?.name}</p>
              <p className="text-xs text-gray-500 truncate max-w-[150px]">{session?.user?.email}</p>
            </div>
            <div className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}