import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadToSupabase } from '@/lib/supabase-storage'
import { enviarEmailNotificacion } from '@/lib/emails/send'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const tramiteId = formData.get('tramiteId') as string
    const userId = formData.get('userId') as string

    // Soporta múltiples documentos en un solo envío (para mandar un único email),
    // cada uno con sus propias instrucciones.
    const files = formData.getAll('files') as File[]
    const tipos = formData.getAll('tipos') as string[]
    const nombres = formData.getAll('nombres') as string[]
    const descripciones = formData.getAll('descripciones') as string[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No se proporcionaron archivos' }, { status: 400 })
    }
    if (!tramiteId || !userId) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
    }

    const tramite = await prisma.tramite.findUnique({ where: { id: tramiteId } })
    if (!tramite) {
      return NextResponse.json({ error: 'Trámite no encontrado' }, { status: 404 })
    }

    const nombresGuardados: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file || typeof (file as any).arrayBuffer !== 'function') continue

      const buffer = Buffer.from(await file.arrayBuffer())
      const uploadResult = await uploadToSupabase(buffer, `documentos-admin/${tramiteId}`, file.name, file.type)
      if (!uploadResult?.url) continue

      const nombre = (nombres[i] || file.name.replace(/\.[^/.]+$/, '')).trim()
      const tipo = tipos[i] || 'DOCUMENTO_PARA_FIRMAR'
      const descripcion = (descripciones[i] || '').trim() || 'Documento para firmar'

      await prisma.documento.create({
        data: {
          tramiteId,
          userId,
          nombre,
          descripcion,
          url: uploadResult.url,
          tamanio: buffer.length,
          mimeType: file.type || 'application/pdf',
          tipo: tipo as any,
          estado: 'PENDIENTE'
        }
      })
      nombresGuardados.push(nombre)
    }

    if (nombresGuardados.length === 0) {
      return NextResponse.json({ error: 'No se pudo subir ningún archivo. Intentá de nuevo.' }, { status: 500 })
    }

    // Marca la etapa de documentos enviados.
    await prisma.tramite.update({
      where: { id: tramiteId },
      data: { documentosRevisados: true }
    })

    // UN SOLO aviso al cliente por todo el envío.
    const listado = nombresGuardados.map(n => `• ${n}`).join('\n')
    const mensaje = `Los documentos de tu Sociedad ya están listos para firmar:\n${listado}\n\nIngresá a tu panel: cada documento tiene sus instrucciones específicas de firma.`

    try {
      await prisma.notificacion.create({
        data: {
          userId,
          tramiteId,
          tipo: 'ACCION_REQUERIDA',
          titulo: 'Documentos listos para firmar',
          mensaje,
          link: `/dashboard/tramites/${tramiteId}#documentos-para-firmar`
        }
      })
      const usuario = await prisma.user.findUnique({ where: { id: userId } })
      if (usuario) {
        await enviarEmailNotificacion(usuario.email, usuario.name || 'Usuario', 'Documentos listos para firmar', mensaje, tramiteId)
      }
    } catch {
      // Aviso no crítico
    }

    return NextResponse.json({ success: true, enviados: nombresGuardados.length })
  } catch {
    return NextResponse.json({ error: 'Error al subir documentos' }, { status: 500 })
  }
}
