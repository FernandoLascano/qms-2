import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { enviarEmailEtapaCompletada, enviarEmailSociedadInscripta } from '@/lib/emails/send'

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
    const { etapa, valor } = await request.json()

    // Validar que la etapa sea válida
    const etapasValidas = [
      'formularioCompleto',
      'denominacionReservada',
      'capitalDepositado',
      'tasaPagada',
      'documentosRevisados',
      'documentosFirmados',
      'tramiteIngresado',
      'sociedadInscripta'
    ]

    if (!etapasValidas.includes(etapa)) {
      return NextResponse.json(
        { error: 'Etapa no válida' },
        { status: 400 }
      )
    }

    // Preparar el objeto de actualización
    const updateData: any = {
      [etapa]: valor
    }

    const ahora = new Date()

    // Mapeo de etapas a campos de fecha y tracking
    const mapeoEtapas: Record<string, { fecha: string, tracking: string }> = {
      'formularioCompleto': { fecha: 'fechaFormularioCompleto', tracking: 'fechaFormularioCompleto' },
      'denominacionReservada': { fecha: 'fechaReservaNombre', tracking: 'fechaDenominacionReservada' },
      'capitalDepositado': { fecha: 'fechaDepositoCapital', tracking: 'fechaCapitalDepositado' },
      'tasaPagada': { fecha: 'fechaPagoTasa', tracking: 'fechaTasaPagada' },
      'documentosRevisados': { fecha: '', tracking: 'fechaDocumentosRevisados' },
      'documentosFirmados': { fecha: '', tracking: 'fechaDocumentosFirmados' },
      'tramiteIngresado': { fecha: 'fechaIngresoTramite', tracking: 'fechaTramiteIngresado' },
      'sociedadInscripta': { fecha: 'fechaInscripcion', tracking: 'fechaSociedadInscripta' }
    }

    // Si se marca una etapa como completada, agregar fechas de tracking
    if (valor && mapeoEtapas[etapa]) {
      const mapeo = mapeoEtapas[etapa]
      
      // Agregar fecha de tracking (siempre)
      updateData[mapeo.tracking] = ahora
      
      // Agregar fecha específica si existe
      if (mapeo.fecha) {
        updateData[mapeo.fecha] = ahora
      }
    }

    // Actualizar etapa
    const tramite = await prisma.tramite.update({
      where: { id },
      data: updateData
    })

    // Crear eventos automáticos según la etapa completada
    if (valor) {
      try {
        // Si se reserva la denominación, crear evento de vencimiento (30 días después)
        if (etapa === 'denominacionReservada' && updateData.fechaDenominacionReservada) {
          const fechaVencimiento = new Date(updateData.fechaDenominacionReservada)
          fechaVencimiento.setDate(fechaVencimiento.getDate() + 30) // 30 días de vigencia

          await prisma.evento.create({
            data: {
              tramiteId: id,
              titulo: `Vencimiento de Reserva: ${tramite.denominacionSocial1}`,
              descripcion: `La reserva de denominación vence el ${fechaVencimiento.toLocaleDateString('es-AR')}`,
              tipo: 'VENCIMIENTO_DENOMINACION',
              fechaInicio: fechaVencimiento,
              relacionadoCon: 'denominacion'
            }
          })
        }

        // Si se ingresa el trámite, crear evento de fecha límite estimada (45 días después)
        if (etapa === 'tramiteIngresado' && updateData.fechaTramiteIngresado) {
          const fechaLimite = new Date(updateData.fechaTramiteIngresado)
          fechaLimite.setDate(fechaLimite.getDate() + 45) // Estimación de 45 días

          await prisma.evento.create({
            data: {
              tramiteId: id,
              titulo: `Fecha Límite Estimada: ${tramite.denominacionSocial1}`,
              descripcion: `Fecha límite estimada para la inscripción de la sociedad`,
              tipo: 'FECHA_LIMITE_TRAMITE',
              fechaInicio: fechaLimite,
              relacionadoCon: 'tramite'
            }
          })
        }
      } catch (error) {
        // No fallar si no se puede crear el evento (puede ser que el modelo aún no exista)
        console.error('Error al crear evento automático:', error)
      }
    }

    // Notificar al usuario si es una etapa importante
    if (valor) {
      const mensajesEtapas: { [key: string]: string } = {
        denominacionReservada: 'La denominación de tu sociedad ha sido reservada exitosamente.',
        capitalDepositado: 'Se ha confirmado el depósito del 25% del capital social.',
        tasaPagada: 'El pago de la tasa retributiva ha sido confirmado.',
        tramiteIngresado: 'Tu trámite ha sido ingresado en el organismo correspondiente.',
        sociedadInscripta: '¡Felicitaciones! Tu sociedad ha sido inscripta exitosamente.'
      }

      const nombresEtapas: { [key: string]: string } = {
        denominacionReservada: 'Denominación Reservada',
        capitalDepositado: 'Capital Depositado',
        tasaPagada: 'Tasa Pagada',
        documentosFirmados: 'Documentos Firmados',
        tramiteIngresado: 'Trámite Ingresado',
        sociedadInscripta: 'Sociedad Inscripta'
      }

      if (mensajesEtapas[etapa]) {
        await prisma.notificacion.create({
          data: {
            userId: tramite.userId,
            tramiteId: id,
            tipo: etapa === 'sociedadInscripta' ? 'EXITO' : 'INFO',
            titulo: `Etapa completada: ${etapa.replace(/([A-Z])/g, ' $1').trim()}`,
            mensaje: mensajesEtapas[etapa]
          }
        })

        // Obtener usuario para enviar email
        const usuario = await prisma.user.findUnique({
          where: { id: tramite.userId }
        })

        if (usuario) {
          try {
            // Si es la etapa final (sociedad inscripta), enviar email especial
            if (etapa === 'sociedadInscripta') {
              await enviarEmailSociedadInscripta(
                usuario.email,
                usuario.name,
                tramite.denominacionAprobada || tramite.denominacionSocial1,
                tramite.cuit,
                tramite.matricula,
                id
              )
            } 
            // Para otras etapas importantes, enviar email de progreso
            else if (nombresEtapas[etapa]) {
              await enviarEmailEtapaCompletada(
                usuario.email,
                usuario.name,
                nombresEtapas[etapa],
                id
              )
            }
          } catch (emailError) {
            console.error("Error al enviar email de etapa completada (no crítico):", emailError)
          }
        }
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error al actualizar etapa:', error)
    return NextResponse.json(
      { error: 'Error al actualizar etapa' },
      { status: 500 }
    )
  }
}

