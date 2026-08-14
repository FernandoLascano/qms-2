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

  // La guía solo se habilita para clientes que ya tienen su sociedad inscripta
  // (abonaron y completaron el trámite). No es de acceso libre al registrarse.
  const sociedadesInscriptas = await prisma.tramite.count({
    where: { userId: session.user.id, sociedadInscripta: true }
  })
  const habilitada = sociedadesInscriptas > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-7 w-7 text-brand-700" />
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Guía de Libros Digitales</h1>
          <p className="text-sm text-gray-500">Todo lo que necesitás saber para llevar los libros de tu sociedad.</p>
        </div>
      </div>

      {habilitada ? (
        <GuiaLibrosDigitales />
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
          <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700">La guía estará disponible cuando tu sociedad esté inscripta.</p>
          <p className="text-sm text-gray-500 mt-1">Es un beneficio incluido en tu plan, para usar una vez constituida tu sociedad.</p>
        </div>
      )}
    </div>
  )
}
