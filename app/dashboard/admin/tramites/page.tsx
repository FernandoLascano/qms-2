import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'
import TramitesLista from '@/components/admin/TramitesLista'

async function AdminTramitesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.rol !== 'ADMIN') redirect('/dashboard')

  // Solo los trámites que el cliente envió. Los borradores sin terminar se
  // gestionan como leads en /dashboard/admin/leads.
  const tramites = await prisma.tramite.findMany({
    where: { formularioCompleto: true },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      _count: { select: { documentos: { where: { estado: 'PENDIENTE' } } } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <div className="space-y-section">
      <PageHeader
        title="Trámites"
        description={`${tramites.length} ${tramites.length === 1 ? 'trámite' : 'trámites'} con formulario enviado`}
        breadcrumbs={[{ label: 'Hoy', href: '/dashboard/admin' }, { label: 'Trámites' }]}
      />

      <TramitesLista tramites={tramites} />
    </div>
  )
}

export default AdminTramitesPage
