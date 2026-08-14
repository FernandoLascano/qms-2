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
      <div className="flex h-screen overflow-hidden bg-canvas">
        <Sidebar />

        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main id="contenido" className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">{children}</div>
          </main>
        </div>
      </div>
    </SessionGate>
  )
}
