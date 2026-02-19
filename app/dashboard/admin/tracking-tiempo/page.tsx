import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold text-brand-900">Tracking de Tiempo</h2>
          <p className="text-gray-600 mt-1">
            Analiza tiempos promedio y cuellos de botella en el proceso
          </p>
        </div>
      </div>

      <TrackingTiempo />
    </div>
  )
}

