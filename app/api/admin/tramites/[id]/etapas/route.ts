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
      'honorariosPagados',
      'homonimiaAnalizada',
      'ciudadanoDigitalOk',
      'denominacionReservada',
      'cuentaBancariaAbierta',
      'capitalDepositado',
      'tasaPagada',
      'borradorEnviado',
      'borradorAprobadoCliente',
      'documentosRevisados',
      'documentosFirmados',
      'tramiteIngresado',
      'tramiteObservado',
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
      'honorariosPagados': { fecha: '', tracking: 'fechaHonorariosPagados' },
      'homonimiaAnalizada': { fecha: '', tracking: 'fechaHomonimiaAnalizada' },
      'ciudadanoDigitalOk': { fecha: '', tracking: 'fechaCiudadanoDigitalOk' },
      'denominacionReservada': { fecha: 'fechaReservaNombre', tracking: 'fechaDenominacionReservada' },
      'cuentaBancariaAbierta': { fecha: '', tracking: 'fechaCuentaBancariaAbierta' },
      'capitalDepositado': { fecha: 'fechaDepositoCapital', tracking: 'fechaCapitalDepositado' },
      'tasaPagada': { fecha: 'fechaPagoTasa', tracking: 'fechaTasaPagada' },
      'borradorEnviado': { fecha: '', tracking: 'fechaBorradorEnviado' },
      'borradorAprobadoCliente': { fecha: '', tracking: 'fechaBorradorAprobadoCliente' },
      'documentosRevisados': { fecha: '', tracking: 'fechaDocumentosRevisados' },
      'documentosFirmados': { fecha: '', tracking: 'fechaDocumentosFirmados' },
      'tramiteIngresado': { fecha: 'fechaIngresoTramite', tracking: 'fechaTramiteIngresado' },
      'tramiteObservado': { fecha: '', tracking: 'fechaTramiteObservado' },
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
      } catch {
        // No fallar si no se puede crear el evento (puede ser que el modelo aún no exista)
      }
    }

    // Notificar al usuario si es una etapa importante
    if (valor) {
      const mensajesEtapas: { [key: string]: string } = {
        honorariosPagados: 'Confirmamos el pago de los honorarios. ¡Seguimos avanzando con tu trámite!',
        denominacionReservada: 'La denominación de tu sociedad fue reservada. Próximamente te vamos a enviar el enlace de pago de la tasa retributiva de servicios de IPJ y los datos para realizar el depósito en garantía del 25% del capital. Ese depósito se hace en una cuenta que se abre especialmente para el trámite y se restituye a los CBU informados una vez inscripta la Sociedad.',
        capitalDepositado: 'Se ha confirmado el depósito del 25% del capital social.',
        tasaPagada: 'El pago de la tasa retributiva ha sido confirmado.',
        borradorEnviado: 'Te enviamos el borrador de los documentos de tu Sociedad. Revisalo con atención desde tu panel y, si está todo correcto, aprobalo. Con tu aprobación preparamos la versión final para la firma.',
        tramiteIngresado: '¡Tu sociedad está cada vez más cerca! Ya ingresamos formalmente el trámite en el organismo. Normalmente la resolución de inscripción sale dentro de los 1 a 4 días hábiles. Te avisamos apenas esté lista.',
        tramiteObservado: 'El organismo observó el trámite. Ya lo estamos gestionando; te mantendremos al tanto.',
        sociedadInscripta: '¡Felicitaciones! Tu sociedad ha sido inscripta exitosamente.'
      }

      const nombresEtapas: { [key: string]: string } = {
        honorariosPagados: 'Honorarios Pagados',
        denominacionReservada: 'Reserva de Denominación',
        capitalDepositado: 'Capital Depositado',
        tasaPagada: 'Tasa Pagada',
        borradorEnviado: 'Borrador Enviado',
        documentosFirmados: 'Documentos Firmados',
        tramiteIngresado: 'Trámite Ingresado',
        tramiteObservado: 'Trámite Observado',
        sociedadInscripta: 'Sociedad Inscripta'
      }

      if (mensajesEtapas[etapa]) {
        await prisma.notificacion.create({
          data: {
            userId: tramite.userId,
            tramiteId: id,
            tipo: etapa === 'sociedadInscripta' ? 'EXITO' : 'INFO',
            titulo: `Etapa completada: ${etapa.replace(/([A-Z])/g, ' $1').trim()}`,
            mensaje: mensajesEtapas[etapa],
            link: `/dashboard/tramites/${id}`
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
                id,
                tramite.plan
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
          } catch {
            // Email sending failed (non-critical)
          }
        }
      }
    }

    return NextResponse.json({ success: true })

  } catch {
    return NextResponse.json(
      { error: 'Error al actualizar etapa' },
      { status: 500 }
    )
  }
}

