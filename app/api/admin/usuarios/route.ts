import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  motivoUsuarioNoEliminable,
  WHERE_ENLACES_PAGADOS,
  WHERE_PAGOS_APROBADOS,
} from '@/lib/tramites/eliminacion'

// GET - Listar todos los usuarios
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const usuarios = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        rol: true,
        referredAt: true,
        referralSource: true,
        partner: {
          select: {
            id: true,
            nombre: true,
            slug: true,
          }
        },
        createdAt: true,
        _count: {
          select: {
            tramites: true
          }
        }
      }
    })

    // Obtener último trámite de cada usuario en UNA sola query (evita N+1)
    const userIds = usuarios.map(u => u.id)
    const ultimosTramites = await prisma.tramite.findMany({
      where: { userId: { in: userIds } },
      orderBy: { createdAt: 'desc' },
      distinct: ['userId'],
      select: {
        userId: true,
        denominacionSocial1: true,
        estadoGeneral: true,
        createdAt: true
      }
    })

    const tramiteMap = new Map(ultimosTramites.map(t => [t.userId, t]))

    // Trámites que impiden borrar al usuario (misma regla que el DELETE), para
    // que la pantalla deshabilite el botón y muestre el motivo.
    const protegidos = await prisma.tramite.findMany({
      where: {
        userId: { in: userIds },
        OR: [
          { sociedadInscripta: true },
          { estadoGeneral: 'COMPLETADO' },
          { pagos: { some: WHERE_PAGOS_APROBADOS } },
          { enlacesPago: { some: WHERE_ENLACES_PAGADOS } },
        ],
      },
      select: {
        userId: true,
        denominacionAprobada: true,
        denominacionSocial1: true,
        sociedadInscripta: true,
        estadoGeneral: true,
        _count: {
          select: {
            pagos: { where: WHERE_PAGOS_APROBADOS },
            enlacesPago: { where: WHERE_ENLACES_PAGADOS },
          },
        },
      },
    })
    const protegidosPorUsuario = new Map<string, typeof protegidos>()
    for (const t of protegidos) {
      protegidosPorUsuario.set(t.userId, [...(protegidosPorUsuario.get(t.userId) ?? []), t])
    }

    const usuariosConInfo = usuarios.map(user => ({
      ...user,
      ultimoTramite: tramiteMap.get(user.id) || null,
      motivoNoEliminable: motivoUsuarioNoEliminable(protegidosPorUsuario.get(user.id) ?? []),
    }))

    return NextResponse.json(usuariosConInfo)

  } catch {
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    )
  }
}
