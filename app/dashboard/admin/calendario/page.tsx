import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import CalendarioEventos from '@/components/admin/CalendarioEventos'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function CalendarioPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.rol !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin">
          <Button variant="ghost" size="icon" className="rounded-control hover:bg-surface-3">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-display text-ink">
            Calendario de Eventos
          </h1>
          <p className="mt-1 text-body text-ink-2">
            Gestiona reuniones, vencimientos y fechas importantes
          </p>
        </div>
      </div>

      <CalendarioEventos />
    </div>
  )
}

