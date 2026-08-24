import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'
import { SessionGate } from '@/components/auth/SessionGate'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return (
    <SessionGate>
      <div className="flex h-screen overflow-hidden bg-surface">
        <Sidebar />

        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          {/* Mismo degradado suave que la portada, en vez de un gris plano */}
          <main id="contenido" className="canvas-landing flex-1 overflow-y-auto">
            <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">{children}</div>
          </main>
        </div>
      </div>
    </SessionGate>
  )
}
