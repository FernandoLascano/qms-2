import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import CalendarioEventos from '@/components/admin/CalendarioEventos'
import { PageHeader } from '@/components/ui/page-header'

export default async function CalendarioPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.rol !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Calendario"
        description="Reuniones, vencimientos y fechas importantes."
        breadcrumbs={[{ label: 'Hoy', href: '/dashboard/admin' }, { label: 'Calendario' }]}
      />

      <CalendarioEventos />
    </div>
  )
}

