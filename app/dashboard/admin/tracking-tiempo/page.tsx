import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import TrackingTiempo from '@/components/admin/TrackingTiempo'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function TrackingTiempoPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.rol !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-section">
      <PageHeader
        title="Tiempos del proceso"
        description="Cuánto tarda cada etapa y dónde se traba el trámite."
        breadcrumbs={[{ label: 'Hoy', href: '/dashboard/admin' }, { label: 'Tiempos' }]}
      />

      <TrackingTiempo />
    </div>
  )
}

