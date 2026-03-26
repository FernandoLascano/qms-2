import { sendEmail as sendEmailNodemailer } from '@/lib/email'
import * as templates from './templates'

interface SendEmailParams {
  to: string
  subject: string
  template: keyof typeof templates
  data: Record<string, any>
}

export async function sendEmail({ to, subject, template, data }: SendEmailParams) {
  try {
    const templateFunction = templates[template]

    if (!templateFunction) {
      throw new Error(`Template "${template}" no encontrada`)
    }

    const html = templateFunction(data as any)

    const nodemailerResult = await sendEmailNodemailer({
      to,
      subject,
      html
    })

    if (nodemailerResult.success) {
      return { success: true, result: nodemailerResult }
    } else {
      throw new Error(nodemailerResult.error || 'Error al enviar email via Nodemailer')
    }

  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Funciones específicas para cada tipo de email

export async function enviarEmailBienvenida(email: string, nombre: string) {
  return sendEmail({
    to: email,
    subject: '¡Bienvenido a QuieroMiSAS! Tu cuenta ha sido creada',
    template: 'emailBienvenida',
    data: { nombre }
  })
}

export async function enviarEmailVerificacionCuenta(params: { email: string; nombre: string; verifyUrl: string }) {
  return sendEmail({
    to: params.email,
    subject: 'Confirmá tu email para activar tu cuenta',
    template: 'emailVerificarCuenta',
    data: { nombre: params.nombre, verifyUrl: params.verifyUrl },
  })
}

export async function enviarEmailTramiteEnviado(
  email: string,
  nombre: string,
  tramiteId: string,
  denominacion: string
) {
  return sendEmail({
    to: email,
    subject: '✅ Trámite recibido - ' + denominacion,
    template: 'emailTramiteEnviado',
    data: { nombre, tramiteId, denominacion }
  })
}

export async function enviarEmailPagoPendiente(
  email: string,
  nombre: string,
  concepto: string,
  monto: number,
  tramiteId: string
) {
  return sendEmail({
    to: email,
    subject: '💳 Pago requerido - ' + concepto,
    template: 'emailPagoPendiente',
    data: { nombre, concepto, monto, tramiteId }
  })
}

export async function enviarEmailDocumentoRechazado(
  email: string,
  nombre: string,
  nombreDocumento: string,
  observaciones: string,
  tramiteId: string
) {
  return sendEmail({
    to: email,
    subject: '📄 Documento requiere corrección - ' + nombreDocumento,
    template: 'emailDocumentoRechazado',
    data: { nombre, nombreDocumento, observaciones, tramiteId }
  })
}

export async function enviarEmailEtapaCompletada(
  email: string,
  nombre: string,
  etapa: string,
  tramiteId: string
) {
  return sendEmail({
    to: email,
    subject: '🎯 Progreso en tu trámite - ' + etapa,
    template: 'emailEtapaCompletada',
    data: { nombre, etapa, tramiteId }
  })
}

export async function enviarEmailSociedadInscripta(
  email: string,
  nombre: string,
  denominacion: string,
  cuit: string | null,
  matricula: string | null,
  tramiteId: string
) {
  return sendEmail({
    to: email,
    subject: '🎉 ¡Felicitaciones! Tu sociedad está inscripta - ' + denominacion,
    template: 'emailSociedadInscripta',
    data: { nombre, denominacion, cuit, matricula, tramiteId }
  })
}

export async function enviarEmailNotificacion(
  email: string,
  nombre: string,
  titulo: string,
  mensaje: string,
  tramiteId?: string
) {
  return sendEmail({
    to: email,
    subject: titulo,
    template: 'emailNotificacion',
    data: { nombre, titulo, mensaje, tramiteId }
  })
}

// ==========================================
// RECORDATORIOS AUTOMÁTICOS
// ==========================================

export async function enviarRecordatorioPago(
  email: string,
  nombre: string,
  concepto: string,
  monto: number,
  diasPendientes: number,
  tramiteId: string
) {
  return sendEmail({
    to: email,
    subject: `⏰ Recordatorio: Pago pendiente - ${concepto}`,
    template: 'emailRecordatorioPago',
    data: { nombre, concepto, monto, diasPendientes, tramiteId }
  })
}

export async function enviarRecordatorioDocumento(
  email: string,
  nombre: string,
  nombreDocumento: string,
  observaciones: string,
  diasPendientes: number,
  tramiteId: string
) {
  return sendEmail({
    to: email,
    subject: `⏰ Recordatorio: Documento pendiente - ${nombreDocumento}`,
    template: 'emailRecordatorioDocumento',
    data: { nombre, nombreDocumento, observaciones, diasPendientes, tramiteId }
  })
}

export async function enviarRecordatorioTramiteEstancado(
  email: string,
  nombre: string,
  etapaActual: string,
  diasEstancado: number,
  tramiteId: string
) {
  return sendEmail({
    to: email,
    subject: `👋 ¿Necesitas ayuda con tu trámite?`,
    template: 'emailRecordatorioTramiteEstancado',
    data: { nombre, etapaActual, diasEstancado, tramiteId }
  })
}

export async function enviarAlertaDenominacion(
  email: string,
  nombre: string,
  denominacion: string,
  diasParaVencer: number,
  tramiteId: string
) {
  return sendEmail({
    to: email,
    subject: `⚠️ Alerta: Denominación próxima a vencer - ${denominacion}`,
    template: 'emailAlertaDenominacion',
    data: { nombre, denominacion, diasParaVencer, tramiteId }
  })
}

export async function enviarEmailValidacionTramite(
  email: string,
  nombre: string,
  denominacion: string,
  validado: boolean,
  observaciones?: string,
  tramiteId?: string
) {
  return sendEmail({
    to: email,
    subject: validado 
      ? `✅ Trámite validado - ${denominacion}`
      : `⚠️ Trámite requiere correcciones - ${denominacion}`,
    template: 'emailValidacionTramite',
    data: { nombre, denominacion, validado, observaciones, tramiteId }
  })
}

// Email para notificar a admins cuando un usuario completa un formulario nuevo
export async function enviarEmailNuevoTramiteAdmin(
  email: string,
  nombreAdmin: string,
  nombreCliente: string,
  denominacion: string,
  tramiteId: string
) {
  return sendEmail({
    to: email,
    subject: `🆕 Nuevo trámite recibido - ${denominacion}`,
    template: 'emailNotificacion',
    data: { 
      nombre: nombreAdmin,
      titulo: 'Nuevo trámite recibido',
      mensaje: `El cliente ${nombreCliente} ha completado el formulario para la sociedad "${denominacion}". El trámite está pendiente de validación inicial.`,
      tramiteId 
    }
  })
}
