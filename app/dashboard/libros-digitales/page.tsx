import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BookOpen } from 'lucide-react'
import GuiaLibrosDigitales from '@/components/cliente/GuiaLibrosDigitales'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Libros Digitales' }

export default async function LibrosDigitalesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  // La "Guía de uso de Libros Digitales" está incluida en todos los planes.
  // Mostramos si el cliente tiene al menos un trámite.
  const tieneTramite = await prisma.tramite.count({ where: { userId: session.user.id } })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-7 w-7 text-brand-700" />
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Guía de Libros Digitales</h1>
          <p className="text-sm text-gray-500">Todo lo que necesitás saber para llevar los libros de tu sociedad.</p>
        </div>
      </div>

      {tieneTramite === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
          La guía de Libros Digitales está incluida en tu plan y va a estar disponible acá cuando inicies tu trámite de constitución.
        </div>
      ) : (
        <GuiaLibrosDigitales />
      )}
    </div>
  )
}
