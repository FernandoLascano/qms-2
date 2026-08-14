import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import LeadsLista from '@/components/admin/LeadsLista'

// Los campos JSON del trámite (datosUsuario, socios, administradores) no tienen
// tipo en Prisma, así que se leen con esta forma mínima.
type DatosUsuario = { nombre?: string; apellido?: string; dni?: string; email?: string; telefono?: string }
type Persona = { nombre?: string }

interface TramiteBorrador {
  datosUsuario: unknown
  socios: unknown
  administradores: unknown
  denominacionSocial1: string
  domicilioLegal: string
}

const leerPersonas = (valor: unknown): Persona[] => (Array.isArray(valor) ? (valor as Persona[]) : [])

const leerDatosUsuario = (valor: unknown): DatosUsuario =>
  valor && typeof valor === 'object' ? (valor as DatosUsuario) : {}

// Cuánto completó del formulario, para priorizar a quién llamar primero
function calcularAvance(tramite: TramiteBorrador) {
  const datosUsuario = leerDatosUsuario(tramite.datosUsuario)
  const socios = leerPersonas(tramite.socios)
  const administradores = leerPersonas(tramite.administradores)

  const hitos = [
    !!datosUsuario.nombre,
    !!datosUsuario.dni,
    tramite.denominacionSocial1 !== 'Pendiente de definir',
    tramite.domicilioLegal !== 'A informar' && tramite.domicilioLegal.replace(/[\s,]/g, '') !== '',
    socios.some((s) => s.nombre),
    administradores.some((a) => a.nombre),
  ]

  return Math.round((hitos.filter(Boolean).length / hitos.length) * 100)
}

async function AdminLeadsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.rol !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Leads = formularios empezados y nunca enviados.
  // Se excluye a quien ya tenga algún trámite enviado: ese cliente ya convirtió
  // (y así no aparecen los borradores duplicados que dejaba el auto-guardado).
  const borradores = await prisma.tramite.findMany({
    where: {
      formularioCompleto: false,
      user: {
        tramites: { none: { formularioCompleto: true } }
      }
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true, createdAt: true }
      },
      leadSeguimientos: {
        include: { admin: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { updatedAt: 'desc' }
  })

  const leads = borradores.map((tramite) => {
    const datosUsuario = leerDatosUsuario(tramite.datosUsuario)

    return {
      id: tramite.id,
      denominacion:
        tramite.denominacionSocial1 === 'Pendiente de definir'
          ? null
          : tramite.denominacionSocial1,
      nombre:
        `${datosUsuario.nombre || ''} ${datosUsuario.apellido || ''}`.trim() ||
        tramite.user.name,
      email: datosUsuario.email || tramite.user.email,
      telefono: datosUsuario.telefono || tramite.user.phone || null,
      jurisdiccion: tramite.jurisdiccion,
      plan: tramite.plan,
      avance: calcularAvance(tramite),
      creado: tramite.createdAt.toISOString(),
      ultimaActividad: tramite.updatedAt.toISOString(),
      leadEstado: tramite.leadEstado,
      leadUltimoContacto: tramite.leadUltimoContacto?.toISOString() || null,
      leadProximoContacto: tramite.leadProximoContacto?.toISOString() || null,
      seguimientos: tramite.leadSeguimientos.map((s) => ({
        id: s.id,
        canal: s.canal,
        nota: s.nota,
        admin: s.admin.name,
        createdAt: s.createdAt.toISOString()
      }))
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-display text-ink">Leads</h2>
          <p className="text-ink-2 mt-1">
            Clientes que empezaron el formulario y no lo terminaron
          </p>
        </div>
        <Link href="/dashboard/admin">
          <Button variant="outline">← Volver al Panel</Button>
        </Link>
      </div>

      <LeadsLista leads={leads} />
    </div>
  )
}

export default AdminLeadsPage
