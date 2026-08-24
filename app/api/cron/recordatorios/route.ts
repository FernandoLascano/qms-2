import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import {
  enviarRecordatorioPago,
  enviarRecordatorioDocumento,
  enviarRecordatorioTramiteEstancado,
  enviarAlertaDenominacion,
  enviarToqueLead
} from '@/lib/emails/send'
import { leerDatosUsuario, segmentoDe } from '@/lib/leads/avance'
import { mensajeEmail, TOQUES } from '@/lib/leads/mensajes'

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

const EMAIL_CONCURRENCY = 5

/** Cola con concurrencia fija (menos picos de SMTP / Fluid). */
async function runWithConcurrency<T>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T) => Promise<void>
): Promise<void> {
  const queue = [...items]
  const n = Math.max(1, Math.min(concurrency, queue.length || 1))
  const runners = Array.from({ length: n }, async () => {
    while (queue.length) {
      const next = queue.shift()
      if (next === undefined) break
      await worker(next)
    }
  })
  await Promise.allSettled(runners)
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
    toquesLeads: 0,
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

    await runWithConcurrency(enlacesPendientes, EMAIL_CONCURRENCY, async (enlace) => {
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
      } catch {
        resultados.errores.push(`Pago ${enlace.id}: error al enviar recordatorio`)
      }
    })

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

    await runWithConcurrency(pagosMPPendientes, EMAIL_CONCURRENCY, async (pago) => {
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
      } catch {
        resultados.errores.push(`Pago MP ${pago.id}: error al enviar recordatorio`)
      }
    })

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

    await runWithConcurrency(documentosRechazados, EMAIL_CONCURRENCY, async (documento) => {
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

        await prisma.documento.update({
          where: { id: documento.id },
          data: { recordatorioEnviado: true }
        })

        resultados.documentosRechazados++
      } catch {
        resultados.errores.push(`Documento ${documento.id}: error al enviar recordatorio`)
      }
    })

    // ==========================================
    // 3. RECORDATORIOS DE TRÁMITES ESTANCADOS
    // ==========================================
    const hace10Dias = new Date()
    hace10Dias.setDate(hace10Dias.getDate() - 10)

    // Sólo trámites YA ENVIADOS.
    //
    // Antes esta consulta también alcanzaba a los borradores, y el mensaje les
    // quedaba absurdo: calcula la "etapa actual" asumiendo que el formulario
    // está terminado, así que a alguien que no cargó ni su nombre le decía que
    // estaba en "Reserva de denominación". Los borradores tienen ahora su
    // propia secuencia, que sabe en qué paso se frenaron.
    const tramitesEstancados = await prisma.tramite.findMany({
      where: {
        formularioCompleto: true,
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

    await runWithConcurrency(tramitesEstancados, EMAIL_CONCURRENCY, async (tramite) => {
      const diasEstancado = Math.floor(
        (Date.now() - tramite.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
      )

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

        await prisma.tramite.update({
          where: { id: tramite.id },
          data: { recordatorioEstancado: true }
        })

        resultados.tramitesEstancados++
      } catch {
        resultados.errores.push(`Trámite estancado ${tramite.id}: error al enviar recordatorio`)
      }
    })

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

    await runWithConcurrency(tramitesConDenominacionPorVencer, EMAIL_CONCURRENCY, async (tramite) => {
      if (!tramite.denominacionReservadaFecha) return

      const diasDesdeReserva = Math.floor(
        (Date.now() - tramite.denominacionReservadaFecha.getTime()) / (1000 * 60 * 60 * 24)
      )
      const diasParaVencer = 30 - diasDesdeReserva

      if (diasParaVencer <= 5 && diasParaVencer > 0) {
        try {
          const adminUsers = await prisma.user.findMany({
            where: { rol: 'ADMIN' }
          })

          await runWithConcurrency(adminUsers, EMAIL_CONCURRENCY, async (admin) => {
            await enviarAlertaDenominacion(
              admin.email,
              admin.name,
              tramite.denominacionSocial1,
              diasParaVencer,
              tramite.id
            )
          })

          await prisma.tramite.update({
            where: { id: tramite.id },
            data: { alertaDenominacionEnviada: true }
          })

          resultados.denominacionesPorVencer++
        } catch {
          resultados.errores.push(`Denominación ${tramite.id}: error al enviar alerta`)
        }
      }
    })

    // ==========================================
    // 5. SECUENCIA DE RECUPERACIÓN DE BORRADORES
    // ==========================================
    //
    // Reemplaza al recordatorio único que existía antes, que se gastaba de una
    // sola vez por trámite: 21 de los 25 borradores ya lo habían consumido y no
    // iban a recibir nada nunca más.
    //
    // Sólo entran los abandonos RECIENTES. Escribirle cuatro veces seguidas a
    // alguien que se registró hace medio año y no volvió no es seguimiento, es
    // molestar: esos quedan para trabajar a mano desde la pantalla de leads.
    const VENTANA_DIAS = 30

    const limiteViejo = new Date()
    limiteViejo.setDate(limiteViejo.getDate() - VENTANA_DIAS)

    const borradores = await prisma.tramite.findMany({
      where: {
        formularioCompleto: false,
        leadEstado: { notIn: ['CONVERTIDO', 'DESCARTADO'] },
        leadToquesEnviados: { lt: TOQUES.length },
        updatedAt: { gte: limiteViejo },
      },
      include: { user: { select: { email: true, name: true } } },
    })

    await runWithConcurrency(borradores, EMAIL_CONCURRENCY, async (tramite) => {
      const dias = Math.floor(
        (Date.now() - tramite.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
      )

      const indice = tramite.leadToquesEnviados
      const diaDelToque = TOQUES[indice]
      if (dias < diaDelToque) return

      // Además de haber vencido, tiene que haber pasado el espacio que separa a
      // este toque del anterior. Sin esto, alguien que abandonó hace 23 días
      // tendría los cuatro toques vencidos de entrada y recibiría los cuatro
      // mails en cuatro días seguidos.
      if (indice > 0) {
        const separacion = TOQUES[indice] - TOQUES[indice - 1]
        const desdeUltimo = tramite.leadUltimoToque
          ? Math.floor((Date.now() - tramite.leadUltimoToque.getTime()) / (1000 * 60 * 60 * 24))
          : separacion
        if (desdeUltimo < separacion) return
      }

      const datos = leerDatosUsuario(tramite.datosUsuario)
      const email = datos.email || tramite.user.email
      if (!email) return

      const nombre =
        `${datos.nombre || ''} ${datos.apellido || ''}`.trim() || tramite.user.name || ''

      const mensaje = mensajeEmail(segmentoDe(tramite), diaDelToque, nombre)
      const ultimo = indice === TOQUES.length - 1

      try {
        await enviarToqueLead(email, nombre, mensaje.asunto, mensaje.texto, tramite.id, ultimo)

        // Se registra SIEMPRE después de enviar: si algo falla el contador no
        // avanza y el toque se reintenta mañana, en vez de perderse.
        await prisma.tramite.update({
          where: { id: tramite.id },
          data: {
            leadToquesEnviados: { increment: 1 },
            leadUltimoToque: new Date(),
          },
        })

        resultados.toquesLeads++
      } catch {
        resultados.errores.push(`Lead ${tramite.id}: error al enviar el toque ${indice + 1}`)
      }
    })

    return NextResponse.json({
      success: true,
      mensaje: 'Recordatorios procesados exitosamente',
      resultados
    })
  } catch {
    return NextResponse.json(
      {
        error: 'Error al procesar recordatorios',
        resultados
      },
      { status: 500 }
    )
  }
}

