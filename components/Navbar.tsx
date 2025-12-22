'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

interface NavbarProps {
  currentPage?: 'home' | 'blog'
}

export default function Navbar({ currentPage = 'home' }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="border-b border-gray-200 bg-white shadow-md sticky top-0 z-50 transition-all duration-300">
      <nav className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="flex items-center group">
            <img
              src="/assets/img/logo4.png"
              alt="QuieroMiSAS Logo"
              className="h-12 md:h-14 w-auto transition-transform group-hover:scale-105"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              href="/#beneficios"
              className="px-4 py-2 text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium text-sm"
            >
              Beneficios
            </Link>
            <Link
              href="/#procedimiento"
              className="px-4 py-2 text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium text-sm"
            >
              Cómo Funciona
            </Link>
            <Link
              href="/#planes"
              className="px-4 py-2 text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium text-sm"
            >
              Planes
            </Link>
            <Link
              href="/blog"
              className={`px-4 py-2 ${currentPage === 'blog' ? 'text-red-700 bg-red-50' : 'text-gray-700 hover:text-red-700 hover:bg-red-50'} rounded-lg transition-all duration-200 font-medium text-sm`}
            >
              Blog
            </Link>
            <Link
              href="/#faq"
              className="px-4 py-2 text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium text-sm"
            >
              FAQ
            </Link>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <Link
              href="/login"
              className="px-5 py-2 text-gray-700 hover:text-red-700 transition-all duration-200 font-semibold text-sm border border-transparent hover:border-gray-200 rounded-lg"
            >
              Ingresar
            </Link>
            <Link
              href="/registro"
              className="bg-red-700 text-white px-6 py-2.5 rounded-lg hover:bg-red-800 transition-all duration-200 font-semibold text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Registrarse
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 pb-4 border-t border-gray-200 bg-white rounded-b-lg shadow-lg overflow-hidden">
            <div className="flex flex-col space-y-1 pt-4">
              <Link
                href="/#beneficios"
                className="px-4 py-3 text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Beneficios
              </Link>
              <Link
                href="/#procedimiento"
                className="px-4 py-3 text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Cómo Funciona
              </Link>
              <Link
                href="/#planes"
                className="px-4 py-3 text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Planes
              </Link>
              <Link
                href="/blog"
                className={`px-4 py-3 ${currentPage === 'blog' ? 'text-red-700 bg-red-50' : 'text-gray-700 hover:text-red-700 hover:bg-red-50'} rounded-lg transition-all duration-200 font-medium`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Blog
              </Link>
              <Link
                href="/#faq"
                className="px-4 py-3 text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQ
              </Link>
              <div className="pt-3 mt-3 border-t border-gray-200 space-y-2 px-4">
                <Link
                  href="/login"
                  className="block text-center px-4 py-2.5 text-gray-700 hover:text-red-700 transition-all duration-200 font-semibold border border-gray-200 rounded-lg hover:border-red-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Ingresar
                </Link>
                <Link
                  href="/registro"
                  className="block bg-red-700 text-white px-4 py-2.5 rounded-lg hover:bg-red-800 transition-all duration-200 font-semibold text-center shadow-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Registrarse
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
