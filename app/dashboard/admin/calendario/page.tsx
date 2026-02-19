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
          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <span className="inline-block text-brand-700 font-semibold text-sm tracking-wider uppercase mb-2">
            Agenda
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900">
            Calendario de <span className="text-brand-700">Eventos</span>
          </h1>
          <p className="text-gray-500 mt-2 text-lg">
            Gestiona reuniones, vencimientos y fechas importantes
          </p>
        </div>
      </div>

      <CalendarioEventos />
    </div>
  )
}

