import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Endpoint temporal para crear notificaciones de prueba
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { tipo, titulo, mensaje, link } = body

    // Crear notificación
    const notificacion = await prisma.notificacion.create({
      data: {
        userId: session.user.id,
        tipo: tipo || 'INFO',
        titulo: titulo || 'Notificación de prueba',
        mensaje: mensaje || 'Esta es una notificación de prueba creada desde el endpoint temporal',
        link: link || '/dashboard',
        leida: false
      }
    })

    console.log('✅ Notificación de prueba creada:', notificacion.id)

    return NextResponse.json({
      success: true,
      notificacion: {
        id: notificacion.id,
        tipo: notificacion.tipo,
        titulo: notificacion.titulo,
        mensaje: notificacion.mensaje
      }
    })
  } catch (error) {
    console.error('Error al crear notificación de prueba:', error)
    return NextResponse.json({ error: 'Error al crear notificación' }, { status: 500 })
  }
}

// GET para crear notificación rápida sin body
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Tipos de notificaciones aleatorias
    const tipos = ['INFO', 'EXITO', 'ALERTA', 'ERROR', 'ACCION_REQUERIDA', 'MENSAJE']
    const tipoAleatorio = tipos[Math.floor(Math.random() * tipos.length)]

    const mensajes = [
      {
        tipo: 'INFO',
        titulo: 'Nueva actualización disponible',
        mensaje: 'Hay una nueva versión del sistema disponible. Por favor, actualiza cuando puedas.',
        link: '/dashboard'
      },
      {
        tipo: 'EXITO',
        titulo: 'Documento aprobado',
        mensaje: 'Tu documento "Estatuto Social" ha sido aprobado por el equipo administrativo.',
        link: '/dashboard/documentos'
      },
      {
        tipo: 'ALERTA',
        titulo: 'Pago pendiente',
        mensaje: 'Tienes un pago pendiente de $50,000. Por favor, realiza el pago antes del 31/12.',
        link: '/dashboard'
      },
      {
        tipo: 'ERROR',
        titulo: 'Error al procesar documento',
        mensaje: 'No pudimos procesar tu documento. Por favor, verifica el formato y vuelve a subirlo.',
        link: '/dashboard/documentos'
      },
      {
        tipo: 'ACCION_REQUERIDA',
        titulo: 'Acción requerida: Firma de documentos',
        mensaje: 'Los documentos para firma están listos. Por favor, revísalos y fírmalos lo antes posible.',
        link: '/dashboard/tramites'
      },
      {
        tipo: 'MENSAJE',
        titulo: 'Nuevo mensaje del equipo',
        mensaje: 'El equipo administrativo ha respondido a tu consulta sobre el trámite.',
        link: '/dashboard/tramites'
      }
    ]

    const mensajeAleatorio = mensajes.find(m => m.tipo === tipoAleatorio) || mensajes[0]

    // Crear notificación
    const notificacion = await prisma.notificacion.create({
      data: {
        userId: session.user.id,
        tipo: mensajeAleatorio.tipo as any,
        titulo: mensajeAleatorio.titulo,
        mensaje: mensajeAleatorio.mensaje,
        link: mensajeAleatorio.link,
        leida: false
      }
    })

    console.log('✅ Notificación aleatoria creada:', notificacion.id, '-', mensajeAleatorio.tipo)

    return NextResponse.json({
      success: true,
      message: 'Notificación creada. Deberías verla en máximo 5 segundos.',
      notificacion: {
        id: notificacion.id,
        tipo: notificacion.tipo,
        titulo: notificacion.titulo,
        mensaje: notificacion.mensaje
      }
    })
  } catch (error) {
    console.error('Error al crear notificación de prueba:', error)
    return NextResponse.json({ error: 'Error al crear notificación' }, { status: 500 })
  }
}
