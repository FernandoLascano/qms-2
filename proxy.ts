import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

/**
 * Defensa en profundidad para el panel.
 *
 * Las páginas/handlers ya validan sesión y rol individualmente, pero este
 * middleware actúa como red de seguridad: si una ruta nueva bajo /dashboard se
 * olvida del chequeo, igual queda protegida.
 *
 * - Cualquier ruta bajo /dashboard requiere una sesión válida (si no, redirige a /login).
 * - El área /dashboard/admin además exige rol ADMIN.
 *
 * Corre en el runtime edge y solo lee el JWT de la cookie (no usa Prisma),
 * por lo que es seguro a nivel edge. No cubre /api: esas rutas incluyen
 * endpoints públicos (webhooks, blog, contacto, auth) y cada una valida su
 * propio acceso.
 */
export default withAuth(
  function proxy(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    if (pathname.startsWith('/dashboard/admin') && token?.rol !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      // Autorizado si hay token (sesión iniciada). Si no, withAuth redirige a signIn.
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: ['/dashboard/:path*'],
}
