import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import TramitesLista from '@/components/admin/TramitesLista'

async function AdminTramitesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.rol !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Solo los trámites que el cliente envió. Los borradores sin terminar se
  // gestionan como leads en /dashboard/admin/leads.
  const tramites = await prisma.tramite.findMany({
    where: { formularioCompleto: true },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-brand-900">Gestión de Trámites</h2>
          <p className="text-gray-600 mt-1">
            Administra todos los trámites de la plataforma
          </p>
        </div>
        <Link href="/dashboard/admin">
          <Button variant="outline">
            ← Volver al Panel
          </Button>
        </Link>
      </div>

      {/* Lista de Trámites con Filtros */}
      <TramitesLista tramites={tramites} />
    </div>
  )
}

export default AdminTramitesPage

