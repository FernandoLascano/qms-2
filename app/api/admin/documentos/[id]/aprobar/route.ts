import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { enviarEmailNotificacion } from '@/lib/emails/send'

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

    // Actualizar documento
    const documento = await prisma.documento.update({
      where: { id },
      data: {
        estado: 'APROBADO',
        fechaAprobacion: new Date(),
        observaciones: null
      }
    })

    // Si es un comprobante de pago, actualizar o registrar el pago automáticamente
    // 1) Primero intentar encontrar un pago relacionado por comprobanteTransferenciaId (flujo de transferencia)
    let pagoExistente = await prisma.pago.findFirst({
      where: {
        comprobanteTransferenciaId: documento.id
      }
    })

    // 2) Si no lo encuentra y el nombre sugiere que es un comprobante de transferencia,
    // buscar el último pago de TRANSFERENCIA pendiente/procesando de este trámite
    if (!pagoExistente && documento.nombre?.toLowerCase().includes('comprobante de transferencia')) {
      pagoExistente = await prisma.pago.findFirst({
        where: {
          tramiteId: documento.tramiteId || undefined,
          metodoPago: 'TRANSFERENCIA',
          estado: {
            in: ['PENDIENTE', 'PROCESANDO']
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    }

    if (pagoExistente) {
      // Si existe un pago relacionado, actualizarlo a APROBADO
      const pagoActualizado = await prisma.pago.update({
        where: { id: pagoExistente.id },
        data: {
          estado: 'APROBADO',
          fechaPago: new Date()
        }
      })
      
      // Notificar al usuario sobre la aprobación del pago
      await prisma.notificacion.create({
        data: {
          userId: documento.userId,
          tramiteId: documento.tramiteId,
          tipo: 'EXITO',
          titulo: 'Pago Aprobado',
          mensaje: `Tu comprobante de transferencia ha sido aprobado. El pago de $${pagoActualizado.monto.toLocaleString('es-AR')} ha sido registrado como aprobado.`,
          link: `/dashboard/tramites/${documento.tramiteId}`
        }
      })

      // Enviar email al usuario
      const usuario = await prisma.user.findUnique({
        where: { id: documento.userId }
      })
      if (usuario) {
        try {
          await enviarEmailNotificacion(
            usuario.email,
            usuario.name || 'Usuario',
            'Pago Aprobado',
            `Tu comprobante de transferencia ha sido aprobado. El pago de $${pagoActualizado.monto.toLocaleString('es-AR')} ha sido registrado correctamente.`,
            documento.tramiteId || undefined
          )
        } catch {
          // Email no crítico
        }
      }
    } else if (documento.tipo === 'COMPROBANTE_DEPOSITO') {
      // Si no existe un pago relacionado pero es un COMPROBANTE_DEPOSITO, crear uno nuevo
      try {
        // Intentar inferir el concepto desde el nombre (ej: "Comprobante - TASA_RETRIBUTIVA")
        let conceptoPago: any = 'OTROS'
        const match = documento.nombre.match(/Comprobante - (.+)$/)
        if (match && match[1]) {
          const posibleConcepto = match[1].trim().toUpperCase()
          const conceptosValidos = [
            'HONORARIOS_BASICO',
            'HONORARIOS_EMPRENDEDOR',
            'HONORARIOS_PREMIUM',
            'DEPOSITO_CAPITAL',
            'TASA_RETRIBUTIVA',
            'TASA_RESERVA_NOMBRE',
            'PUBLICACION_BOLETIN',
            'CERTIFICACION_FIRMA',
            'OTROS'
          ]
          if (conceptosValidos.includes(posibleConcepto)) {
            conceptoPago = posibleConcepto
          }
        }

        let monto = 0

        if (documento.tramiteId) {
          if (conceptoPago === 'DEPOSITO_CAPITAL') {
            // Depósito de capital: obtener el monto desde la cuenta bancaria guardada
            // Buscar por ID compuesto (nuevo formato) o por tramiteId + tipo (fallback)
            let cuenta = await prisma.cuentaBancaria.findUnique({
              where: {
                id: `${documento.tramiteId}_DEPOSITO_CAPITAL`
              }
            })

            if (!cuenta) {
              // Fallback: buscar por tramiteId y tipo
              cuenta = await prisma.cuentaBancaria.findFirst({
                where: {
                  tramiteId: documento.tramiteId,
                  tipo: 'DEPOSITO_CAPITAL'
                }
              })
            }

            if (cuenta) {
              monto = cuenta.montoEsperado
            } else {
              // Fallback: calcular 25% del capital social del trámite
              const tramite = await prisma.tramite.findUnique({
                where: { id: documento.tramiteId },
                select: { capitalSocial: true }
              })
              if (tramite?.capitalSocial) {
                monto = tramite.capitalSocial * 0.25
              }
            }
          } else {
            // Buscar enlace de pago relacionado en estado PROCESANDO o PENDIENTE
            // PROCESANDO = el usuario ya confirmó el pago con el botón "Ya Pagué"
            // PENDIENTE = el admin aprobó el comprobante directamente
            const enlaceRelacionado = await prisma.enlacePago.findFirst({
              where: {
                tramiteId: documento.tramiteId,
                estado: { in: ['PROCESANDO', 'PENDIENTE'] },
                concepto: typeof conceptoPago === 'string' ? conceptoPago : undefined
              },
              orderBy: { createdAt: 'desc' }
            })

            if (enlaceRelacionado) {
              monto = enlaceRelacionado.monto

              // Marcar el enlace de pago como PAGADO
              await prisma.enlacePago.update({
                where: { id: enlaceRelacionado.id },
                data: {
                  estado: 'PAGADO',
                  fechaPago: new Date()
                }
              })
            } else {
              // Si no hay enlace, intentar obtener el monto del último enlace con ese concepto (aunque esté PAGADO)
              const enlaceAnterior = await prisma.enlacePago.findFirst({
                where: {
                  tramiteId: documento.tramiteId,
                  concepto: typeof conceptoPago === 'string' ? conceptoPago : undefined
                },
                orderBy: { createdAt: 'desc' }
              })
              if (enlaceAnterior) {
                monto = enlaceAnterior.monto
              }
            }
          }
        }

        // Obtener texto legible del concepto para notificaciones
        const conceptoTexto = conceptoPago === 'TASA_RESERVA_NOMBRE'
          ? 'Tasa de Reserva de Nombre'
          : conceptoPago === 'TASA_RETRIBUTIVA'
          ? 'Tasa Retributiva'
          : conceptoPago === 'PUBLICACION_BOLETIN'
          ? 'Publicación en Boletín'
          : conceptoPago === 'DEPOSITO_CAPITAL'
          ? 'Depósito de Capital'
          : conceptoPago

        // Crear el registro de pago
        if (documento.tramiteId && documento.userId) {
          await prisma.pago.create({
            data: {
              tramiteId: documento.tramiteId,
              userId: documento.userId,
              concepto: conceptoPago,
              monto,
              moneda: 'ARS',
              estado: 'APROBADO',
              metodoPago: 'TRANSFERENCIA',
              fechaPago: new Date()
            }
          })

          // Crear notificación al usuario de pago aprobado
          await prisma.notificacion.create({
            data: {
              userId: documento.userId,
              tramiteId: documento.tramiteId,
              tipo: 'EXITO',
              titulo: 'Pago Aprobado',
              mensaje: `Tu comprobante de ${conceptoTexto} ha sido aprobado. El pago de $${monto.toLocaleString('es-AR')} ha sido registrado correctamente.`,
              link: `/dashboard/tramites/${documento.tramiteId}#enlaces-pago`
            }
          })

          // Enviar email al usuario
          const usuario = await prisma.user.findUnique({
            where: { id: documento.userId }
          })
          if (usuario) {
            try {
              await enviarEmailNotificacion(
                usuario.email,
                usuario.name || 'Usuario',
                'Pago Aprobado',
                `Tu comprobante de ${conceptoTexto} ha sido aprobado. El pago de $${monto.toLocaleString('es-AR')} ha sido registrado correctamente.`,
                documento.tramiteId || undefined
              )
            } catch {
              // Email no crítico
            }
          }
        }
      } catch {
        // Error registrando pago automático, continuar
      }
    }

    // Notificar al usuario (solo si no es un comprobante de pago, ya que se notificó arriba)
    const esComprobantePago = pagoExistente || documento.tipo === 'COMPROBANTE_DEPOSITO'
    if (!esComprobantePago) {
      await prisma.notificacion.create({
        data: {
          userId: documento.userId,
          tramiteId: documento.tramiteId,
          tipo: 'EXITO',
          titulo: 'Documento aprobado',
          mensaje: `Tu documento "${documento.nombre}" ha sido aprobado.`,
          link: `/dashboard/tramites/${documento.tramiteId}`
        }
      })
    }

    return NextResponse.json({ success: true })

  } catch {
    return NextResponse.json(
      { error: 'Error al aprobar documento' },
      { status: 500 }
    )
  }
}

