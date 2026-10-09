import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { enviarEmailNotificacion } from '@/lib/emails/send'
import { soloDigitos, validarCbu } from '@/lib/validaciones'
import { enSegundoPlano } from '@/lib/en-segundo-plano'
import { reescalarAportes } from '@/lib/tramites/capital'
import { capitalMinimo } from '@/lib/precios'
import { getPublicConfig } from '@/lib/config'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { banco, alias, titular, montoEsperado, fechaActivacion } = body

    if (!banco || !body.cbu || !titular || !montoEsperado) {
      return NextResponse.json(
        { error: 'Faltan datos obligatorios' },
        { status: 400 }
      )
    }

    // El CBU va al cliente para que deposite: si está mal copiado, la plata no
    // llega. Se validan los dígitos verificadores y se guarda sin separadores.
    const errorCbu = validarCbu(body.cbu)
    if (errorCbu) {
      return NextResponse.json({ error: errorCbu }, { status: 400 })
    }
    const cbu = soloDigitos(body.cbu)

    if (!(Number(montoEsperado) > 0)) {
      return NextResponse.json(
        { error: 'El monto esperado tiene que ser un número mayor a cero' },
        { status: 400 }
      )
    }

    // Verificar que el trámite existe
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

    // El capital se puede corregir desde acá mismo (el cliente suele poner el
    // mínimo y después se redondea): así el monto del 25% y el capital de la
    // sociedad no quedan desfasados.
    if (body.capitalSocial !== undefined && body.capitalSocial !== null && body.capitalSocial !== '') {
      const capitalNuevo = Math.round(Number(body.capitalSocial))
      if (!(capitalNuevo > 0)) {
        return NextResponse.json({ error: 'El capital social tiene que ser un número mayor a cero' }, { status: 400 })
      }
      const minimo = capitalMinimo((await getPublicConfig()).smvm)
      if (capitalNuevo < minimo) {
        return NextResponse.json(
          { error: `El capital social no puede ser menor al mínimo legal ($${minimo.toLocaleString('es-AR')})` },
          { status: 400 }
        )
      }
      if (capitalNuevo !== tramite.capitalSocial) {
        await prisma.tramite.update({
          where: { id },
          data: {
            capitalSocial: capitalNuevo,
            socios: reescalarAportes(tramite.socios, tramite.capitalSocial, capitalNuevo) as object
          }
        })
      }
    }

    // Notificar al cliente con los datos bancarios
    const monto = parseFloat(String(montoEsperado))

    // Guardar o actualizar la cuenta bancaria para el depósito de capital
    // Esto permite que cuando se apruebe el comprobante, se pueda obtener el monto esperado
    await prisma.cuentaBancaria.upsert({
      where: {
        id: `${id}_DEPOSITO_CAPITAL` // ID único basado en tramiteId + tipo
      },
      create: {
        id: `${id}_DEPOSITO_CAPITAL`,
        tramiteId: id,
        tipo: 'DEPOSITO_CAPITAL',
        banco,
        cbu,
        alias: alias || null,
        titular,
        montoEsperado: monto
      },
      update: {
        banco,
        cbu,
        alias: alias || null,
        titular,
        montoEsperado: monto
      }
    })

    // Enviar los datos de la cuenta marca la etapa 6 (Cuenta Bancaria Abierta)
    if (!tramite.cuentaBancariaAbierta) {
      await prisma.tramite.update({
        where: { id },
        data: { cuentaBancariaAbierta: true, fechaCuentaBancariaAbierta: new Date() }
      })
    }

    // Construir mensaje con advertencia de fecha de activación si existe
    let mensajeAdvertencia = ''
    if (fechaActivacion) {
      const fecha = new Date(fechaActivacion)
      const fechaFormateada = fecha.toLocaleDateString('es-AR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
      mensajeAdvertencia = `\n\n⚠️ IMPORTANTE: La cuenta estará operativa recién a partir del ${fechaFormateada}. No realices la transferencia antes de esa fecha, ya que no será procesada.\n`
    }

    const mensajeNotificacion = `Ya podés realizar el depósito en garantía del 25% del capital social. Es un requisito obligatorio del trámite: el dinero queda en garantía en una cuenta que se abre especialmente y se te reintegra a los CBU informados una vez inscripta la Sociedad.\n\n` +
      `💰 Monto a depositar: $${monto.toLocaleString('es-AR')}\n\n` +
      `🏦 Datos de la cuenta:\n` +
      `Banco: ${banco}\n` +
      `CBU: ${cbu}\n` +
      `${alias ? `Alias: ${alias}\n` : ''}` +
      `Titular: ${titular}${mensajeAdvertencia}\n\n` +
      `Una vez hecho el depósito, subí el comprobante desde tu panel y nosotros lo verificamos.`

    // Guardar notificación con datos estructurados en el mensaje (formato JSON al inicio para fácil parsing)
    const metadata = JSON.stringify({ 
      banco, 
      cbu, 
      alias: alias || null, 
      titular, 
      montoEsperado: monto,
      fechaActivacion: fechaActivacion || null
    })
    const mensajeConMetadata = `__METADATA__${metadata}__END__\n\n${mensajeNotificacion}`

    await prisma.notificacion.create({
      data: {
        userId: tramite.userId,
        tramiteId: id,
        tipo: 'ACCION_REQUERIDA',
        titulo: 'Datos para Depósito del 25% del Capital',
        mensaje: mensajeConMetadata,
        link: `/dashboard/tramites/${id}#deposito-capital`
      }
    })

    // Enviar email al usuario
    if (tramite.user) {
      try {
        // El mail no reusa el texto de la notificación: los datos bancarios
        // van en tabla, para que el CBU y el alias se lean y se copien bien.
        enSegundoPlano('admin/tramites/[id]/cuenta-capital', () => enviarEmailNotificacion(
          tramite.user.email,
          tramite.user.name || 'Usuario',
          'Datos para el depósito del 25% del capital',
          'Ya podés hacer el depósito en garantía del 25% del capital social. Es un requisito obligatorio del trámite: ' +
            'el dinero queda en una cuenta abierta especialmente para tu Sociedad y se te reintegra a los CBU ' +
            'informados una vez inscripta.',
          id,
          {
            tono: 'accion',
            destacado: { etiqueta: 'Monto a depositar', valor: `$${monto.toLocaleString('es-AR')}` },
            datos: [
              { etiqueta: 'Banco', valor: banco },
              { etiqueta: 'CBU', valor: cbu, mono: true },
              ...(alias ? [{ etiqueta: 'Alias', valor: alias, mono: true }] : []),
              { etiqueta: 'Titular', valor: titular },
            ],
            aviso: mensajeAdvertencia
              ? mensajeAdvertencia.replace('⚠️ IMPORTANTE: ', '').trim()
              : undefined,
            pasos: [
              { titulo: 'Transferí el monto exacto', detalle: 'Desde cualquier cuenta, a los datos de arriba.' },
              { titulo: 'Subí el comprobante', detalle: 'Desde tu panel, en la sección del depósito.' },
              { titulo: 'Lo verificamos', detalle: 'Te avisamos apenas esté acreditado y seguimos con la inscripción.' },
            ],
            cta: { texto: 'Subir el comprobante', ancla: 'deposito-capital' },
          }
        ))
      } catch {
        // Email sending failed (non-critical)
      }
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Error al guardar los datos bancarios' },
      { status: 500 }
    )
  }
}


