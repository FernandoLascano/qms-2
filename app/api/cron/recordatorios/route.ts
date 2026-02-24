import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import {
  enviarRecordatorioPago,
  enviarRecordatorioDocumento,
  enviarRecordatorioTramiteEstancado,
  enviarAlertaDenominacion
} from '@/lib/emails/send'

// Verificar token de seguridad para cron jobs (timing-safe)
function verificarAutorizacion(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || !authHeader) return false

  const token = authHeader.replace('Bearer ', '')
  try {
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(cronSecret)
    )
  } catch {
    return false
  }
}

export async function GET(request: Request) {
  // Verificar autorización
  if (!verificarAutorizacion(request)) {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 401 }
    )
  }

  const resultados = {
    pagosPendientes: 0,
    documentosRechazados: 0,
    tramitesEstancados: 0,
    denominacionesPorVencer: 0,
    errores: [] as string[]
  }

  try {
    // ==========================================
    // 1. RECORDATORIOS DE PAGOS PENDIENTES
    // ==========================================
    const hace3Dias = new Date()
    hace3Dias.setDate(hace3Dias.getDate() - 3)

    const hace7Dias = new Date()
    hace7Dias.setDate(hace7Dias.getDate() - 7)

    // Enlaces de pago externos pendientes (3 y 7 días)
    const enlacesPendientes = await prisma.enlacePago.findMany({
      where: {
        estado: 'PENDIENTE',
        OR: [
          {
            createdAt: {
              lte: hace3Dias,
              gte: hace7Dias
            },
            recordatorio3Dias: false // No se ha enviado recordatorio aún
          },
          {
            createdAt: {
              lte: hace7Dias
            },
            recordatorio7Dias: false // No se ha enviado segundo recordatorio
          }
        ]
      },
      include: {
        tramite: {
          include: {
            user: {
              select: {
                email: true,
                name: true
              }
            }
          }
        }
      }
    })

    for (const enlace of enlacesPendientes) {
      const diasPendientes = Math.floor(
        (Date.now() - enlace.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      )

      try {
        await enviarRecordatorioPago(
          enlace.tramite.user.email,
          enlace.tramite.user.name,
          enlace.concepto,
          enlace.monto,
          diasPendientes,
          enlace.tramiteId
        )

        // Marcar que se envió el recordatorio
        if (diasPendientes >= 7) {
          await prisma.enlacePago.update({
            where: { id: enlace.id },
            data: { recordatorio7Dias: true }
          })
        } else if (diasPendientes >= 3) {
          await prisma.enlacePago.update({
            where: { id: enlace.id },
            data: { recordatorio3Dias: true }
          })
        }

        resultados.pagosPendientes++
      } catch (error: any) {
        console.error(`Error enviando recordatorio de pago ${enlace.id}:`, error)
        resultados.errores.push(`Pago ${enlace.id}: ${error.message}`)
      }
    }

    // Pagos de Mercado Pago pendientes
    const pagosMPPendientes = await prisma.pago.findMany({
      where: {
        estado: 'PENDIENTE',
        OR: [
          {
            createdAt: {
              lte: hace3Dias,
              gte: hace7Dias
            },
            recordatorio3Dias: false
          },
          {
            createdAt: {
              lte: hace7Dias
            },
            recordatorio7Dias: false
          }
        ]
      },
      include: {
        tramite: {
          include: {
            user: {
              select: {
                email: true,
                name: true
              }
            }
          }
        }
      }
    })

    for (const pago of pagosMPPendientes) {
      const diasPendientes = Math.floor(
        (Date.now() - pago.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      )

      try {
        await enviarRecordatorioPago(
          pago.tramite.user.email,
          pago.tramite.user.name,
          pago.concepto,
          pago.monto,
          diasPendientes,
          pago.tramiteId
        )

        // Marcar que se envió el recordatorio
        if (diasPendientes >= 7) {
          await prisma.pago.update({
            where: { id: pago.id },
            data: { recordatorio7Dias: true }
          })
        } else if (diasPendientes >= 3) {
          await prisma.pago.update({
            where: { id: pago.id },
            data: { recordatorio3Dias: true }
          })
        }

        resultados.pagosPendientes++
      } catch (error: any) {
        console.error(`Error enviando recordatorio de pago MP ${pago.id}:`, error)
        resultados.errores.push(`Pago MP ${pago.id}: ${error.message}`)
      }
    }

    // ==========================================
    // 2. RECORDATORIOS DE DOCUMENTOS RECHAZADOS
    // ==========================================
    const documentosRechazados = await prisma.documento.findMany({
      where: {
        estado: 'RECHAZADO',
        updatedAt: {
          lte: hace7Dias
        },
        recordatorioEnviado: false
      },
      include: {
        tramite: {
          include: {
            user: {
              select: {
                email: true,
                name: true
              }
            }
          }
        }
      }
    })

    for (const documento of documentosRechazados) {
      const diasPendientes = Math.floor(
        (Date.now() - documento.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
      )

      try {
        await enviarRecordatorioDocumento(
          documento.tramite.user.email,
          documento.tramite.user.name,
          documento.nombre,
          documento.observaciones || 'Por favor, revisa y corrige el documento.',
          diasPendientes,
          documento.tramiteId
        )

        // Marcar que se envió el recordatorio
        await prisma.documento.update({
          where: { id: documento.id },
          data: { recordatorioEnviado: true }
        })

        resultados.documentosRechazados++
      } catch (error: any) {
        console.error(`Error enviando recordatorio de documento ${documento.id}:`, error)
        resultados.errores.push(`Documento ${documento.id}: ${error.message}`)
      }
    }

    // ==========================================
    // 3. RECORDATORIOS DE TRÁMITES ESTANCADOS
    // ==========================================
    const hace10Dias = new Date()
    hace10Dias.setDate(hace10Dias.getDate() - 10)

    const tramitesEstancados = await prisma.tramite.findMany({
      where: {
        estadoGeneral: {
          notIn: ['COMPLETADO', 'CANCELADO']
        },
        updatedAt: {
          lte: hace10Dias
        },
        recordatorioEstancado: false
      },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    })

    for (const tramite of tramitesEstancados) {
      const diasEstancado = Math.floor(
        (Date.now() - tramite.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Determinar etapa actual
      let etapaActual = 'En proceso'
      if (!tramite.denominacionReservada) {
        etapaActual = 'Reserva de denominación'
      } else if (!tramite.capitalDepositado) {
        etapaActual = 'Depósito de capital'
      } else if (!tramite.tasaPagada) {
        etapaActual = 'Pago de tasas'
      } else if (!tramite.documentosRevisados) {
        etapaActual = 'Revisión de documentos'
      } else if (!tramite.documentosFirmados) {
        etapaActual = 'Firma de documentos'
      } else if (!tramite.tramiteIngresado) {
        etapaActual = 'Ingreso del trámite'
      }

      try {
        await enviarRecordatorioTramiteEstancado(
          tramite.user.email,
          tramite.user.name,
          etapaActual,
          diasEstancado,
          tramite.id
        )

        // Marcar que se envió el recordatorio
        await prisma.tramite.update({
          where: { id: tramite.id },
          data: { recordatorioEstancado: true }
        })

        resultados.tramitesEstancados++
      } catch (error: any) {
        console.error(`Error enviando recordatorio de trámite estancado ${tramite.id}:`, error)
        resultados.errores.push(`Trámite estancado ${tramite.id}: ${error.message}`)
      }
    }

    // ==========================================
    // 4. ALERTAS DE DENOMINACIONES POR VENCER
    // ==========================================
    // Las reservas de denominación suelen tener 30-60 días de vigencia
    // Alertamos cuando faltan 5 días para vencer
    const hace25Dias = new Date()
    hace25Dias.setDate(hace25Dias.getDate() - 25)

    const tramitesConDenominacionPorVencer = await prisma.tramite.findMany({
      where: {
        denominacionReservada: true,
        sociedadInscripta: false,
        denominacionReservadaFecha: {
          lte: hace25Dias, // Reserva hace más de 25 días
          not: null
        },
        alertaDenominacionEnviada: false
      },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    })

    for (const tramite of tramitesConDenominacionPorVencer) {
      if (!tramite.denominacionReservadaFecha) continue

      // Calcular días desde la reserva (asumiendo 30 días de vigencia)
      const diasDesdeReserva = Math.floor(
        (Date.now() - tramite.denominacionReservadaFecha.getTime()) / (1000 * 60 * 60 * 24)
      )
      const diasParaVencer = 30 - diasDesdeReserva

      if (diasParaVencer <= 5 && diasParaVencer > 0) {
        try {
          // Enviar alerta al admin (necesitamos el email del admin)
          const adminUsers = await prisma.user.findMany({
            where: { rol: 'ADMIN' }
          })

          for (const admin of adminUsers) {
            await enviarAlertaDenominacion(
              admin.email,
              admin.name,
              tramite.denominacionSocial1,
              diasParaVencer,
              tramite.id
            )
          }

          // Marcar que se envió la alerta
          await prisma.tramite.update({
            where: { id: tramite.id },
            data: { alertaDenominacionEnviada: true }
          })

          resultados.denominacionesPorVencer++
        } catch (error: any) {
          console.error(`Error enviando alerta de denominación ${tramite.id}:`, error)
          resultados.errores.push(`Denominación ${tramite.id}: ${error.message}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      mensaje: 'Recordatorios procesados exitosamente',
      resultados
    })
  } catch (error: any) {
    console.error('Error en cron recordatorios:', error)
    return NextResponse.json(
      {
        error: 'Error al procesar recordatorios',
        resultados
      },
      { status: 500 }
    )
  }
}

