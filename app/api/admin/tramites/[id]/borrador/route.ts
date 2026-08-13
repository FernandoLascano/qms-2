import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadToSupabase } from '@/lib/supabase-storage'
import { enviarEmailNotificacion } from '@/lib/emails/send'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST - El admin sube el borrador de los documentos para que el cliente lo controle.
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
    }

    const tramite = await prisma.tramite.findUnique({
      where: { id },
      include: { user: true }
    })
    if (!tramite) {
      return NextResponse.json({ error: 'Trámite no encontrado' }, { status: 404 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const uploadResult = await uploadToSupabase(buffer, `documentos-admin/${id}`, file.name, file.type)
    if (!uploadResult?.url) {
      return NextResponse.json({ error: 'Error al subir el archivo. Por favor intentá de nuevo.' }, { status: 500 })
    }

    await prisma.documento.create({
      data: {
        tramiteId: id,
        userId: tramite.userId,
        nombre: `Borrador - ${tramite.denominacionSocial1}`,
        descripcion: 'Borrador de los documentos de la Sociedad para que el cliente lo controle antes de la firma.',
        url: uploadResult.url,
        tamanio: buffer.length,
        mimeType: file.type || 'application/pdf',
        tipo: 'BORRADOR',
        estado: 'PENDIENTE'
      }
    })

    // Marca la etapa "Borrador Enviado" (reseteando la aprobación por si es un reenvío)
    await prisma.tramite.update({
      where: { id },
      data: {
        borradorEnviado: true,
        fechaBorradorEnviado: new Date(),
        borradorAprobadoCliente: false
      }
    })

    // Un solo aviso al cliente
    const mensaje = 'Te enviamos el borrador de los documentos de tu Sociedad. Revisalo con atención y, si está todo correcto, aprobalo desde tu panel para que preparemos la versión final para la firma.'
    try {
      await prisma.notificacion.create({
        data: {
          userId: tramite.userId,
          tramiteId: id,
          tipo: 'ACCION_REQUERIDA',
          titulo: 'Borrador listo para revisar',
          mensaje,
          link: `/dashboard/tramites/${id}`
        }
      })
      if (tramite.user?.email) {
        await enviarEmailNotificacion(tramite.user.email, tramite.user.name || 'Usuario', 'Borrador listo para revisar', mensaje, id)
      }
    } catch {
      // Aviso no crítico
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error al subir el borrador' }, { status: 500 })
  }
}
