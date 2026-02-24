import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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
        }
      }
    })

    if (!tramite) {
      return NextResponse.json(
        { error: 'Trámite no encontrado' },
        { status: 404 }
      )
    }

    // Proteger trámites específicos que no se pueden eliminar
    const tramitesProtegidos = [
      'DRIX SAS',
      'SPEED AI SOFTWARE',
      'ADOCOR SERVICIOS DE CONSTRUCCION SAS',
      'Drixs SAS',
      'Speed AI Software',
      'Adocor Servicios de Construccion SAS'
    ]

    const denominacion = tramite.denominacionAprobada || tramite.denominacionSocial1 || ''
    if (tramitesProtegidos.some(protegido => denominacion.toUpperCase().includes(protegido.toUpperCase()))) {
      return NextResponse.json(
        { error: 'Este trámite está protegido y no puede ser eliminado' },
        { status: 403 }
      )
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
