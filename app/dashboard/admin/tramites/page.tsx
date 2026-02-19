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

  // Obtener todos los trámites
  const todosTramites = await prisma.tramite.findMany({
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

  // Filtrar duplicados: si hay un trámite completado y un borrador con la misma denominación, mostrar solo el completado
  const tramitesMap = new Map()
  todosTramites.forEach((tramite: any) => {
    const key = tramite.denominacionSocial1
    const existing = tramitesMap.get(key)
    
    if (!existing) {
      tramitesMap.set(key, tramite)
    } else {
      // Si el nuevo es completado y el existente es borrador, reemplazar
      if (tramite.formularioCompleto && !existing.formularioCompleto) {
        tramitesMap.set(key, tramite)
      }
      // Si ambos son completados o ambos son borradores, mantener el más reciente
      else if (tramite.createdAt > existing.createdAt) {
        tramitesMap.set(key, tramite)
      }
    }
  })

  const tramites = Array.from(tramitesMap.values())

  const getEstadoColor = (tramite: any) => {
    const progreso = calcularProgreso(tramite)
    
    // Si está al 100%, mostrar verde (Completado)
    if (progreso === 100 || tramite.sociedadInscripta) {
      return 'bg-green-100 text-green-800 border-green-200'
    }
    
    // Si tiene formulario completado pero no está al 100%, mostrar azul (En Proceso)
    if (tramite.formularioCompleto && progreso < 100) {
      return 'bg-blue-100 text-blue-800 border-blue-200'
    }
    
    // Para otros estados
    switch (tramite.estadoGeneral) {
      case 'ESPERANDO_CLIENTE':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'ESPERANDO_APROBACION':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'CANCELADO':
        return 'bg-brand-100 text-brand-800 border-brand-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getEstadoTexto = (tramite: any) => {
    const progreso = calcularProgreso(tramite)
    
    // Si está al 100%, mostrar "Completado"
    if (progreso === 100 || tramite.sociedadInscripta) {
      return 'Completado'
    }
    
    // Si tiene formulario completado pero no está al 100%, mostrar "En Proceso"
    if (tramite.formularioCompleto && progreso < 100) {
      return 'En Proceso'
    }
    
    // Para otros estados
    switch (tramite.estadoGeneral) {
      case 'ESPERANDO_CLIENTE': return 'Esperando Cliente'
      case 'ESPERANDO_APROBACION': return 'Esperando Aprobación'
      case 'INICIADO': return 'Iniciado'
      case 'CANCELADO': return 'Cancelado'
      default: return tramite.estadoGeneral
    }
  }

  // Calcular progreso (igual que en panel de usuario)
  const calcularProgreso = (tramite: any) => {
    const etapas = [
      tramite.formularioCompleto,
      tramite.denominacionReservada,
      tramite.capitalDepositado,
      tramite.tasaPagada,
      tramite.documentosFirmados,
      tramite.tramiteIngresado,
      tramite.sociedadInscripta
    ]
    const completadas = etapas.filter(Boolean).length
    return Math.round((completadas / etapas.length) * 100)
  }

  // Obtener la etapa actual del trámite
  const obtenerEtapaActual = (tramite: any) => {
    if (!tramite.formularioCompleto) return 'Formulario pendiente'
    if (!tramite.denominacionReservada) return 'Esperando reserva de denominación'
    if (!tramite.capitalDepositado) return 'Esperando depósito de capital'
    if (!tramite.tasaPagada) return 'Esperando pago de tasa'
    if (!tramite.documentosFirmados) return 'Esperando firma de documentos'
    if (!tramite.tramiteIngresado) return 'Esperando ingreso del trámite'
    if (!tramite.sociedadInscripta) return 'Esperando inscripción'
    return 'Sociedad inscripta'
  }

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

