'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Home, FileText, Upload, Settings, LogOut, Shield, Bell, BarChart3, Menu, X, Building2, BookOpen, Calendar, User, Users, ChevronRight } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Inicio', href: '/dashboard', icon: Home },
  { name: 'Mis Trámites', href: '/dashboard/tramites', icon: FileText },
  { name: 'Documentos', href: '/dashboard/documentos', icon: Upload },
  { name: 'Notificaciones', href: '/dashboard/notificaciones', icon: Bell },
  { name: 'Configuración', href: '/dashboard/configuracion', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = session?.user?.rol === 'ADMIN'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Para admin, cambiar "Inicio" por "Panel de Admin" y agregar Analytics, Sociedades, Blog, Calendario y Usuarios
  const navItems = isAdmin
    ? [
        { name: 'Panel de Admin', href: '/dashboard/admin', icon: Shield },
        { name: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart3 },
        { name: 'Sociedades', href: '/dashboard/admin/sociedades', icon: Building2 },
        { name: 'Usuarios', href: '/dashboard/admin/usuarios', icon: Users },
        { name: 'Blog', href: '/dashboard/admin/blog', icon: BookOpen },
        { name: 'Calendario', href: '/dashboard/admin/calendario', icon: Calendar },
        { name: 'Configuración Sistema', href: '/dashboard/admin/configuracion', icon: Settings },
        ...navigation.slice(1, -1), // Excluir "Inicio" y "Configuración" normal para admins
        { name: 'Mi Cuenta', href: '/dashboard/configuracion', icon: User }
      ]
    : navigation

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-20 items-center border-b border-gray-100 px-6">
        <Link href="/" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
          <img
            src="/assets/img/logo4.png"
            alt="QuieroMiSAS Logo"
            className="h-12 w-auto"
          />
        </Link>
      </div>

      {/* User Info */}
      <div className="px-4 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-200">
            <span className="text-white font-bold text-sm">
              {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {session?.user?.name || 'Usuario'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {isAdmin ? 'Administrador' : 'Cliente'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {isAdmin && (
          <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Administración
          </p>
        )}
        {navItems.slice(0, isAdmin ? 7 : navItems.length).map((item) => {
          const isActive = pathname === item.href ||
            (item.href === '/dashboard/admin' && pathname === '/dashboard/admin') ||
            (item.href === '/dashboard/admin/analytics' && pathname?.startsWith('/dashboard/admin/analytics')) ||
            (item.href === '/dashboard/admin/sociedades' && pathname?.startsWith('/dashboard/admin/sociedades')) ||
            (item.href === '/dashboard/admin/blog' && pathname?.startsWith('/dashboard/admin/blog')) ||
            (item.href === '/dashboard/admin/calendario' && pathname?.startsWith('/dashboard/admin/calendario')) ||
            (item.href === '/dashboard/admin/configuracion' && pathname?.startsWith('/dashboard/admin/configuracion')) ||
            (item.href === '/dashboard/admin/usuarios' && pathname?.startsWith('/dashboard/admin/usuarios'))
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-red-700 text-white shadow-lg shadow-red-200'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 transition-transform duration-200",
                isActive ? "" : "group-hover:scale-110"
              )} />
              <span className="flex-1">{item.name}</span>
              {isActive && (
                <ChevronRight className="h-4 w-4 opacity-70" />
              )}
            </Link>
          )
        })}

        {/* Separador para admin */}
        {isAdmin && (
          <>
            <div className="my-4 border-t border-gray-100" />
            <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Mi cuenta
            </p>
            {navItems.slice(7).map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/dashboard/admin' && pathname?.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-red-700 text-white shadow-lg shadow-red-200'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    isActive ? "" : "group-hover:scale-110"
                  )} />
                  <span className="flex-1">{item.name}</span>
                  {isActive && (
                    <ChevronRight className="h-4 w-4 opacity-70" />
                  )}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-100 p-4">
        <button
          onClick={() => {
            setMobileMenuOpen(false)
            signOut({ callbackUrl: '/' })
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 cursor-pointer group"
        >
          <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 bg-white border border-gray-200 rounded-xl shadow-lg text-gray-700 hover:text-red-700 hover:border-red-200 transition-all duration-200 cursor-pointer"
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 cursor-pointer transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full w-72 flex-col bg-white border-r border-gray-200 shadow-sm">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          'md:hidden fixed top-0 left-0 h-full w-72 flex-col bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-out shadow-2xl',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </div>
    </>
  )
}
