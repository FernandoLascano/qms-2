'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { User, Home, FileText, Upload, Bell, Settings, Shield, BarChart3, Building2, BookOpen, Calendar, Users, Clock, CreditCard } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import NotificationBell from './NotificationBell'
import Link from 'next/link'

const pageInfo: Record<string, { title: string; description: string; icon: LucideIcon }> = {
  '/dashboard': { title: 'Inicio', description: 'Resumen de tu cuenta', icon: Home },
  '/dashboard/tramites': { title: 'Mis Trámites', description: 'Gestiona tus trámites de constitución', icon: FileText },
  '/dashboard/documentos': { title: 'Documentos', description: 'Sube y gestiona tus documentos', icon: Upload },
  '/dashboard/notificaciones': { title: 'Notificaciones', description: 'Centro de notificaciones', icon: Bell },
  '/dashboard/configuracion': { title: 'Configuración', description: 'Configura tu cuenta', icon: Settings },
  '/dashboard/admin': { title: 'Panel de Admin', description: 'Gestión administrativa', icon: Shield },
  '/dashboard/admin/analytics': { title: 'Analytics', description: 'Métricas y estadísticas', icon: BarChart3 },
  '/dashboard/admin/sociedades': { title: 'Sociedades', description: 'Gestión de sociedades', icon: Building2 },
  '/dashboard/admin/usuarios': { title: 'Usuarios', description: 'Gestión de usuarios', icon: Users },
  '/dashboard/admin/blog': { title: 'Blog', description: 'Gestión de artículos', icon: BookOpen },
  '/dashboard/admin/calendario': { title: 'Calendario', description: 'Eventos y recordatorios', icon: Calendar },
  '/dashboard/admin/configuracion': { title: 'Configuración Sistema', description: 'Configuración del sistema', icon: Settings },
  '/dashboard/admin/tramites': { title: 'Todos los Trámites', description: 'Gestión de trámites', icon: FileText },
  '/dashboard/admin/tracking-tiempo': { title: 'Tracking de Tiempo', description: 'Análisis de tiempos', icon: Clock },
  '/dashboard/admin/configuracion-cuentas': { title: 'Cuentas Bancarias', description: 'Configuración de cuentas', icon: CreditCard },
}

export function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()

  // Obtener info de la página actual
  const currentPage = pageInfo[pathname || ''] || { title: 'Dashboard', description: '', icon: Home }
  const PageIcon = currentPage.icon

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="flex h-16 md:h-20 items-center justify-between px-4 md:px-8">
        {/* Left side - Page info */}
        <div className="flex items-center gap-4 ml-12 md:ml-0">
          <div className="hidden md:flex h-12 w-12 rounded-xl bg-red-50 items-center justify-center">
            <PageIcon className="h-6 w-6 text-red-700" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900">{currentPage.title}</h1>
            <p className="text-xs md:text-sm text-gray-500 hidden sm:block">{currentPage.description}</p>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Quick action button */}
          <Link
            href="/tramite/nuevo"
            className="hidden lg:flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-sm font-semibold rounded-xl shadow-lg shadow-red-200 transition-all duration-200"
          >
            <FileText className="h-4 w-4" />
            Nuevo Trámite
          </Link>

          {/* Notificaciones en tiempo real */}
          <NotificationBell />

          {/* User dropdown */}
          <div className="flex items-center gap-3 pl-3 md:pl-4 border-l border-gray-200">
            <div className="text-right hidden md:block">
              <p className="text-sm font-semibold text-gray-900 truncate max-w-[150px]">{session?.user?.name}</p>
              <p className="text-xs text-gray-500 truncate max-w-[150px]">{session?.user?.email}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-200">
              <User className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
