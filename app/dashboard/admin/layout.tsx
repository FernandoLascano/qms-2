import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'

/**
 * Portero de todo /dashboard/admin.
 *
 * Varias pantallas del panel son de cliente (`'use client'`) y no pueden mirar
 * la sesión en el servidor, así que dependían de que la API devolviera 401: el
 * armazón de la pantalla igual se abría para cualquier usuario logueado, con
 * sus títulos y su estructura a la vista. Con el guard en el layout la
 * comprobación queda en un solo lugar y vale para las 29 rutas.
 *
 * Es el mismo comportamiento que ya tenían a mano las pantallas de servidor
 * (admin, trámites, usuarios, leads…): quien no es admin vuelve a /dashboard.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  if (session.user.rol !== 'ADMIN') redirect('/dashboard')

  return <>{children}</>
}
