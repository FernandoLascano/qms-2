import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadToCloudinary } from '@/lib/cloudinary'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const formData = await request.formData()
    
    const cuit = formData.get('cuit') as string
    const matricula = formData.get('matricula') as string
    const numeroResolucion = formData.get('numeroResolucion') as string
    const fechaInscripcion = formData.get('fechaInscripcion') as string
    const archivoResolucion = formData.get('archivoResolucion') as File

    // Validar que todos los campos estén presentes
    if (!cuit || !matricula || !numeroResolucion || !fechaInscripcion) {
      return NextResponse.json(
        { error: 'Debes completar CUIT, Matrícula, Resolución de Inscripción y Fecha de Inscripción' },
        { status: 400 }
      )
    }

    if (!archivoResolucion) {
      return NextResponse.json(
        { error: 'Debes subir el archivo de Resolución de Inscripción' },
        { status: 400 }
      )
    }

    // Obtener el trámite para acceder al userId
    const tramite = await prisma.tramite.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!tramite) {
      return NextResponse.json(
        { error: 'Trámite no encontrado' },
        { status: 404 }
      )
    }

    // Subir archivo de resolución a Cloudinary
    const arrayBuffer = await archivoResolucion.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    let urlResolucion: string
    try {
      const uploadResult = await uploadToCloudinary(
        buffer,
        `resoluciones-inscripcion/${id}`,
        archivoResolucion.name,
        archivoResolucion.type
      )
      
      if (!uploadResult?.url) {
        throw new Error('Error al subir archivo a Cloudinary')
      }
      
      urlResolucion = uploadResult.url
    } catch (error) {
      console.error('Error al subir resolución a Cloudinary:', error)
      return NextResponse.json(
        { error: 'Error al subir el archivo de resolución' },
        { status: 500 }
      )
    }

    // Crear documento de resolución
    await prisma.documento.create({
      data: {
        tramiteId: id,
        userId: tramite.userId,
        nombre: `Resolución de Inscripción - ${numeroResolucion}`,
        descripcion: `Resolución de inscripción de la sociedad. CUIT: ${cuit}, Matrícula: ${matricula}`,
        url: urlResolucion,
        tipo: 'RESOLUCION_FINAL',
        estado: 'APROBADO',
        tamanio: archivoResolucion.size,
        mimeType: archivoResolucion.type || 'application/pdf',
        fechaAprobacion: new Date()
      }
    })

    // Actualizar datos finales y completar trámite
    const fechaInscripcionDate = new Date(fechaInscripcion)
    await prisma.tramite.update({
      where: { id },
      data: {
        cuit: cuit,
        matricula: matricula,
        numeroResolucion: numeroResolucion,
        fechaInscripcion: fechaInscripcionDate,
        fechaSociedadInscripta: fechaInscripcionDate,
        sociedadInscripta: true,
        estadoGeneral: 'COMPLETADO'
      }
    })

    // Notificar al usuario
    await prisma.notificacion.create({
      data: {
        userId: tramite.userId,
        tramiteId: id,
        tipo: 'EXITO',
        titulo: '🎉 ¡Tu Sociedad Está Inscripta!',
        mensaje: `¡Felicitaciones! Tu sociedad ha sido inscripta exitosamente. CUIT: ${cuit}, Matrícula: ${matricula}. Puedes descargar la resolución de inscripción desde tu panel.`
      }
    })

    // Enviar email de notificación
    try {
      const { enviarEmailSociedadInscripta } = await import('@/lib/emails/send')
      await enviarEmailSociedadInscripta(
        tramite.user.email,
        tramite.user.name,
        tramite.denominacionAprobada || tramite.denominacionSocial1,
        cuit,
        matricula,
        id
      )
    } catch (error) {
      console.error('Error al enviar email:', error)
      // No fallar si el email no se envía
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error al actualizar datos finales:', error)
    return NextResponse.json(
      { error: 'Error al actualizar datos' },
      { status: 500 }
    )
  }
}

