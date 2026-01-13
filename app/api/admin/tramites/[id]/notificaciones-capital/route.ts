import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id: tramiteId } = await params

    const notificaciones = await prisma.notificacion.findMany({
      where: {
        tramiteId,
        titulo: {
          contains: 'Depósito del 25%'
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        createdAt: true,
        mensaje: true,
        titulo: true
      }
    })

    // Parsear metadata de las notificaciones
    const notificacionesConMetadata = notificaciones.map(notif => {
      let metadata = null
      let mensajeLimpio = notif.mensaje

      // Intentar extraer metadata del mensaje
      const metadataMatch = notif.mensaje.match(/__METADATA__({.*?})__END__/)
      if (metadataMatch) {
        try {
          metadata = JSON.parse(metadataMatch[1])
          // Remover metadata del mensaje para mostrar solo el mensaje limpio
          mensajeLimpio = notif.mensaje.replace(/__METADATA__.*?__END__\n\n/, '')
        } catch (e) {
          console.error('Error al parsear metadata:', e)
        }
      }

      // Si no hay metadata en el mensaje, intentar obtener desde CuentaBancaria
      if (!metadata) {
        // Esto se hará en el frontend, pero aquí podemos intentar parsear del mensaje
        const bancoMatch = mensajeLimpio.match(/Banco:\s*([^\n]+)/i)
        const cbuMatch = mensajeLimpio.match(/CBU:\s*([^\n]+)/i)
        const aliasMatch = mensajeLimpio.match(/Alias:\s*([^\n]+)/i)
        const titularMatch = mensajeLimpio.match(/Titular:\s*([^\n]+)/i)
        const montoMatch = mensajeLimpio.match(/Monto a depositar:\s*\$?([^\n]+)/i)

        if (bancoMatch || cbuMatch) {
          metadata = {
            banco: bancoMatch ? bancoMatch[1].trim() : null,
            cbu: cbuMatch ? cbuMatch[1].trim() : null,
            alias: aliasMatch ? aliasMatch[1].trim() : null,
            titular: titularMatch ? titularMatch[1].trim() : null,
            montoEsperado: montoMatch ? parseFloat(montoMatch[1].trim().replace(/\./g, '').replace(',', '.')) : null
          }
        }
      }

      return {
        ...notif,
        metadata,
        mensaje: mensajeLimpio
      }
    })

    return NextResponse.json(notificacionesConMetadata)
  } catch (error) {
    console.error('Error al obtener historial de capital:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

