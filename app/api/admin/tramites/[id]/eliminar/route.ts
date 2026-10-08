import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  motivoNoEliminable,
  WHERE_ENLACES_PAGADOS,
  WHERE_PAGOS_APROBADOS,
} from '@/lib/tramites/eliminacion'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// DELETE - Eliminar un trámite y todos sus datos relacionados
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verificar que el trámite existe
    const tramite = await prisma.tramite.findUnique({
      where: { id },
      include: {
        user: {
          select: { email: true, name: true }
        },
        _count: {
          select: {
            pagos: { where: WHERE_PAGOS_APROBADOS },
            enlacesPago: { where: WHERE_ENLACES_PAGADOS }
          }
        }
      }
    })

    if (!tramite) {
      return NextResponse.json(
        { error: 'Trámite no encontrado' },
        { status: 404 }
      )
    }

    // Regla única (lib/tramites/eliminacion): no se borra una sociedad
    // inscripta ni un trámite con cobros. Se chequea ANTES de borrar nada.
    const motivo = motivoNoEliminable({
      sociedadInscripta: tramite.sociedadInscripta,
      estadoGeneral: tramite.estadoGeneral,
      pagosAprobados: tramite._count.pagos,
      enlacesPagados: tramite._count.enlacesPago
    })
    if (motivo) {
      return NextResponse.json({ error: motivo }, { status: 403 })
    }

    // Eliminar todos los datos relacionados
    const [eventosDeleted, cuentasDeleted, enlacesDeleted, pagosDeleted, docsDeleted, notifsDeleted, msgsDeleted] = await Promise.all([
      prisma.evento.deleteMany({ where: { tramiteId: id } }),
      prisma.cuentaBancaria.deleteMany({ where: { tramiteId: id } }),
      prisma.enlacePago.deleteMany({ where: { tramiteId: id } }),
      prisma.pago.deleteMany({ where: { tramiteId: id } }),
      prisma.documento.deleteMany({ where: { tramiteId: id } }),
      prisma.notificacion.deleteMany({ where: { tramiteId: id } }),
      prisma.mensaje.deleteMany({ where: { tramiteId: id } }),
    ])

    // Finalmente eliminar el trámite
    await prisma.tramite.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: `Trámite "${tramite.denominacionSocial1}" eliminado exitosamente`,
      detalles: {
        eventos: eventosDeleted.count,
        cuentasBancarias: cuentasDeleted.count,
        enlacesPago: enlacesDeleted.count,
        pagos: pagosDeleted.count,
        documentos: docsDeleted.count,
        notificaciones: notifsDeleted.count,
        mensajes: msgsDeleted.count
      }
    })

  } catch {
    return NextResponse.json(
      { error: 'Error al eliminar trámite' },
      { status: 500 }
    )
  }
}
