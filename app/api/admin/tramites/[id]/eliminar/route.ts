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
    console.log(`🗑️ Eliminando trámite: ${tramite.denominacionSocial1} (${id})`)

    // Eliminar eventos
    const eventosDeleted = await prisma.evento.deleteMany({
      where: { tramiteId: id }
    })
    console.log(`   - Eventos eliminados: ${eventosDeleted.count}`)

    // Eliminar cuentas bancarias
    const cuentasDeleted = await prisma.cuentaBancaria.deleteMany({
      where: { tramiteId: id }
    })
    console.log(`   - Cuentas bancarias eliminadas: ${cuentasDeleted.count}`)

    // Eliminar enlaces de pago
    const enlacesDeleted = await prisma.enlacePago.deleteMany({
      where: { tramiteId: id }
    })
    console.log(`   - Enlaces de pago eliminados: ${enlacesDeleted.count}`)

    // Eliminar pagos
    const pagosDeleted = await prisma.pago.deleteMany({
      where: { tramiteId: id }
    })
    console.log(`   - Pagos eliminados: ${pagosDeleted.count}`)

    // Eliminar documentos
    const docsDeleted = await prisma.documento.deleteMany({
      where: { tramiteId: id }
    })
    console.log(`   - Documentos eliminados: ${docsDeleted.count}`)

    // Eliminar notificaciones
    const notifsDeleted = await prisma.notificacion.deleteMany({
      where: { tramiteId: id }
    })
    console.log(`   - Notificaciones eliminadas: ${notifsDeleted.count}`)

    // Eliminar mensajes
    const msgsDeleted = await prisma.mensaje.deleteMany({
      where: { tramiteId: id }
    })
    console.log(`   - Mensajes eliminados: ${msgsDeleted.count}`)

    // Finalmente eliminar el trámite
    await prisma.tramite.delete({
      where: { id }
    })

    console.log(`✅ Trámite ${tramite.denominacionSocial1} eliminado exitosamente`)

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

  } catch (error) {
    console.error('Error al eliminar trámite:', error)
    return NextResponse.json(
      { error: 'Error al eliminar trámite' },
      { status: 500 }
    )
  }
}
