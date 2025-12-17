import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Si está en dashboard o tramite/nuevo, debe estar autenticado
    if (!token && (path.startsWith('/dashboard') || path.startsWith('/tramite'))) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Si es admin y está en ruta de admin
    if (path.startsWith('/dashboard/admin') && token?.rol !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Si el admin accede a /dashboard (raíz), redirigir a /dashboard/admin
    if (token?.rol === 'ADMIN' && path === '/dashboard') {
      return NextResponse.redirect(new URL('/dashboard/admin', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/tramite/:path*',
  ]
}

