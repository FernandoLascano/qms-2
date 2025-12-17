'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Home, FileText, Upload, Settings, LogOut, Shield, Bell, BarChart3, Menu, X, Building2 } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Inicio', href: '/dashboard', icon: Home },
  { name: 'Mis Trámites', href: '/dashboard/tramites', icon: FileText },
  { name: 'Documentos', href: '/dashboard/documentos', icon: Upload },
  { name: 'Notificaciones', href: '/dashboard/notificaciones', icon: Bell },
  { name: 'Configuración', href: '/dashboard/configuracion', icon: Settings },
]

const adminNavigation = [
  { name: 'Panel de Admin', href: '/dashboard/admin', icon: Shield },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = session?.user?.rol === 'ADMIN'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Para admin, cambiar "Inicio" por "Panel de Admin" y agregar Analytics y Sociedades
  const navItems = isAdmin 
    ? [
        { name: 'Panel de Admin', href: '/dashboard/admin', icon: Shield },
        { name: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart3 },
        { name: 'Sociedades', href: '/dashboard/admin/sociedades', icon: Building2 },
        ...navigation.slice(1) // Excluir "Inicio" para admins
      ]
    : navigation

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-16 md:h-20 items-center border-b border-gray-200 px-4 md:px-6">
        <Link href="/" className="flex items-center" onClick={() => setMobileMenuOpen(false)}>
          <img 
            src="/assets/img/logo4.png" 
            alt="QuieroMiSAS Logo" 
            className="h-12 md:h-14 w-auto"
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href === '/dashboard/admin' && pathname === '/dashboard/admin') ||
            (item.href === '/dashboard/admin/analytics' && pathname?.startsWith('/dashboard/admin/analytics')) ||
            (item.href === '/dashboard/admin/sociedades' && pathname?.startsWith('/dashboard/admin/sociedades'))
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-red-700 text-white'
                  : 'text-gray-700 hover:bg-red-50 hover:text-red-900'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-200 p-3">
        <button
          onClick={() => {
            setMobileMenuOpen(false)
            signOut({ callbackUrl: '/' })
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-900 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Cerrar Sesión
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-md text-gray-700 hover:text-red-700 transition"
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </button>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full w-64 flex-col bg-white border-r border-gray-200 text-gray-900">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          'md:hidden fixed top-0 left-0 h-full w-64 flex-col bg-white border-r border-gray-200 text-gray-900 z-50 transform transition-transform duration-300 ease-in-out',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </div>
    </>
  )
}